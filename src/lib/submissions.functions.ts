import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { resolveAdapter } from "@/lib/partner-adapters";

const AiCheckSchema = z.object({
  passed: z.boolean(),
  flags: z.array(z.string()),
  notes: z.string(),
});

const SubmitInput = z.object({
  campaign_id: z.string().uuid(),
  creative_id: z.string().uuid(),
  partner_id: z.string().uuid(),
});

export const submitCreative = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify ownership + registration
    const [{ data: campaign }, { data: creative }, { data: partner }, { data: reg }] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", data.campaign_id).single(),
      supabase.from("campaign_creatives").select("*").eq("id", data.creative_id).single(),
      supabase.from("ad_partners").select("*").eq("id", data.partner_id).single(),
      supabase.from("partner_registrations").select("*").eq("advertiser_id", userId).eq("partner_id", data.partner_id).maybeSingle(),
    ]);
    if (!campaign || campaign.owner_id !== userId) throw new Error("Campaign not found");
    if (!creative || creative.campaign_id !== campaign.id) throw new Error("Creative not found");
    if (!partner) throw new Error("Partner not found");
    if (!reg || reg.status !== "approved") throw new Error("You are not registered with this partner");

    // Insert pending submission row
    const { data: sub, error: insErr } = await supabase
      .from("ad_submissions")
      .insert({
        campaign_id: campaign.id,
        creative_id: creative.id,
        partner_id: partner.id,
        advertiser_id: userId,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    // 1. AI pre-check
    const key = process.env.LOVABLE_API_KEY;
    let aiCheck: "passed" | "flagged" = "passed";
    let aiNotes = "Auto-approved (no AI key configured).";
    let aiFlags: string[] = [];
    if (key) {
      try {
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const { output } = await generateText({
          model,
          output: Output.object({ schema: AiCheckSchema }),
          prompt: `You are a billboard-ad content moderator for partner "${partner.name}". Review the ad below and return JSON { passed, flags, notes }.
Reject only for: explicit sexual content, hate, illegal drugs, unlicensed impersonation of a real person, misleading medical/financial claims, or clearly copyrighted characters used without permission.
Brand: ${campaign.brand}
Headline: ${creative.headline ?? "(none)"}
Body: ${creative.body ?? "(none)"}
Kind: ${creative.kind}
Image: ${creative.image_url ? "provided" : "none"}`,
        });
        aiCheck = output.passed ? "passed" : "flagged";
        aiFlags = output.flags.slice(0, 10);
        aiNotes = output.notes.slice(0, 500);
      } catch (err) {
        if (NoObjectGeneratedError.isInstance(err)) {
          aiCheck = "passed";
          aiNotes = "AI pre-check response unparseable; defaulting to pass.";
        } else {
          aiCheck = "passed";
          aiNotes = `AI pre-check skipped: ${err instanceof Error ? err.message : "unknown"}`;
        }
      }
    }

    // 2. Partner review via adapter
    let partnerReview: "pending" | "approved" | "rejected" | "skipped" = "pending";
    let partnerNotes = "Pending partner review.";
    if (aiCheck === "passed") {
      const adapter = resolveAdapter(partner.adapter, partner.api_key_secret_name);
      const result = await adapter.submitForReview({
        submission_id: sub.id,
        partner_slug: partner.slug,
        headline: creative.headline,
        body: creative.body,
        image_url: creative.image_url,
        kind: creative.kind,
        brand: campaign.brand,
      });
      partnerReview = result.decision;
      partnerNotes = result.notes;
    } else {
      partnerReview = "skipped";
      partnerNotes = "Skipped — failed AI pre-check.";
    }

    const { data: updated, error: upErr } = await supabase
      .from("ad_submissions")
      .update({
        ai_check: aiCheck,
        ai_flags: aiFlags,
        ai_notes: aiNotes,
        partner_review: partnerReview,
        partner_notes: partnerNotes,
        decided_at: partnerReview !== "pending" ? new Date().toISOString() : null,
      })
      .eq("id", sub.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);
    return updated;
  });

export const listMySubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ campaign_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: subs, error } = await supabase
      .from("ad_submissions")
      .select("*, ad_partners(name, slug, logo_emoji), campaign_creatives(headline, kind)")
      .eq("campaign_id", data.campaign_id)
      .eq("advertiser_id", userId)
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return subs ?? [];
  });

export const listPartnerQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ partner_slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: partner } = await supabase
      .from("ad_partners")
      .select("id, name, slug")
      .eq("slug", data.partner_slug)
      .single();
    if (!partner) throw new Error("Partner not found");
    const { data: assigned } = await supabase
      .from("partner_admin_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("partner_id", partner.id)
      .maybeSingle();
    if (!assigned) throw new Error("Not authorized to review this partner's queue");
    const { data: subs, error } = await supabase
      .from("ad_submissions")
      .select("*, campaign_creatives(headline, body, image_url, kind), campaigns(brand)")
      .eq("partner_id", partner.id)
      .order("submitted_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { partner, submissions: subs ?? [] };
  });

export const decideSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    submission_id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    notes: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // RLS: partner_admin_assignments enforces access.
    const { data: row, error } = await supabase
      .from("ad_submissions")
      .update({
        partner_review: data.decision,
        partner_notes: data.notes ?? (data.decision === "approved" ? "Approved by partner staff." : "Rejected by partner staff."),
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.submission_id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });