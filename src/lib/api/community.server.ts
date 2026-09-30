import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";

export const COMMUNITY_ACTIVITY_TYPES = {
  mentoring: { label: "Mentoring", points: 5, description: "Helping a peer" },
  discussion: { label: "Discussion", points: 2, description: "Meaningful discussion contribution" },
  "peer-review": { label: "Peer Review", points: 3, description: "Code review for a peer" },
  "help-desk": { label: "Help Desk", points: 2, description: "Answering questions in community" },
  "content-sharing": {
    label: "Content Sharing",
    points: 2,
    description: "Sharing useful resources",
  },
  "event-organizing": {
    label: "Event Organizing",
    points: 5,
    description: "Helping organize an event",
  },
  "open-source-contribution": {
    label: "Open Source Contribution",
    points: 5,
    description: "Contributing to open source",
  },
} as const;

export type CommunityActivityType = keyof typeof COMMUNITY_ACTIVITY_TYPES;

export const logCommunityActivity = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      activityType: z.enum([
        "mentoring",
        "discussion",
        "peer-review",
        "help-desk",
        "content-sharing",
        "event-organizing",
        "open-source-contribution",
      ]),
      description: z.string().min(1).max(500),
    }),
  )
  .handler(async ({ data }) => {
    const activityConfig = COMMUNITY_ACTIVITY_TYPES[data.activityType];
    const points = activityConfig.points;
    const now = new Date().toISOString();

    const { data: activity, error } = await supabase.from("community_activities").insert({
      user_id: data.userId,
      activity_type: data.activityType,
      description: data.description,
      points,
      created_at: now,
    });

    if (error) throw new Error(error.message);

    const { awardPoints } = await import("@/lib/auto-awards");
    await awardPoints(data.userId, "community", points);

    return activity[0];
  });

export const getUserCommunityActivities = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const { data: activities, error } = await query("community_activities", {
      select: "*",
      filters: { user_id: data.userId },
      order: { column: "created_at", ascending: false },
      limit: data.limit,
      range: [data.offset, data.offset + data.limit - 1],
    });

    if (error) throw new Error(error.message);

    const { count: total } = await query("community_activities", {
      select: "id",
      filters: { user_id: data.userId },
      count: "exact",
      head: true,
    });

    return {
      activities: activities || [],
      total: total || 0,
    };
  });

export const getCommunityStats = createServerFn({ method: "GET" })
  .inputValidator(z.object({}).optional())
  .handler(async () => {
    const { count: totalActivities } = await query("community_activities", {
      select: "id",
      count: "exact",
      head: true,
      filters: {},
    });

    const { data: allActivities } = await query("community_activities", {
      select: "user_id, activity_type, points",
      filters: {},
    });

    const contributorMap = new Map<
      string,
      { totalPoints: number; totalActivities: number; activityBreakdown: Record<string, number> }
    >();

    for (const activity of allActivities || []) {
      const userId = activity.user_id as string;
      if (!contributorMap.has(userId)) {
        contributorMap.set(userId, {
          totalPoints: 0,
          totalActivities: 0,
          activityBreakdown: {},
        });
      }
      const stats = contributorMap.get(userId)!;
      stats.totalPoints += activity.points as number;
      stats.totalActivities += 1;
      stats.activityBreakdown[activity.activity_type as string] =
        (stats.activityBreakdown[activity.activity_type as string] || 0) + 1;
    }

    const topContributors = Array.from(contributorMap.entries())
      .sort((a, b) => b[1].totalPoints - a[1].totalPoints)
      .slice(0, 10)
      .map(([userId, stats]) => ({ userId, ...stats }));

    const activityTypeBreakdown: Record<string, number> = {};
    for (const activity of allActivities || []) {
      const type = activity.activity_type as string;
      activityTypeBreakdown[type] = (activityTypeBreakdown[type] || 0) + 1;
    }

    return {
      totalActivities: totalActivities || 0,
      totalContributors: contributorMap.size,
      topContributors,
      activityTypeBreakdown,
    };
  });
