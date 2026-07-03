import { defineTool } from "@lovable.dev/mcp-js";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export default defineTool({
  name: "generate_ad_concepts",
  title: "Generate PiBoards ad concepts",
  description:
    "Generate 3 short ad concepts (headline + one-line visual direction) for a brand or product, tailored to a PiBoards venue category.",
  inputSchema: {
    brand: z.string().min(1).max(200).describe("Brand or product name"),
    pitch: z.string().min(1).max(600).describe("What the brand does or wants to promote"),
    venue: z
      .enum(["stadium_jumbotron", "arena_led_ribbon", "street_billboard"])
      .describe("Target PiBoards venue category"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ brand, pitch, venue }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        content: [{ type: "text", text: "AI gateway not configured (missing LOVABLE_API_KEY)." }],
        isError: true,
      };
    }
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You write short, punchy out-of-home ad concepts for PiBoards. Respect the venue's dwell time and format. No emojis. No hashtags.",
      prompt: `Brand: ${brand}\nPitch: ${pitch}\nVenue: ${venue}\n\nReturn exactly 3 concepts, numbered 1-3. Each concept: one bold headline (<=8 words), then a one-line visual direction.`,
    });
    return { content: [{ type: "text", text }] };
  },
});