import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

export type PiSessionData = { uid: string; username: string };

function sessionConfig() {
  const password =
    process.env.SESSION_SECRET ||
    process.env.PI_API_KEY ||
    "dev-only-insecure-session-secret-please-set-SESSION_SECRET-env";
  return {
    password,
    name: "pi_session",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getPiSession() {
  return useSession<PiSessionData>(sessionConfig());
}

export const verifyPiAccessToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(10).max(4096) }))
  .handler(async ({ data }) => {
    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });

    if (!res.ok) {
      return {
        ok: false as const,
        error: `Pi /v2/me responded ${res.status}`,
      };
    }

    const me = (await res.json()) as { uid?: string; username?: string };
    if (!me?.uid || !me?.username) {
      return { ok: false as const, error: "Invalid Pi user payload" };
    }

    const session = await getPiSession();
    await session.update({ uid: me.uid, username: me.username });

    return {
      ok: true as const,
      user: { uid: me.uid, username: me.username },
    };
  });