import { useSession } from "@tanstack/react-start/server";

export type PiSessionData = { uid: string; username: string };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET env var must be set to a random string of at least 32 characters",
    );
  }
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