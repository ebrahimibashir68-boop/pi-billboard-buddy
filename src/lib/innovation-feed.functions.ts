import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const FeedSchema = z.object({
  updates: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      summary: z.string(),
      impact: z.string(),
    }),
  ),
});

const ALLOWED_CATEGORIES = [
  "AI Creative",
  "Venue Network",
  "Pi Payments",
  "Targeting",
  "Analytics",
  "Platform",
];

export const generateInnovationFeed = createServerFn({ method: "POST" }).handler(
  async () => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const seed = new Date().toISOString().slice(0, 13) + ":" + Math.random().toString(36).slice(2, 8);

    const system =
      "You are the product-innovation bot for PiBoards, an app that lets users design AI-generated ads and run them on stadium jumbotrons, arena LED ribbons, and global street billboards, with campaigns auctioned in real time and settled instantly in Pi Network cryptocurrency. Invent fresh, plausible, forward-looking product updates tailored to this exact product. Each update should feel like a real changelog entry a user would see today: concrete, specific, and useful. Avoid generic AI buzzwords.";
    const prompt = `Generate exactly 6 brand-new innovative feature updates for PiBoards users. Mix categories across: AI Creative, Venue Network, Pi Payments, Targeting, Analytics, Platform (use one of these exact strings as "category"). Keep titles under 8 words. Summaries 1-2 sentences. Impact is one short sentence explaining what the user can now do. Vary every generation. Seed: ${seed}`;

    let parsed: z.infer<typeof FeedSchema> | null = null;
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({ schema: FeedSchema }),
        system,
        prompt,
      });
      parsed = output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error) && error.text) {
        const cleaned = error.text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const start = cleaned.search(/[{[]/);
        const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
        if (start !== -1 && end !== -1) {
          try {
            parsed = FeedSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
          } catch {}
        }
      }
      if (!parsed) throw error;
    }

    const updates = parsed.updates.slice(0, 6).map((u) => ({
      ...u,
      category: ALLOWED_CATEGORIES.includes(u.category) ? u.category : "Platform",
    }));

    return { updates, generatedAt: new Date().toISOString() };
  },
);