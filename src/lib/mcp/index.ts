import { defineMcp } from "@lovable.dev/mcp-js";
import getPlatformOverview from "./tools/get-platform-overview";
import listVenueCategories from "./tools/list-venue-categories";
import generateAdConcepts from "./tools/generate-ad-concepts";

export default defineMcp({
  name: "piboards-mcp",
  title: "PiBoards MCP",
  version: "0.1.0",
  instructions:
    "Tools for PiBoards, an app that runs AI-generated ads on stadium jumbotrons, arena LED ribbons, and global street billboards, settled in Pi. Use `get_platform_overview` for a product summary, `list_venue_categories` for supported screen formats, and `generate_ad_concepts` to draft ad ideas for a brand and venue.",
  tools: [getPlatformOverview, listVenueCategories, generateAdConcepts],
});