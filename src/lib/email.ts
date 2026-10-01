import { Resend } from "resend";

// Must be an address on a domain verified in Resend (onchainfutminna.xyz is verified;
// a gmail.com sender is rejected with 403).
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Blockchain Club FUTMinna <hello@onchainfutminna.xyz>";
const SITE_URL = (process.env.SITE_URL || "https://onchainfutminna.xyz").replace(/\/$/, "");
// Email clients load images from the public site, never from localhost.
const ASSET_URL = SITE_URL.startsWith("https://") ? SITE_URL : "https://onchainfutminna.xyz";

let client: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Resend reports failures in its return value instead of throwing, so check it here;
// otherwise every send fails silently.
async function send(to: string, subject: string, html: string, text: string) {
  const { data, error } = await getClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    console.error(`[email] "${subject}" to ${to} failed:`, error.message);
    throw new Error("We couldn't send the email. Please try again shortly.");
  }
  return data;
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

// ─── Design tokens: the website's light theme (src/styles.css :root) ───────────────
const C = {
  page: "#f5f0ff", // --background
  card: "#ffffff", // --card
  ink: "#1a031b", // --foreground / --primary
  muted: "#4a3860", // --muted-foreground
  tint: "#ede6ff", // --surface-low
  line: "#ddd3f5", // --surface-high
  border: "#c0b3d4", // --border
};
const FONT =
  "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const SOCIAL = [
  ["Website", SITE_URL],
  ["X", "https://x.com/Onchainfutminna"],
  ["Telegram", "https://t.me/bcfutminna"],
] as const;

