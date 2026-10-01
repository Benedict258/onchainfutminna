import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api/guard.server";

export const getMembers = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { page, limit, search } = data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const filters: Record<string, unknown> = {};
    if (search) {
      filters.full_name = { __op: "ilike", value: `%${search}%` };
    }

    const {
      data: members,
      count,
      error,
    } = await query("profiles", {
      select:
        "id, user_id, full_name, nickname, username, avatar_url, department, level, experience_level, fun_fact, bio, x_link, github_link, portfolio_link, created_at, users(id, role), profile_skills(*, skills(*))",
      filters,
      order: { column: "created_at", ascending: false },
      range: [from, to],
      count: "exact",
    });

    if (error) throw error;

    return {
      members: members || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  });

export const getMemberById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: member, error } = await query("profiles", {
      select:
        "id, user_id, full_name, nickname, username, avatar_url, department, level, experience_level, fun_fact, bio, x_link, github_link, portfolio_link, created_at, users(id, role), profile_skills(*, skills(*)), leaderboard_entries(*)",
      filters: { user_id: data.id },
      single: true,
    });

    if (error) throw error;
    if (!member) throw new Error("Member not found");

    return member;
  });

export const updateMember = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      accessToken: z.string(),
      fullName: z.string().min(1).optional(),
      nickname: z.string().optional(),
      avatarUrl: z.string().url().optional(),
      dateOfBirth: z.string().optional(),
      department: z.string().optional(),
      level: z.enum(["L100", "L200", "L300", "L400", "L500", "L600"]).optional(),
      experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
      funFact: z.string().optional(),
      bio: z.string().optional(),
      xLink: z.string().url().optional(),
      githubLink: z.string().url().optional(),
      portfolioLink: z.string().url().optional(),
      skillIds: z.array(z.string().uuid()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { id, accessToken, skillIds, ...profileData } = data;

    const updateData: Record<string, unknown> = {};
    if (profileData.fullName !== undefined) updateData.full_name = profileData.fullName;
    if (profileData.nickname !== undefined) updateData.nickname = profileData.nickname;
    if (profileData.avatarUrl !== undefined) updateData.avatar_url = profileData.avatarUrl;
    if (profileData.dateOfBirth !== undefined) updateData.date_of_birth = profileData.dateOfBirth;
    if (profileData.department !== undefined) updateData.department = profileData.department;
    if (profileData.level !== undefined) updateData.level = profileData.level;
    if (profileData.experienceLevel !== undefined)
      updateData.experience_level = profileData.experienceLevel;
    if (profileData.funFact !== undefined) updateData.fun_fact = profileData.funFact;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;
    if (profileData.xLink !== undefined) updateData.x_link = profileData.xLink;
    if (profileData.githubLink !== undefined) updateData.github_link = profileData.githubLink;
    if (profileData.portfolioLink !== undefined)
      updateData.portfolio_link = profileData.portfolioLink;

    const { data: existingProfile } = await query("profiles", {
      select: "id",
      filters: { user_id: id },
      single: true,
    });

    let profileId: string;

    if (existingProfile) {
      const { data: updated, error } = await supabase
        .from("profiles")
        .update(updateData, { user_id: id });

      if (error) throw error;
      profileId = updated.id;
    } else {
      const { data: created, error } = await supabase.from("profiles").insert({
        user_id: id,
        full_name: (profileData.fullName as string) || "New Member",
        ...updateData,
      });

      if (error) throw error;
      profileId = created.id;
    }

    if (skillIds !== undefined) {
      await supabase.from("profile_skills").delete({ profile_id: profileId });

      if (skillIds.length > 0) {
        const { error } = await supabase
          .from("profile_skills")
          .insert(skillIds.map((skillId) => ({ profile_id: profileId, skill_id: skillId })));

        if (error) throw error;
      }
    }

    const { data: finalProfile } = await query("profiles", {
      select: "*",
      filters: { id: profileId },
      single: true,
    });

    return finalProfile;
  });
