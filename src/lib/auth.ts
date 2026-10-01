import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase, query } from "@/lib/supabase";
import { createHash, randomInt, randomUUID } from "crypto";

export function getAuthSecret(): string {
  return process.env.JWT_SECRET || "bcf-futminna-jwt-secret-fallback";
}

export function getRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || "bcf-futminna-refresh-secret-fallback";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getAuthSecret(), { expiresIn: "7d" });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, getRefreshSecret(), { expiresIn: "7d" });
}

export async function storeRefreshToken(token: string, userId: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("refresh_tokens").insert({
    id: randomUUID(),
    token,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export function verifyAccessToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, getAuthSecret()) as {
      userId: string;
      role: string;
      type?: string;
    };
    // Reset and verification tokens share the secret; only real access tokens count here.
    if (decoded.type || !decoded.role) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const decoded = jwt.verify(token, getRefreshSecret()) as { userId: string };

    const { data: storedToken } = await query("refresh_tokens", {
      select: "*",
      filters: { token },
      single: true,
    });

    if (!storedToken) return null;
    if (new Date() > new Date(storedToken.expires_at)) {
      await supabase.from("refresh_tokens").delete({ token });
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function deleteRefreshToken(token: string): Promise<void> {
  try {
    await supabase.from("refresh_tokens").delete({ token });
  } catch {
    // Token already deleted
  }
}

export async function deleteAllUserRefreshTokens(userId: string): Promise<void> {
  await supabase.from("refresh_tokens").delete({ user_id: userId });
}

export function generateVerificationToken(userId: string): string {
  return jwt.sign({ userId, type: "email_verification" }, getAuthSecret(), { expiresIn: "24h" });
}

export function verifyVerificationToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getAuthSecret()) as { userId: string; type: string };
    if (decoded.type !== "email_verification") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function storeVerificationCode(userId: string, code: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const { error } = await supabase.from("verification_codes").insert({
    id: randomUUID(),
    user_id: userId,
    code,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function verifyCode(userId: string, code: string): Promise<boolean> {
  // String() so a {__op} object can never reach the filter as an operator.
  const { data } = await query("verification_codes", {
    select: "*",
    filters: { user_id: String(userId), code: String(code) },
    single: true,
  });

  if (!data) return false;

  if (new Date() > new Date(data.expires_at)) {
    await supabase.from("verification_codes").delete({ id: data.id });
    return false;
  }

  await supabase.from("verification_codes").delete({ id: data.id });
  return true;
}

/** Short digest of a password hash; changes whenever the password does. */
export function passwordFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

// The token embeds the current password fingerprint, which makes it single-use: after a
// reset the stored hash changes and the old token no longer matches.
export function generatePasswordResetToken(userId: string, passwordHash: string): string {
  return jwt.sign(
    { userId, type: "password_reset", pwd: passwordFingerprint(passwordHash) },
    getAuthSecret(),
    { expiresIn: "1h" },
  );
}

export function verifyPasswordResetToken(token: string): { userId: string; pwd: string } | null {
  try {
    const decoded = jwt.verify(token, getAuthSecret()) as {
      userId: string;
      type: string;
      pwd?: string;
    };
    if (decoded.type !== "password_reset" || !decoded.pwd) return null;
    return { userId: decoded.userId, pwd: decoded.pwd };
  } catch {
    return null;
  }
}
