import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPiSession } from "./pi-auth.functions";

const PI_API = "https://api.minepi.com/v2";

function authHeader() {
  const key = process.env.PI_API_KEY;
  if (!key) throw new Error("PI_API_KEY is not configured on the server");
  return { Authorization: `Key ${key}`, "Content-Type": "application/json" };
}

export const approvePiPayment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ paymentId: z.string().min(1).max(256) }))
  .handler(async ({ data }) => {
    const session = await getPiSession();
    if (!session.data?.uid) {
      return { ok: false as const, error: "Not authenticated" };
    }
    const res = await fetch(`${PI_API}/payments/${data.paymentId}/approve`, {
      method: "POST",
      headers: authHeader(),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[Pi approve] upstream error", res.status, body);
      return { ok: false as const, error: "Payment approval failed. Please try again." };
    }
    return { ok: true as const, payment: await res.json() };
  });

export const completePiPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      paymentId: z.string().min(1).max(256),
      txid: z.string().min(1).max(256),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getPiSession();
    if (!session.data?.uid) {
      return { ok: false as const, error: "Not authenticated" };
    }
    const res = await fetch(`${PI_API}/payments/${data.paymentId}/complete`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ txid: data.txid }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[Pi complete] upstream error", res.status, body);
      return { ok: false as const, error: "Payment completion failed. Please try again." };
    }
    return { ok: true as const, payment: await res.json() };
  });