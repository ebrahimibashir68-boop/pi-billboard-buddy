import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { authenticateWithPi } from "@/lib/pi-sdk";
import { verifyPiAccessToken } from "@/lib/pi-auth.functions";

type Status = "idle" | "loading" | "authed" | "error";

export function PiAuthButton() {
  const verify = useServerFn(verifyPiAccessToken);
  const [status, setStatus] = useState<Status>("idle");
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggered = useRef(false);

  const signIn = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await authenticateWithPi();
      const verified = await verify({ data: { accessToken: result.accessToken } });
      if (!verified.ok) throw new Error(verified.error);
      setUsername(verified.user.username);
      setStatus("authed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Pi sign-in failed";
      console.error("[Pi auth]", e);
      setError(msg);
      setStatus("error");
    }
  }, [verify]);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    void signIn();
  }, [signIn]);

  if (status === "authed" && username) {
    return (
      <span className="px-4 py-2 rounded-full text-sm font-medium bg-background/60 border border-border">
        π @{username}
      </span>
    );
  }

  return (
    <button
      onClick={signIn}
      disabled={status === "loading"}
      title={error ?? undefined}
      className="px-4 py-2 rounded-full text-sm font-medium bg-[image:var(--gradient-neon)] text-primary-foreground hover:opacity-90 transition glow-indigo disabled:opacity-60"
    >
      {status === "loading" ? "Signing in…" : "Sign in with Pi"}
    </button>
  );
}