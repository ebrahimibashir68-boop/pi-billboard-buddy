import { useSession } from "@tanstack/react-start/server";

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