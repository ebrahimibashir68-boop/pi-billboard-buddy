import { defineTool } from "@lovable.dev/mcp-js";

const VENUES = [
  {
    id: "stadium_jumbotron",
    name: "Stadium jumbotrons",
    format: "16:9 large-format video",
    typical_slot_seconds: 15,
    audience: "Live sports crowds, 20k-100k per event",
  },
  {
    id: "arena_led_ribbon",
    name: "Arena LED ribbons",
    format: "Ultra-wide LED strip animation",
    typical_slot_seconds: 30,
    audience: "Indoor arenas, basketball/hockey/concerts",
  },
  {
    id: "street_billboard",
    name: "Global street billboards",
    format: "Static or motion 6-second creative",
    typical_slot_seconds: 6,
    audience: "Urban pedestrian and vehicle traffic",
  },
];

export default defineTool({
  name: "list_venue_categories",
  title: "List PiBoards venue categories",
  description:
    "List the categories of screens PiBoards supports (stadium jumbotrons, arena LED ribbons, street billboards) with format, typical slot length, and audience notes.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(VENUES, null, 2) }],
    structuredContent: { venues: VENUES },
  }),
});