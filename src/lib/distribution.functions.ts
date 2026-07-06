import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { VENUES } from "@/lib/venues";

const Input = z.object({ campaign_id: z.string().uuid() });

/**
 * AI-driven distribution: greedy allocation across matching venues within budget,
 * scheduled evenly between the campaign start and end. Deterministic + fast.
 */
export const distributeCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", data.campaign_id)
      .single();
    if (error || !campaign) throw new Error("Campaign not found");

    // wipe any prior schedule
    await supabase.from("schedule_slots").delete().eq("campaign_id", campaign.id);

    const matching = VENUES.filter(
      (v) => campaign.venues.includes(v.category) && campaign.regions.includes(v.region),
    );
    if (matching.length === 0) {
      return { slots: 0, message: "No venues matched targeting" };
    }

    const start = new Date(campaign.starts_at).getTime();
    const end = new Date(campaign.ends_at).getTime();
    const durationMs = Math.max(end - start, 60_000);

    let remaining = Number(campaign.budget_pi);
    const slots: Array<{
      campaign_id: string;
      venue_id: string;
      venue_name: string;
      region: string;
      slot_start: string;
      duration_sec: number;
      cost_pi: number;
      impressions_est: number;
    }> = [];

    // Round-robin across venues so distribution is broad, not concentrated.
    let i = 0;
    let played = 0;
    while (remaining > 0 && slots.length < 500) {
      const v = matching[i % matching.length];
      if (v.rate_pi_per_slot > remaining) break;
      const offset = (played / 40) * durationMs;
      slots.push({
        campaign_id: campaign.id,
        venue_id: v.id,
        venue_name: `${v.name} · ${v.city}`,
        region: v.region,
        slot_start: new Date(start + Math.min(offset, durationMs - 1)).toISOString(),
        duration_sec: v.slot_seconds,
        cost_pi: v.rate_pi_per_slot,
        impressions_est: v.avg_impressions_per_slot,
      });
      remaining -= v.rate_pi_per_slot;
      i += 1;
      played += 1;
    }

    if (slots.length > 0) {
      const { error: insErr } = await supabase.from("schedule_slots").insert(slots);
      if (insErr) throw new Error(insErr.message);
    }
    await supabase.from("campaigns").update({ status: "running" }).eq("id", campaign.id);
    return { slots: slots.length, planned_spend: Number(campaign.budget_pi) - remaining };
  });

export const tickPlays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Mark up to 3 unplayed slots as played and log settlement events.
    const { data: pending } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("campaign_id", data.campaign_id)
      .eq("played", false)
      .order("slot_start", { ascending: true })
      .limit(3);
    if (!pending || pending.length === 0) {
      await supabase.from("campaigns").update({ status: "settled" }).eq("id", data.campaign_id);
      return { played: 0, done: true };
    }
    const { data: contract } = await supabase
      .from("contracts")
      .select("id")
      .eq("campaign_id", data.campaign_id)
      .maybeSingle();

    const now = new Date().toISOString();
    for (const s of pending) {
      await supabase.from("schedule_slots").update({ played: true, played_at: now }).eq("id", s.id);
      const { data: camp } = await supabase
        .from("campaigns")
        .select("spent_pi, budget_pi")
        .eq("id", data.campaign_id)
        .single();
      if (camp) {
        await supabase
          .from("campaigns")
          .update({ spent_pi: Number(camp.spent_pi) + Number(s.cost_pi) })
          .eq("id", data.campaign_id);
      }
      if (contract) {
        // Mock settlement tx hash (32 hex chars * 2). Real Stellar payment would replace this.
        const fakeHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        await supabase.from("contract_events").insert({
          contract_id: contract.id,
          event_type: "play.settled",
          amount_pi: Number(s.cost_pi),
          tx_hash: fakeHash,
          payload: { venue: s.venue_name, impressions: s.impressions_est, slot_id: s.id },
        });
      }
    }
    return { played: pending.length, done: false };
  });