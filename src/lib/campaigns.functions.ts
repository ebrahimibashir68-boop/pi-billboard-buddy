import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateInput = z.object({
  brand: z.string().min(1).max(120),
  pitch: z.string().min(1).max(1000),
  ad_type: z.enum(["text", "image", "both"]),
  venues: z.array(z.string()).min(1).max(3),
  regions: z.array(z.string()).min(1).max(4),
  budget_pi: z.number().positive().max(1_000_000),
  starts_at: z.string(),
  ends_at: z.string(),
});

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("campaigns")
      .insert({ ...data, owner_id: userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: campaign }, { data: creatives }, { data: contract }, { data: slots }] =
      await Promise.all([
        supabase.from("campaigns").select("*").eq("id", data.id).single(),
        supabase.from("campaign_creatives").select("*").eq("campaign_id", data.id).order("created_at", { ascending: false }),
        supabase.from("contracts").select("*").eq("campaign_id", data.id).maybeSingle(),
        supabase.from("schedule_slots").select("*").eq("campaign_id", data.id).order("slot_start", { ascending: true }),
      ]);
    if (!campaign) throw new Error("Campaign not found");
    type EventRow = {
      id: string;
      contract_id: string;
      event_type: string;
      amount_pi: number | null;
      tx_hash: string | null;
      payload_json: string;
      created_at: string;
    };
    let events: EventRow[] = [];
    if (contract) {
      const { data: ev } = await supabase
        .from("contract_events")
        .select("*")
        .eq("contract_id", contract.id)
        .order("created_at", { ascending: false })
        .limit(50);
      events = (ev ?? []).map((e) => ({
        id: e.id,
        contract_id: e.contract_id,
        event_type: e.event_type,
        amount_pi: e.amount_pi,
        tx_hash: e.tx_hash,
        payload_json: JSON.stringify(e.payload ?? {}),
        created_at: e.created_at,
      }));
    }
    return { campaign, creatives: creatives ?? [], contract, slots: slots ?? [], events };
  });