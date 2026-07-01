import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const FeedSchema = z.object({
  updates: z
    .array(
      z.object({
        title: z.string(),
        category: z.enum([
          "AI Creative",
          "Venue Network",
          "Pi Payments",
          "Targeting",
          "Analytics",
          "Platform",
        ]),
        summary: z.string(),
        impact: z.string(),
      }),
    )
    .length(6),
});

export const generateInnovationFeed = createServerFn({ method: "POST" }).handler(
  async () => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const seed = new Date().toISOString().slice(0, 13) + ":" + Math.random().toString(36).slice(2, 8);

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: FeedSchema }),
      system:
        "You are the product-innovation bot for PiBoards, an app that lets users design AI-generated ads and run them on stadium jumbotrons, arena LED ribbons, and global street billboards, with campaigns auctioned in real time and settled instantly in Pi Network cryptocurrency. Invent fresh, plausible, forward-looking product updates tailored to this exact product. Each update should feel like a real changelog entry a user would see today: concrete, specific, and useful. Avoid generic AI buzzwords.",
      prompt: `Generate 6 brand-new innovative feature updates for PiBoards users. Mix categories across creative tools, venue expansion, Pi payment UX, targeting, analytics, and platform. Keep titles under 8 words. Summaries 1-2 sentences. Impact is one short sentence explaining what the user can now do. Vary every generation. Seed: ${seed}`,
    });

    return { updates: output.updates, generatedAt: new Date().toISOString() };
  },
);