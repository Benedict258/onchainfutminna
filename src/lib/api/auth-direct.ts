import { supabase, query } from "@/lib/supabase";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  generateVerificationCode,
  storeVerificationCode,
} from "@/lib/auth";
import { randomUUID } from "crypto";

const levelMap: Record<string, string> = {
  "100": "L100",
  "200": "L200",
  "300": "L300",
  "400": "L400",
  "500": "L500",
  "600": "L600",
};

export async function register(data: {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth?: string;
  department: string;
  level: string;
  skills: string[];
  experienceLevel: string;
  funFact?: string;
  xLink?: string;
  githubLink?: string;
  portfolioLink?: string;
}) {
  if (data.password !== data.confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const { data: existingUser } = await query("users", {
    select: "id",
    filters: { email: data.email },
    single: true,
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hashPassword(data.password);

  const userId = randomUUID();
  const now = new Date().toISOString();
  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    email: data.email,
    password_hash: passwordHash,
    role: "MEMBER",
    is_active: false,
    is_approved: false,
    created_at: now,
    updated_at: now,
  });

  if (userError) throw new Error(userError.message);

  const { data: insertedUser } = await query("users", {
    select: "*",
    filters: { id: userId },
    single: true,
  });

  const profileId = randomUUID();
  
  // Parse DD-MM date of birth and store as ISO with dummy year 2000
  let dobIso = null;
  if (data.dateOfBirth) {
    const match = data.dateOfBirth.match(/^(\d{2})-(\d{2})$/);
    if (match) {
      const day = match[1];
      const month = match[2];
      const parsed = new Date(`2000-${month}-${day}T00:00:00Z`);
      if (!isNaN(parsed.getTime())) dobIso = parsed.toISOString();
    }
  }

  const normalizeSocial = (value?: string, prefix?: string) => {
    if (!value) return null;
    const v = value.trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    if (prefix) return `${prefix}${encodeURIComponent(v)}`;
    return v;
  };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: profileId,
    user_id: userId,
    full_name: data.fullName,
    username: data.username,
    phone: data.phone,
    date_of_birth: dobIso,
    department: data.department,
    level: levelMap[data.level] || data.level,
    experience_level: data.experienceLevel,
    fun_fact: data.funFact || null,
    x_link: normalizeSocial(data.xLink, 'https://x.com/') || null,
    github_link: normalizeSocial(data.githubLink, 'https://github.com/') || null,
    portfolio_link: data.portfolioLink || null,
    created_at: now,
    updated_at: now,
  });

  if (profileError) throw new Error(profileError.message);

  if (data.skills && data.skills.length > 0) {
    for (const skillName of data.skills) {
      const { data: existingSkill } = await query("skills", {
        select: "id",
        filters: { name: skillName },
        single: true,
      });

      let skillId = existingSkill?.id;

      if (!skillId) {
        skillId = randomUUID();
        const { data: newSkill, error: skillErr } = await supabase
          .from("skills")
          .insert({ id: skillId, name: skillName });
        if (skillErr) console.error("Skill insert error:", skillErr);
      }

      if (skillId && profileId) {
        await supabase.from("profile_skills").insert({ profile_id: profileId, skill_id: skillId });
      }
    }
  }

  const { data: profile } = await query("profiles", {
    select: "*",
    filters: { user_id: userId },
    single: true,
  });

  const { data: profileSkills } = await query("profile_skills", {
    select: "skills(name)",
    filters: { profile_id: profile?.id },
  });

  const skills = profileSkills?.map((ps: any) => ps.skills?.name).filter(Boolean) || [];

  const accessToken = generateAccessToken(insertedUser.id, insertedUser.role);
  const refreshToken = generateRefreshToken(insertedUser.id);
  await storeRefreshToken(refreshToken, insertedUser.id);

  const verificationCode = generateVerificationCode();
  await storeVerificationCode(insertedUser.id, verificationCode);
  try {
    const { sendVerificationEmail } = await import("@/lib/email");
    await sendVerificationEmail(insertedUser.email, verificationCode);
  } catch {
    console.error("Failed to send verification email");
  }

  return {
    user: {
      id: insertedUser.id,
      email: insertedUser.email,
      role: insertedUser.role,
      profile: profile
        ? {
            fullName: profile.full_name,
            username: profile.username || undefined,
            phone: profile.phone || undefined,
            nickname: profile.nickname || undefined,
            avatarUrl: profile.avatar_url || undefined,
            department: profile.department || "",
            level: profile.level || "L100",
            experienceLevel: profile.experience_level || undefined,
            funFact: profile.fun_fact || undefined,
            bio: profile.bio || undefined,
            xLink: profile.x_link || undefined,
            githubLink: profile.github_link || undefined,
            portfolioLink: profile.portfolio_link || undefined,
            skills,
          }
        : undefined,
    },
    accessToken,
    refreshToken,
    userId: insertedUser.id,
    message: "Verification code sent. Please check your inbox.",
  };
}

export async function login(data: { identifier: string; password: string }) {
  const isEmail = data.identifier.includes("@");

  let userData;
  if (isEmail) {
    const { data: found, error } = await query("users", {
      select: "*",
      filters: { email: data.identifier },
      single: true,
    });
    if (error) throw new Error(error.message);
    userData = found;
  } else {
    const { data: profile } = await query("profiles", {
      select: "user_id",
      filters: { username: data.identifier },
      single: true,
    });
    if (profile) {
      const { data: found } = await query("users", {
        select: "*",
        filters: { id: profile.user_id },
        single: true,
      });
      userData = found;
    }
  }

  const user = userData;
  if (!user) {
    throw new Error("Invalid email/username or password");
  }

  const isValid = await comparePassword(data.password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const { data: profile } = await query("profiles", {
    select: "*",
    filters: { user_id: user.id },
    single: true,
  });

  const { data: profileSkills } = await query("profile_skills", {
    select: "skills(name)",
    filters: { profile_id: profile?.id },
  });

  const skills = profileSkills?.map((ps: any) => ps.skills?.name).filter(Boolean) || [];

  const { data: userBadges } = await query("user_badges", {
    select: "badges(name, label, description, icon, color)",
    filters: { user_id: user.id },
  });
  const badges = userBadges?.map((ub: any) => ub.badges).filter(Boolean) || [];

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await storeRefreshToken(refreshToken, user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: profile
        ? {
            fullName: profile.full_name,
            username: profile.username || undefined,
            phone: profile.phone || undefined,
            nickname: profile.nickname || undefined,
            avatarUrl: profile.avatar_url || undefined,
            dateOfBirth: profile.date_of_birth || undefined,
            department: profile.department || "",
            level: profile.level || "L100",
            experienceLevel: profile.experience_level || undefined,
            funFact: profile.fun_fact || undefined,
            bio: profile.bio || undefined,
            xLink: profile.x_link || undefined,
            githubLink: profile.github_link || undefined,
            portfolioLink: profile.portfolio_link || undefined,
            skills,
            badges,
          }
        : undefined,
    },
    accessToken,
    refreshToken,
  };
}

export async function resendVerificationEmail(data: { email: string }) {
  const { data: user } = await query("users", {
    select: "id, email, is_active",
    filters: { email: data.email },
    single: true,
  });

  if (!user) {
    throw new Error("No account found with this email");
  }

  if (user.is_active) {
    throw new Error("This account is already verified");
  }

  const verificationCode = generateVerificationCode();
  await storeVerificationCode(user.id, verificationCode);
  const { sendVerificationEmail } = await import("@/lib/email");
  await sendVerificationEmail(user.email, verificationCode);

  return { message: "Verification code resent. Please check your inbox." };
}
