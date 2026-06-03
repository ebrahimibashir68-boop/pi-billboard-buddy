import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

    // Session established (stateless for this minimal flow — return the
    // verified identity to the client).
    return {
      ok: true as const,
      user: { uid: me.uid, username: me.username },
    };
  });