// Stellar testnet helpers. Server-only.
import { Keypair } from "@stellar/stellar-sdk";

const HORIZON = "https://horizon-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";

export type EscrowKeypair = { publicKey: string; secret: string };

export function generateEscrowKeypair(): EscrowKeypair {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}

export async function fundWithFriendbot(publicKey: string): Promise<{ hash: string } | { error: string }> {
  try {
    const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(publicKey)}`);
    if (!res.ok) return { error: `Friendbot ${res.status}` };
    const body = (await res.json()) as { hash?: string; successful?: boolean };
    if (!body.hash) return { error: "Friendbot returned no tx hash" };
    return { hash: body.hash };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Friendbot failed" };
  }
}

export async function getAccountBalance(publicKey: string): Promise<number | null> {
  try {
    const res = await fetch(`${HORIZON}/accounts/${publicKey}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { balances?: Array<{ asset_type: string; balance: string }> };
    const native = body.balances?.find((b) => b.asset_type === "native");
    return native ? Number.parseFloat(native.balance) : null;
  } catch {
    return null;
  }
}

/** Deterministic sha256 hash for terms text (hex). */
export async function hashTerms(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}