import { verifyAccessToken } from "@/lib/auth";

// Server functions run with the service-role key (RLS is bypassed), so each one that
// writes or returns private data must check the caller itself.

export function requireUser(accessToken: string | undefined) {
  const caller = accessToken ? verifyAccessToken(accessToken) : null;
  if (!caller) throw new Error("Unauthorized");
  return caller;
}

export function requireAdmin(accessToken: string | undefined) {
  const caller = requireUser(accessToken);
  if (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return caller;
}
