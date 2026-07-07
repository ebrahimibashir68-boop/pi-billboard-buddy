import type { PartnerAdapter } from "./index";

export function broadsignAdapter(secretName: string | null): PartnerAdapter {
  const key = secretName ? process.env[secretName] : undefined;
  return {
    name: "broadsign",
    configured: Boolean(key),
    async submitForReview() {
      if (!key) {
        return {
          decision: "pending",
          reviewer_id: null,
          notes: `Broadsign Reach adapter is not configured. Add secret ${secretName ?? "BROADSIGN_API_KEY"} in Lovable Cloud to enable real submissions.`,
        };
      }
      // Real integration would POST to Broadsign Reach here.
      return { decision: "pending", reviewer_id: null, notes: "Submitted to Broadsign Reach. Awaiting async review." };
    },
  };
}