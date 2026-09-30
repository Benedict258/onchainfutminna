// Where to send the user after they sign in. Only same-site paths are allowed, so a
// crafted ?redirect= can't bounce people to another domain.
const RETURN_TO_KEY = "bcf-return-to";
const NO_RETURN = ["/auth", "/join"];

export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//"))
    return undefined;
  if (value.includes("\\")) return undefined;
  const path = value.split(/[?#]/)[0];
  if (NO_RETURN.some((p) => path === p || path.startsWith(p + "/"))) return undefined;
  return value;
}

/** Remembers the page a user was on when they headed to the sign-in page. */
export function rememberReturnTo(href: string) {
  const target = safeRedirect(href);
  if (!target) return;
  try {
    sessionStorage.setItem(RETURN_TO_KEY, target);
  } catch {
    // storage unavailable (private mode); the ?redirect= param still works
  }
}

export function takeReturnTo(): string | undefined {
  try {
    const value = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return safeRedirect(value);
  } catch {
    return undefined;
  }
}
