import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api/guard.server";

export const getAnalytics = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const now = new Date().toISOString();

    const [
      { count: totalMembers },
      { count: activeMembers },
      { count: approvedMembers },
      { count: totalEvents },
      { count: upcomingEvents },
      { count: totalProjects },
      { count: approvedProjects },
      { count: totalTracks },
      { count: totalModules },
      { count: totalBlogPosts },
      { count: publishedBlogPosts },
      { count: totalOpportunities },
      { count: openOpportunities },
      { count: totalPartners },
    ] = await Promise.all([
      query("users", { select: "id", count: "exact", head: true }),
      query("users", { select: "id", count: "exact", head: true, filters: { is_active: true } }),
      query("users", { select: "id", count: "exact", head: true, filters: { is_approved: true } }),
      query("events", { select: "id", count: "exact", head: true }),
      query("events", {
        select: "id",
        count: "exact",
        head: true,
        filters: { start_date: { __op: "gte", value: now } },
      }),
      query("projects", { select: "id", count: "exact", head: true }),
      query("projects", {
        select: "id",
        count: "exact",
        head: true,
        filters: { status: "APPROVED" },
      }),
      query("tracks", { select: "id", count: "exact", head: true }),
      query("modules", { select: "id", count: "exact", head: true }),
      query("blog_posts", { select: "id", count: "exact", head: true }),
      query("blog_posts", {
        select: "id",
        count: "exact",
        head: true,
        filters: { status: "PUBLISHED" },
      }),
      query("opportunities", { select: "id", count: "exact", head: true }),
      query("opportunities", {
        select: "id",
        count: "exact",
        head: true,
        filters: { status: "OPEN" },
      }),
      query("partners", { select: "id", count: "exact", head: true, filters: { is_active: true } }),
    ]);

    const { data: recentMembers } = await query("users", {
      select: "id, email, created_at, profiles(full_name, avatar_url)",
      order: { column: "created_at", ascending: false },
      limit: 5,
    });

    const { data: roleRows } = await query("users", { select: "role" });

    const roleMap = new Map<string, number>();
    if (roleRows) {
      for (const row of roleRows) {
        roleMap.set(row.role, (roleMap.get(row.role) || 0) + 1);
      }
    }
    const roleDistribution = Array.from(roleMap.entries()).map(([role, _count]) => ({
      role,
      _count,
    }));

    return {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      approvedMembers: approvedMembers || 0,
      totalEvents: totalEvents || 0,
      upcomingEvents: upcomingEvents || 0,
      totalProjects: totalProjects || 0,
      approvedProjects: approvedProjects || 0,
      totalTracks: totalTracks || 0,
      totalModules: totalModules || 0,
      totalBlogPosts: totalBlogPosts || 0,
      publishedBlogPosts: publishedBlogPosts || 0,
      totalOpportunities: totalOpportunities || 0,
      openOpportunities: openOpportunities || 0,
      totalPartners: totalPartners || 0,
      recentMembers: recentMembers || [],
      roleDistribution,
    };
  });

export const getAdminMembers = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      role: z.enum(["GUEST", "MEMBER", "ADMIN", "SUPER_ADMIN"]).optional(),
      isActive: z.boolean().optional(),
      isApproved: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { page, limit, search, role, isActive, isApproved } = data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const filters: Record<string, any> = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.is_active = isActive;
    if (isApproved !== undefined) filters.is_approved = isApproved;

    const {
      data: members,
      count,
      error,
    } = await query("users", {
      select:
        "id, email, role, is_active, is_approved, created_at, profiles(full_name, avatar_url, department, level), leaderboard_entries(total_points)",
      count: "exact",
      filters,
      order: { column: "created_at", ascending: false },
      range: [from, to],
    });

    if (error) throw error;

    let filteredMembers = members || [];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredMembers = filteredMembers.filter(
        (m: any) =>
          m.email?.toLowerCase().includes(lowerSearch) ||
          m.profiles?.full_name?.toLowerCase().includes(lowerSearch),
      );
    }

    return {
      members: filteredMembers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  });

export const assignRole = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      userId: z.string().uuid(),
      role: z.enum(["GUEST", "MEMBER", "ADMIN", "SUPER_ADMIN"]),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, userId, role } = data;

    const { data: users, error } = await supabase.from("users").update({ role }, { id: userId });

    if (error) throw error;

    return users?.[0] ?? null;
  });

export const approveMember = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      userId: z.string().uuid(),
      isApproved: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, userId, isApproved } = data;

    const { data: users, error } = await supabase
      .from("users")
      .update({ is_approved: isApproved }, { id: userId });

    if (error) throw error;

    return users?.[0] ?? null;
  });

export const getSiteSettings = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { data: settings, error } = await query("site_settings", { select: "*" });

    if (error) throw error;

    return settings || [];
  });

export const updateSiteSettings = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      settings: z.array(
        z.object({
          key: z.string().min(1),
          value: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, settings } = data;

    const results = [];
    for (const setting of settings) {
      const { data: existing } = await query("site_settings", {
        select: "id",
        filters: { key: setting.key },
        single: true,
      });

      let result;

      if (existing) {
        const { data: updated, error } = await supabase
          .from("site_settings")
          .update({ value: setting.value }, { key: setting.key });

        if (error) throw error;
        result = updated?.[0] ?? null;
      } else {
        const { data: created, error } = await supabase
          .from("site_settings")
          .insert({ key: setting.key, value: setting.value });

        if (error) throw error;
        result = created?.[0] ?? null;
      }

      results.push(result);
    }

    return results;
  });
