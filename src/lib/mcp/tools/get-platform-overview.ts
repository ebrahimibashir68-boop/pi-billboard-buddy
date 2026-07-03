import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_platform_overview",
  title: "Get PiBoards overview",
  description:
    "Return a concise overview of what PiBoards does: AI-generated ads run on stadium jumbotrons, arena LED ribbons, and global street billboards, auctioned in real time and settled in Pi Network cryptocurrency.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: [
          "PiBoards is an ad platform where users design AI-generated creative and run it on live outdoor and venue screens.",
          "- Inventory: stadium jumbotrons, arena LED ribbons, and global street billboards (12,400+ screens).",
          "- Auction: real-time bidding per slot with targeting by venue, geography, event, and time.",
          "- Payments: campaigns are settled instantly in Pi Network cryptocurrency via the Pi Browser SDK.",
          "- Creative: AI tools generate and iterate ad concepts, taglines, and layouts tailored to venue format.",
        ].join("\n"),
      },
    ],
    structuredContent: {
      product: "PiBoards",
      inventory: ["stadium jumbotrons", "arena LED ribbons", "global street billboards"],
      settlement: "Pi Network",
      auction: "real-time",
    },
  }),
});