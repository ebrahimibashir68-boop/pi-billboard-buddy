import type { PartnerAdapter } from "./index";

export function vistarAdapter(secretName: string | null): PartnerAdapter {
  const key = secretName ? process.env[secretName] : undefined;
  return {
    name: "vistar",
    configured: Boolean(key),
    async submitForReview() {
      if (!key) {
        return {
          decision: "pending",
          reviewer_id: null,
          notes: `Vistar Media adapter is not configured. Add secret ${secretName ?? "VISTAR_API_KEY"} in Lovable Cloud to enable real submissions.`,
        };
      }
      return { decision: "pending", reviewer_id: null, notes: "Submitted to Vistar. Awaiting async review." };
    },
  };
}