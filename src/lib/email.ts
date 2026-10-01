import { Resend } from "resend";

// Must be an address on a domain verified in Resend (onchainfutminna.xyz is verified;
// a gmail.com sender is rejected with 403).
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Blockchain Club FUTMinna <noreply@onchainfutminna.xyz>";
const SITE_URL = (process.env.SITE_URL || "https://onchainfutminna.xyz").replace(/\/$/, "");

let client: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Resend reports failures in its return value instead of throwing, so check it here;
// otherwise every send fails silently.
async function send(to: string, subject: string, html: string) {
  const { data, error } = await getClient().emails.send({ from: FROM_EMAIL, to, subject, html });
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

const EMAIL_wrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0D0014;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0014;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="text-align:center;padding-bottom:32px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <span style="font-size:24px;font-weight:800;color:#C084FC;letter-spacing:-0.5px;">Blockchain Club </span>
                <span style="font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">FUTMINNA</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1A031B;border:1px solid rgba(192,132,252,0.15);border-radius:12px;padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding:24px 0;">
              <p style="color:rgba(255,255,255,0.3);font-size:12px;line-height:1.6;margin:0;">
                Blockchain Club FUTMinna &mdash; FUTMinna's Home for Web3 Builders
              </p>
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:8px 0 0 0;">
                <a href="${SITE_URL}" style="color:rgba(192,132,252,0.5);text-decoration:none;">Website</a>
                &nbsp;&middot;&nbsp;
                <a href="https://x.com/bcfutminna" style="color:rgba(192,132,252,0.5);text-decoration:none;">X / Twitter</a>
                &nbsp;&middot;&nbsp;
                <a href="https://github.com/bcfutminna" style="color:rgba(192,132,252,0.5);text-decoration:none;">GitHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">${label}</a>`;

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const digits = code.split("");

  await send(
    email,
    "Your verification code — Blockchain Club FUTMinna",
    EMAIL_wrapper(`
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 8px 0;">Verify your email</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Enter the 6-digit code below to verify your email address and activate your account.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          ${digits
            .map(
              (d) => `
          <td style="width:52px;height:64px;text-align:center;background:rgba(124,58,237,0.1);border:2px solid rgba(124,58,237,0.3);border-radius:8px;margin:0 4px;">
            <span style="color:#C084FC;font-size:28px;font-weight:800;letter-spacing:2px;font-family:'Courier New',monospace;">${d}</span>
          </td>`,
            )
            .join("")}
        </tr>
      </table>
      <p style="color:rgba(255,255,255,0.35);font-size:13px;line-height:1.6;margin:32px 0 0 0;">
        This code expires in 15 minutes. If you didn't create an account, you can safely ignore this email.
      </p>
    `),
  );
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await send(
    email,
    "Welcome to Blockchain Club FUTMinna!",
    EMAIL_wrapper(`
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 8px 0;">Welcome, ${escapeHtml(name)}!</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Your account is now active. You're part of FUTMinna's premier Web3 community.
      </p>
      ${button(SITE_URL, "Go to Platform")}
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:32px 0 0 0;">
        Explore learning tracks, join events, submit projects, and connect with fellow builders.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;width:100%;">
        <tr>
          <td style="padding:12px 16px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:8px;">
            <p style="color:#C084FC;font-size:13px;font-weight:600;margin:0 0 4px 0;">Get Started</p>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">
              Complete your profile, explore tracks, and earn your first badge.
            </p>
          </td>
        </tr>
      </table>
    `),
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${SITE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;

  await send(
    email,
    "Reset your password — Blockchain Club FUTMinna",
    EMAIL_wrapper(`
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 8px 0;">Reset your password</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Click the button below to set a new password for your account.
      </p>
      ${button(resetUrl, "Reset Password")}
      <p style="color:rgba(255,255,255,0.35);font-size:13px;line-height:1.6;margin:32px 0 0 0;">
        This link expires in 1 hour and can only be used once. If you didn't request a password reset, you can safely ignore this email.
      </p>
    `),
  );
}

export async function sendScholarshipConfirmationEmail(
  email: string,
  name: string,
  details: { resultsAnnounce: string; bootcampDates: string; contactEmail: string },
): Promise<void> {
  await send(
    email,
    "We received your Dev3pack Rust Scholarship application",
    EMAIL_wrapper(`
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 8px 0;">Application received</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        Hi ${escapeHtml(name)}, thanks for applying for a seat in the Dev3pack Solana Rust Bootcamp
        through Blockchain Club FUTMinna.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;width:100%;">
        <tr>
          <td style="padding:12px 16px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:8px;">
            <p style="color:#C084FC;font-size:13px;font-weight:600;margin:0 0 4px 0;">What happens next</p>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6;margin:0;">
              Results will be announced on <strong style="color:#FFFFFF;">${escapeHtml(details.resultsAnnounce)}</strong>.
              The bootcamp runs <strong style="color:#FFFFFF;">${escapeHtml(details.bootcampDates)}</strong>.
            </p>
          </td>
        </tr>
      </table>
      ${button(`${SITE_URL}/scholarships/dev3pack-rust`, "View scholarship details")}
      <p style="color:rgba(255,255,255,0.35);font-size:13px;line-height:1.6;margin:32px 0 0 0;">
        Questions? Email ${escapeHtml(details.contactEmail)}. If you didn't apply, you can ignore this email.
      </p>
    `),
  );
}
