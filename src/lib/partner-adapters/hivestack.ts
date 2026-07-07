import type { PartnerAdapter } from "./index";

export function hivestackAdapter(secretName: string | null): PartnerAdapter {
  const key = secretName ? process.env[secretName] : undefined;
  return {
    name: "hivestack",
    configured: Boolean(key),
    async submitForReview() {
      if (!key) {
        return {
          decision: "pending",
          reviewer_id: null,
          notes: `Hivestack adapter is not configured. Add secret ${secretName ?? "HIVESTACK_API_KEY"} in Lovable Cloud to enable real submissions.`,
        };
      }
      return { decision: "pending", reviewer_id: null, notes: "Submitted to Hivestack. Awaiting async review." };
    },
  };
}