/** Page shell shared by every email. `preheader` is the preview line inbox lists show. */
function layout(preheader: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <title>Blockchain Club FUTMinna</title>
  <style>
    @media (max-width: 480px) {
      .card { padding: 28px 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:${FONT};color:${C.ink};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.page};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${ASSET_URL}/lightlogo.png" width="136" height="136" alt="Blockchain Club FUTMinna" style="display:block;width:136px;height:136px;border:0;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="card" style="background-color:${C.card};border:1px solid ${C.line};border-radius:16px;padding:40px 36px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 16px 0;">
              <p style="margin:0 0 10px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">
                ${SOCIAL.map(([label, href]) => `<a href="${href}" style="color:${C.ink};font-weight:600;text-decoration:none;">${label}</a>`).join(`<span style="color:${C.border};">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`)}
              </p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">
                Blockchain Club FUTMinna &middot; FUTMinna's home for Web3 builders
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const heading = (text: string) =>
  `<h1 style="margin:0 0 12px;font-family:${FONT};font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.02em;color:${C.ink};">${text}</h1>`;

const paragraph = (html: string, extra = "") =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${C.muted};${extra}">${html}</p>`;

const small = (html: string) =>
  `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${C.line};font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">${html}</p>`;

// Table-based so the button renders in Outlook too.
const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;">
    <tr>
      <td style="background-color:${C.ink};border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>
      </td>
    </tr>
  </table>`;

const panel = (label: string, html: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr>
      <td style="background-color:${C.tint};border-radius:12px;padding:16px 18px;">
        <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${C.muted};">${label}</p>
        <p style="margin:0;font-family:${FONT};font-size:14px;line-height:22px;color:${C.ink};">${html}</p>
      </td>
    </tr>
  </table>`;

/** "2026-10-16" → "16 October 2026"; any other string is returned unchanged. */
function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  return new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const footerText = `\n\n—\nBlockchain Club FUTMinna\n${SITE_URL}`;

// ─── Emails ──────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  await send(
    email,
    `${code} is your Blockchain Club FUTMinna verification code`,
    layout(
      `Your verification code is ${code}. It expires in 15 minutes.`,
      `
      ${heading("Verify your email")}
      ${paragraph("Enter this code on the verification page to activate your account.")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;">
        <tr>
          <td align="center" style="background-color:${C.tint};border:1px solid ${C.line};border-radius:12px;padding:22px 12px;">
            <span style="font-family:${MONO};font-size:34px;line-height:40px;font-weight:600;letter-spacing:8px;color:${C.ink};">${spaced}</span>
          </td>
        </tr>
      </table>
      ${small("This code expires in 15 minutes. If you didn't create an account, you can ignore this email.")}
    `,
    ),
    `Verify your email\n\nYour Blockchain Club FUTMinna verification code is: ${code}\n\nIt expires in 15 minutes. If you didn't create an account, you can ignore this email.${footerText}`,
  );
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const first = escapeHtml(name.trim().split(/\s+/)[0] || "builder");
  await send(
    email,
    "Welcome to Blockchain Club FUTMinna",
    layout(
      "Your account is active. Here's how to get started.",
      `
      ${heading(`Welcome, ${first}!`)}
      ${paragraph("Your account is now active. You're part of FUTMinna's home for Web3 builders.")}
      ${panel("Get started", "Complete your profile, pick a learning track, join an upcoming event and earn your first badge.")}
      ${button(SITE_URL, "Go to the platform")}
      ${small(`Join the conversation on <a href="https://t.me/bcfutminna" style="color:${C.ink};font-weight:600;">Telegram</a> and follow <a href="https://x.com/Onchainfutminna" style="color:${C.ink};font-weight:600;">@Onchainfutminna</a> for updates.`)}
    `,
    ),
    `Welcome, ${name.trim().split(/\s+/)[0] || "builder"}!\n\nYour account is now active. Complete your profile, pick a learning track, join an upcoming event and earn your first badge.\n\nGo to the platform: ${SITE_URL}${footerText}`,
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${SITE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
  await send(
    email,
    "Reset your Blockchain Club FUTMinna password",
    layout(
      "Use this link to set a new password. It expires in 1 hour.",
      `
      ${heading("Reset your password")}
      ${paragraph("We received a request to reset your password. Click the button below to choose a new one.")}
      ${button(resetUrl, "Reset password")}
      ${small("This link expires in 1 hour and can only be used once. If you didn't request a reset, you can ignore this email and your password won't change.")}
    `,
    ),
    `Reset your password\n\nWe received a request to reset your password. Open this link to choose a new one:\n${resetUrl}\n\nThe link expires in 1 hour and can only be used once. If you didn't request a reset, you can ignore this email.${footerText}`,
  );
}

export async function sendScholarshipConfirmationEmail(
  email: string,
  name: string,
  details: { resultsAnnounce: string; bootcampDates: string; contactEmail: string },
): Promise<void> {
  const first = name.trim().split(/\s+/)[0] || "there";
  const results = formatDate(details.resultsAnnounce);
  const pageUrl = `${SITE_URL}/scholarships/dev3pack-rust`;
  await send(
    email,
    "We received your Dev3pack Rust Scholarship application",
    layout(
      `Thanks for applying. Results will be announced on ${results}.`,
      `
      ${heading("Application received")}
      ${paragraph(`Hi ${escapeHtml(first)}, thanks for applying for a seat in the Dev3pack Solana Rust Bootcamp through Blockchain Club FUTMinna.`)}
      ${panel(
        "What happens next",
        `Results will be announced on <strong>${escapeHtml(results)}</strong>.<br>The bootcamp runs <strong>${escapeHtml(details.bootcampDates)}</strong>.`,
      )}
      ${button(pageUrl, "View scholarship details")}
      ${small(`Questions? Email <a href="mailto:${escapeHtml(details.contactEmail)}" style="color:${C.ink};font-weight:600;">${escapeHtml(details.contactEmail)}</a>. If you didn't apply, you can ignore this email.`)}
    `,
    ),
    `Application received\n\nHi ${first}, thanks for applying for a seat in the Dev3pack Solana Rust Bootcamp through Blockchain Club FUTMinna.\n\nResults will be announced on ${results}. The bootcamp runs ${details.bootcampDates}.\n\nScholarship details: ${pageUrl}\nQuestions? Email ${details.contactEmail}.${footerText}`,
  );
}
