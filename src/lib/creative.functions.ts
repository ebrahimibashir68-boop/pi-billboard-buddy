import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const CopySchema = z.object({
  headline: z.string(),
  body: z.string(),
});

const Input = z.object({
  campaign_id: z.string().uuid(),
  brand: z.string().min(1),
  pitch: z.string().min(1),
  ad_type: z.enum(["text", "image", "both"]),
  venue_category: z.enum(["stadium_jumbotron", "arena_led_ribbon", "street_billboard"]),
});

export const generateCreative = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `Brand: ${data.brand}\nPitch: ${data.pitch}\nVenue: ${data.venue_category}\n\nWrite one bold headline (<=8 words, no emojis, no hashtags) and one supporting line (<=140 chars) for a billboard ad. Return as JSON with { headline, body }.`;

    let headline = "";
    let body = "";
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: CopySchema }),
        prompt,
      });
      headline = output.headline.slice(0, 100);
      body = output.body.slice(0, 200);
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        const raw = (err.text ?? "").replace(/```json|```/g, "").trim();
        try {
          const parsed = JSON.parse(raw) as { headline?: string; body?: string };
          headline = (parsed.headline ?? data.brand).slice(0, 100);
          body = (parsed.body ?? data.pitch).slice(0, 200);
        } catch {
          headline = data.brand;
          body = data.pitch.slice(0, 200);
        }
      } else {
        throw err;
      }
    }

    let image_url: string | null = null;
    if (data.ad_type !== "text") {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            prompt: `A cinematic 16:9 billboard ad mockup for "${data.brand}". Headline: "${headline}". ${data.pitch}. Bold, high-contrast, no text overlays.`,
            n: 1,
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
          const item = json.data?.[0];
          if (item?.b64_json) image_url = `data:image/png;base64,${item.b64_json}`;
          else if (item?.url) image_url = item.url;
        }
      } catch (e) {
        console.error("[image gen]", e);
      }
    }

    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("campaign_creatives")
      .insert({
        campaign_id: data.campaign_id,
        headline,
        body,
        image_url,
        model: "google/gemini-3-flash-preview",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });