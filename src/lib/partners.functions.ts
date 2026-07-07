import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: partners, error }, { data: regs }] = await Promise.all([
      supabase.from("ad_partners").select("*").order("name"),
      supabase.from("partner_registrations").select("*").eq("advertiser_id", userId),
    ]);
    if (error) throw new Error(error.message);
    const regByPartner = new Map((regs ?? []).map((r) => [r.partner_id, r]));
    return (partners ?? []).map((p) => ({
      ...p,
      registration: regByPartner.get(p.id) ?? null,
    }));
  });

export const getPartnerBySlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: partner, error } = await supabase
      .from("ad_partners")
      .select("*")
      .eq("slug", data.slug)
      .single();
    if (error || !partner) throw new Error("Partner not found");
    const { data: reg } = await supabase
      .from("partner_registrations")
      .select("*")
      .eq("advertiser_id", userId)
      .eq("partner_id", partner.id)
      .maybeSingle();
    return { partner, registration: reg };
  });

export const registerWithPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ partner_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("ad_partners")
      .select("adapter")
      .eq("id", data.partner_id)
      .single();
    if (!partner) throw new Error("Partner not found");
    // Simulated partners auto-approve; real adapters go into pending.
    const status = partner.adapter === "simulated" ? "approved" : "pending";
    const { data: row, error } = await supabase
      .from("partner_registrations")
      .upsert(
        {
          advertiser_id: userId,
          partner_id: data.partner_id,
          status,
          decided_at: status === "approved" ? new Date().toISOString() : null,
          notes: status === "approved"
            ? "Auto-approved via simulated onboarding."
            : "Awaiting real partner onboarding — requires API credentials on the partner side.",
        },
        { onConflict: "advertiser_id,partner_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });