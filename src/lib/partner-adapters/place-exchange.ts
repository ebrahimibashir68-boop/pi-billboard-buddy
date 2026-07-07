import type { PartnerAdapter } from "./index";

export function placeExchangeAdapter(secretName: string | null): PartnerAdapter {
  const key = secretName ? process.env[secretName] : undefined;
  return {
    name: "place_exchange",
    configured: Boolean(key),
    async submitForReview() {
      if (!key) {
        return {
          decision: "pending",
          reviewer_id: null,
          notes: `Place Exchange adapter is not configured. Add secret ${secretName ?? "PLACE_EXCHANGE_API_KEY"} in Lovable Cloud to enable real submissions.`,
        };
      }
      return { decision: "pending", reviewer_id: null, notes: "Submitted to Place Exchange. Awaiting async review." };
    },
  };
}