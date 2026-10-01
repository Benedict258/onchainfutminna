import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api/guard.server";

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(100).default(50),
      ecosystem: z.enum(["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { limit, ecosystem } = data;

    const filters: Record<string, any> = {};
    if (ecosystem) filters.ecosystem = ecosystem;

    const { data: entries, error } = await query("leaderboard_entries", {
      select:
        "*, users(id, profiles(full_name, nickname, avatar_url, department, level)), user_badges(badges(name, label, description, icon, color, bg_color))",
      filters,
      order: { column: "total_points", ascending: false },
      limit,
    });

    if (error) throw error;

    return (entries || []).map((entry: any, index: number) => ({
      rank: index + 1,
      ...entry,
    }));
  });

export const getLeaderboardEntry = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: entry, error } = await query("leaderboard_entries", {
      select:
        "*, users(id, profiles(full_name, nickname, avatar_url, department, level)), user_badges(badges(name, label, description, icon, color, bg_color))",
      filters: { user_id: data.userId },
      single: true,
    });

    if (error) throw error;
    if (!entry) throw new Error("Leaderboard entry not found");

    const { count: higherCount, error: countError } = await query("leaderboard_entries", {
      select: "id",
      count: "exact",
      head: true,
      filters: { total_points: { __op: "gt", value: entry.total_points } },
    });

    if (countError) throw countError;

    return {
      rank: (higherCount || 0) + 1,
      ...entry,
    };
  });

export const adjustPoints = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      userId: z.string().uuid(),
      eventPoints: z.number().optional(),
      learnPoints: z.number().optional(),
      buildPoints: z.number().optional(),
      communityPoints: z.number().optional(),
      reason: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, userId, ...pointsData } = data;

    const { data: existingEntry } = await query("leaderboard_entries", {
      select: "*",
      filters: { user_id: userId },
      single: true,
    });

    const updates: Record<string, unknown> = {};
    if (pointsData.eventPoints !== undefined) updates.event_points = pointsData.eventPoints;
    if (pointsData.learnPoints !== undefined) updates.learn_points = pointsData.learnPoints;
    if (pointsData.buildPoints !== undefined) updates.build_points = pointsData.buildPoints;
    if (pointsData.communityPoints !== undefined)
      updates.community_points = pointsData.communityPoints;

    if (existingEntry) {
      const eventPts = pointsData.eventPoints ?? existingEntry.event_points;
      const learnPts = pointsData.learnPoints ?? existingEntry.learn_points;
      const buildPts = pointsData.buildPoints ?? existingEntry.build_points;
      const communityPts = pointsData.communityPoints ?? existingEntry.community_points;
      updates.total_points = eventPts + learnPts + buildPts + communityPts;
    }

    let entry;

    if (existingEntry) {
      const { data: updated, error } = await supabase
        .from("leaderboard_entries")
        .update(updates, { user_id: userId });

      if (error) throw error;
      entry = updated[0];
    } else {
      const { data: inserted, error } = await supabase.from("leaderboard_entries").insert({
        user_id: userId,
        event_points: pointsData.eventPoints ?? 0,
        learn_points: pointsData.learnPoints ?? 0,
        build_points: pointsData.buildPoints ?? 0,
        community_points: pointsData.communityPoints ?? 0,
        total_points:
          (pointsData.eventPoints ?? 0) +
          (pointsData.learnPoints ?? 0) +
          (pointsData.buildPoints ?? 0) +
          (pointsData.communityPoints ?? 0),
      });

      if (error) throw error;
      entry = inserted[0];
    }

    return entry;
  });
