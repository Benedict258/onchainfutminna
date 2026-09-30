import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  deleteRefreshToken,
} from "@/lib/auth";

const registerInputSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
  dateOfBirth: z.string().optional(),
  department: z.string(),
  level: z.string(),
  skills: z.array(z.string()),
  experienceLevel: z.string(),
  funFact: z.string().optional(),
  xLink: z.string().optional(),
  githubLink: z.string().optional(),
  portfolioLink: z.string().optional(),
});

export const register = createServerFn({ method: "POST" })
  .validator(registerInputSchema)
  .handler(async ({ data }) => {
    const { data: existingUser } = await query("users", {
      select: "id",
      filters: { email: data.email },
      single: true,
    });

    if (existingUser) {
      throw new Error("An account with this email already exists");
    }

    const passwordHash = await hashPassword(data.password);

    const levelMap: Record<string, string> = {
      "100": "L100",
      "200": "L200",
      "300": "L300",
      "400": "L400",
      "500": "L500",
      "600": "L600",
    };

    const { data: user, error: userError } = await supabase.from("users").insert({
      email: data.email,
      password_hash: passwordHash,
      role: "MEMBER",
      is_active: true,
      is_approved: true,
    });

    if (userError) throw new Error(userError.message);

    const { data: insertedUser } = await query("users", {
      select: "*",
      filters: { email: data.email },
      single: true,
    });

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: insertedUser.id,
      full_name: data.fullName,
      date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
      department: data.department,
      level: levelMap[data.level],
      experience_level: data.experienceLevel,
      fun_fact: data.funFact || null,
      x_link: data.xLink || null,
      github_link: data.githubLink || null,
      portfolio_link: data.portfolioLink || null,
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
          const { data: newSkill } = await supabase.from("skills").insert({ name: skillName });

          if (newSkill && newSkill[0]) {
            skillId = newSkill[0].id;
          }
        }

        if (skillId) {
          const { data: profile } = await query("profiles", {
            select: "id",
            filters: { user_id: insertedUser.id },
            single: true,
          });

          if (profile) {
            await supabase
              .from("profile_skills")
              .insert({ profile_id: profile.id, skill_id: skillId });
          }
        }
      }
    }

    const { data: profile } = await query("profiles", {
      select: "full_name, department, level",
      filters: { user_id: insertedUser.id },
      single: true,
    });

    const accessToken = generateAccessToken(insertedUser.id, insertedUser.role);
    const refreshToken = generateRefreshToken(insertedUser.id);
    await storeRefreshToken(refreshToken, insertedUser.id);

    return {
      user: {
        id: insertedUser.id,
        email: insertedUser.email,
        role: insertedUser.role,
        profile: profile
          ? {
              fullName: profile.full_name,
              department: profile.department || "",
              level: profile.level || "L100",
            }
          : undefined,
      },
      accessToken,
      refreshToken,
    };
  });

const loginInputSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const login = createServerFn({ method: "POST" })
  .validator(loginInputSchema)
  .handler(async ({ data }) => {
    const { data: user, error } = await query("users", {
      select: "*, profiles(full_name, avatar_url, department, level)",
      filters: { email: data.email },
      single: true,
    });

    if (error || !user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await comparePassword(data.password, user.password_hash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(refreshToken, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profiles
          ? {
              fullName: user.profiles.full_name,
              avatarUrl: user.profiles.avatar_url || undefined,
              department: user.profiles.department || "",
              level: user.profiles.level || "L100",
            }
          : undefined,
      },
      accessToken,
      refreshToken,
    };
  });

export const logout = createServerFn({ method: "POST" })
  .validator(z.object({ refreshToken: z.string() }))
  .handler(async ({ data }) => {
    await deleteRefreshToken(data.refreshToken);
    return { success: true };
  });

export const refreshToken = createServerFn({ method: "POST" })
  .validator(z.object({ refreshToken: z.string() }))
  .handler(async ({ data }) => {
    const decoded = await verifyRefreshToken(data.refreshToken);
    if (!decoded) {
      throw new Error("Invalid or expired refresh token");
    }

    const { data: user } = await query("users", {
      select: "id, role",
      filters: { id: decoded.userId },
      single: true,
    });

    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken(user.id, user.role || "MEMBER");
    return { accessToken };
  });

export const getMe = createServerFn({ method: "GET" })
  .validator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }) => {
    const decoded = verifyAccessToken(data.accessToken);
    if (!decoded) throw new Error("Invalid or expired token");

    const { data: user } = await query("users", {
      select: "id, email, role, profiles(full_name, avatar_url, department, level)",
      filters: { id: decoded.userId },
      single: true,
    });

    if (!user) throw new Error("User not found");

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profiles
        ? {
            fullName: user.profiles.full_name,
            avatarUrl: user.profiles.avatar_url || undefined,
            department: user.profiles.department || "",
            level: user.profiles.level || "L100",
          }
        : undefined,
    };
  });
