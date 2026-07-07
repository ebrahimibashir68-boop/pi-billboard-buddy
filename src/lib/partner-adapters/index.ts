import type { SimulatedAdapter } from "./simulated";
import { simulatedAdapter } from "./simulated";
import { broadsignAdapter } from "./broadsign";
import { vistarAdapter } from "./vistar";
import { hivestackAdapter } from "./hivestack";
import { placeExchangeAdapter } from "./place-exchange";

export type PartnerReviewInput = {
  submission_id: string;
  partner_slug: string;
  headline: string | null;
  body: string | null;
  image_url: string | null;
  kind: string;
  brand: string;
};

export type PartnerReviewResult = {
  decision: "approved" | "rejected" | "pending";
  reviewer_id: string | null;
  notes: string;
};

export type PartnerAdapter = {
  name: string;
  configured: boolean;
  submitForReview: (input: PartnerReviewInput) => Promise<PartnerReviewResult>;
};

export function resolveAdapter(kind: string, secretName: string | null): PartnerAdapter {
  switch (kind) {
    case "simulated": return simulatedAdapter satisfies SimulatedAdapter;
    case "broadsign": return broadsignAdapter(secretName);
    case "vistar": return vistarAdapter(secretName);
    case "hivestack": return hivestackAdapter(secretName);
    case "place_exchange": return placeExchangeAdapter(secretName);
    default: return simulatedAdapter;
  }
}