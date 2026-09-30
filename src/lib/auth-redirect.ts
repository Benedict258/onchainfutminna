// Where to send the user after they sign in. Only same-site paths are allowed, so a
// crafted ?redirect= can't bounce people to another domain.
const RETURN_TO_KEY = "bcf-return-to";
// Sign-up, verification and password-reset pages; never a place to return to.
const AUTH_PAGES = ["/auth", "/join"];
// Long enough to sign up and verify by email, short enough not to surprise a later login.
const RETURN_TO_TTL_MS = 60 * 60 * 1000;

export function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//"))
    return undefined;
  if (value.includes("\\")) return undefined;
  if (isAuthPage(value.split(/[?#]/)[0])) return undefined;
  return value;
}

/**
 * Remembers the page a user was on when they headed to sign in or sign up. Kept in
 * localStorage so it survives verification and reset links opened in a new tab.
 */
export function rememberReturnTo(href: string) {
  const path = safeRedirect(href);
  if (!path) return;
  try {
    localStorage.setItem(RETURN_TO_KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // storage unavailable (private mode); the ?redirect= param still works
  }
}

export function takeReturnTo(): string | undefined {
  try {
    const raw = localStorage.getItem(RETURN_TO_KEY);
    localStorage.removeItem(RETURN_TO_KEY);
    if (!raw) return undefined;
    const { path, at } = JSON.parse(raw);
    if (typeof at !== "number" || Date.now() - at > RETURN_TO_TTL_MS) return undefined;
    return safeRedirect(path);
  } catch {
    return undefined;
  }
}
