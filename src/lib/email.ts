import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Blockchain Club FUTMinna <noreply@futminna.club>";
const SITE_URL = process.env.SITE_URL || "https://futminna.club";

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
                <span style="font-size:24px;font-weight:800;color:#C084FC;letter-spacing:-0.5px;">BlockchainClub FUTMinna</span>
                <span style="font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">UTMINNA</span>
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
</html>
</html>`;

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const digits = code.split("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your verification code — Blockchain Club FUTMinna",
    html: EMAIL_wrapper(`
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
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Blockchain Club FUTMinna!",
    html: EMAIL_wrapper(`
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 8px 0;">Welcome, ${name}!</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Your account is now active. You're part of FUTMinna's premier Web3 community.
      </p>
      <a href="${SITE_URL}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
        Go to Platform
      </a>
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
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password — Blockchain Club FUTMinna",
    html: EMAIL_wrapper(`
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 8px 0;">Reset your password</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Click the button below to set a new password for your account.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
        Reset Password
      </a>
      <p style="color:rgba(255,255,255,0.35);font-size:13px;line-height:1.6;margin:32px 0 0 0;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    `),
  });
}
