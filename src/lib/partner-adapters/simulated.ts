import type { PartnerAdapter, PartnerReviewInput, PartnerReviewResult } from "./index";

export type SimulatedAdapter = PartnerAdapter;

export const simulatedAdapter: SimulatedAdapter = {
  name: "simulated",
  configured: true,
  async submitForReview(input: PartnerReviewInput): Promise<PartnerReviewResult> {
    // Simulated partner reviewer: approve if content has a headline of reasonable length.
    const headline = (input.headline ?? "").trim();
    if (!headline) {
      return { decision: "rejected", reviewer_id: "sim-reviewer-01", notes: "No headline provided." };
    }
    if (/(gambling|weapons|adult)/i.test(input.body ?? "")) {
      return { decision: "rejected", reviewer_id: "sim-reviewer-01", notes: "Restricted category for our network." };
    }
    return {
      decision: "approved",
      reviewer_id: `sim-${input.partner_slug}-01`,
      notes: "Approved by simulated partner review. Ready for schedule.",
    };
  },
};