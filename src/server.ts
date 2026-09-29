import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Direct API handlers that bypass TanStack Start's Seroval serialization
async function handleAuthRegister(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp, getRateLimitHeaders } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitKey = `register:${ip}`;
    const headers = getRateLimitHeaders(rateLimitKey, 5, 15 * 60 * 1000);

    if (headers["X-RateLimit-Remaining"] === "0") {
      return new Response(JSON.stringify({ error: "Too many registration attempts. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    const { register } = await import("./lib/api/auth-direct");
    const body = await request.json();
    const result = await register(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Registration failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleAuthLogin(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp, getRateLimitHeaders } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitKey = `login:${ip}`;
    const headers = getRateLimitHeaders(rateLimitKey, 10, 15 * 60 * 1000);

    if (headers["X-RateLimit-Remaining"] === "0") {
      return new Response(JSON.stringify({ error: "Too many login attempts. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    const { login } = await import("./lib/api/auth-direct");
    const body = await request.json();
    const result = await login(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Login failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Generic Supabase REST API — replaces all createServerFn calls
async function handleSupabaseApi(request: Request, pathname: string): Promise<Response> {
  try {
    const { supabase, query } = await import("./lib/supabase");
    const { verifyAccessToken } = await import("./lib/auth");
    const method = request.method;
    const body = method !== "GET" ? await request.json().catch(() => ({})) : {};

    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const isReadOp = pathname.includes("/query") || pathname.includes("/analytics");
    const rateLimitConfig = isReadOp
      ? { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: "api_read" }
      : { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "api_write" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const authHeader = request.headers.get("Authorization");
    const isWriteOp = ["insert", "update", "delete", "rpc", "adjust-points", "settings"].some(
      (op) => pathname.includes(`/api/supabase/${op}`)
    );

    if (isWriteOp) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      if (!payload) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const parts = pathname.replace("/api/supabase/", "").split("/");
    const op = parts[0];
    const table = parts[1];
    const fn = parts[1];

    let result;

    switch (op) {
      case "query": {
        result = await query(table, body);
        break;
      }
      case "insert": {
        result = await supabase.from(table).insert(body);
        break;
      }
      case "update": {
        result = await supabase.from(table).update(body.data, body.filters || {});
        break;
      }
      case "delete": {
        result = await supabase.from(table).delete(body.filters || {});
        break;
      }
      case "rpc": {
        result = await supabase.rpc(fn, body.params || {});
        break;
      }
      // Dedicated analytics: runs 14+ parallel count queries
      case "analytics": {
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
          query("users", { select: "id", count: "exact", head: true, filters: {} }),
          query("users", {
            select: "id",
            count: "exact",
            head: true,
            filters: { is_active: true },
          }),
          query("users", {
            select: "id",
            count: "exact",
            head: true,
            filters: { is_approved: true },
          }),
          query("events", { select: "id", count: "exact", head: true, filters: {} }),
          query("events", {
            select: "id",
            count: "exact",
            head: true,
            filters: { start_date: { __op: "gte", value: now } },
          }),
          query("projects", { select: "id", count: "exact", head: true, filters: {} }),
          query("projects", {
            select: "id",
            count: "exact",
            head: true,
            filters: { status: "APPROVED" },
          }),
          query("tracks", { select: "id", count: "exact", head: true, filters: {} }),
          query("modules", { select: "id", count: "exact", head: true, filters: {} }),
          query("blog_posts", { select: "id", count: "exact", head: true, filters: {} }),
          query("blog_posts", {
            select: "id",
            count: "exact",
            head: true,
            filters: { status: "PUBLISHED" },
          }),
          query("opportunities", { select: "id", count: "exact", head: true, filters: {} }),
          query("opportunities", {
            select: "id",
            count: "exact",
            head: true,
            filters: { status: "OPEN" },
          }),
          query("partners", {
            select: "id",
            count: "exact",
            head: true,
            filters: { is_active: true },
          }),
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

        result = {
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
        break;
      }
      // Settings upsert
      case "settings": {
        const { supabase, query } = await import("./lib/supabase");
        const results = [];
        const settings = body.settings || [];
        for (const setting of settings) {
          const { data: existing } = await query("site_settings", {
            select: "id",
            filters: { key: setting.key },
            single: true,
          });
          if (existing) {
            const { data: updated } = await supabase
              .from("site_settings")
              .update({ value: setting.value }, { key: setting.key });
            results.push(updated?.[0] ?? null);
          } else {
            const { data: created } = await supabase
              .from("site_settings")
              .insert({ key: setting.key, value: setting.value });
            results.push(created?.[0] ?? null);
          }
        }
        result = results;
        break;
      }
      // Learn module completion with points
      case "learn-complete": {
        const { completeModule } = await import("./lib/api/learn-progress.server");
        const { verifyAccessToken } = await import("./lib/auth");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const payload = token ? verifyAccessToken(token) : null;

        if (!payload) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { moduleId, points } = body;

        if (!moduleId) {
          return new Response(JSON.stringify({ error: "moduleId is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const progressResult = await completeModule(payload.userId, moduleId, points);
        result = progressResult;
        break;
      }
      // Leaderboard adjust points
      case "adjust-points": {
        const { supabase, query } = await import("./lib/supabase");
        const { userId, eventPoints, learnPoints, buildPoints, communityPoints } = body;

        const { data: existingEntry } = await query("leaderboard_entries", {
          select: "*",
          filters: { user_id: userId },
          single: true,
        });

        let entry;
        if (existingEntry) {
          const updates: Record<string, unknown> = {};
          if (eventPoints !== undefined) updates.event_points = eventPoints;
          if (learnPoints !== undefined) updates.learn_points = learnPoints;
          if (buildPoints !== undefined) updates.build_points = buildPoints;
          if (communityPoints !== undefined) updates.community_points = communityPoints;

          const ep = eventPoints ?? existingEntry.event_points;
          const lp = learnPoints ?? existingEntry.learn_points;
          const bp = buildPoints ?? existingEntry.build_points;
          const cp = communityPoints ?? existingEntry.community_points;
          updates.total_points = ep + lp + bp + cp;

          const { data: updated } = await supabase
            .from("leaderboard_entries")
            .update(updates, { user_id: userId });
          entry = updated?.[0];
        } else {
          const { data: inserted } = await supabase.from("leaderboard_entries").insert({
            user_id: userId,
            event_points: eventPoints ?? 0,
            learn_points: learnPoints ?? 0,
            build_points: buildPoints ?? 0,
            community_points: communityPoints ?? 0,
            total_points:
              (eventPoints ?? 0) + (learnPoints ?? 0) + (buildPoints ?? 0) + (communityPoints ?? 0),
          });
          entry = inserted?.[0];
        }
        result = entry;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown operation: " + op }), { status: 400 });
    }

    const statusCode = result?.error ? 400 : 200;
    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "API error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleEventAttend(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "api_write" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const { supabase, query } = await import("./lib/supabase");
    const { verifyAccessToken } = await import("./lib/auth");
    const body = await request.json();
    const { eventId, userId, attended } = body;

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!eventId || !userId || attended === undefined) {
      return new Response(JSON.stringify({ error: "eventId, userId, and attended are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: updatedRows, error } = await supabase
      .from("event_rsvps")
      .update({ attended }, { event_id: eventId, user_id: userId });

    if (error) throw new Error(error.message);

    if (attended) {
      const { awardEventPoints } = await import("./lib/auto-awards");
      await awardEventPoints(eventId);
    }

    return new Response(JSON.stringify({ success: true, rsvp: updatedRows?.[0] ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Attendance update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleCommunityLog(request: Request): Promise<Response> {
  try {
    const { supabase, query } = await import("./lib/supabase");
    const { verifyAccessToken } = await import("./lib/auth");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { activityType, description, points } = body;

    if (!activityType || !description || points === undefined) {
      return new Response(JSON.stringify({ error: "activityType, description, and points are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId;

    const { awardPoints } = await import("./lib/auto-awards");
    const now = new Date().toISOString();

    const { data: activity, error } = await supabase.from("community_activities").insert({
      user_id: userId,
      activity_type: activityType,
      description,
      points,
      created_at: now,
    });

    if (error) throw new Error(error.message);

    await awardPoints(userId, "community", points);

    return new Response(JSON.stringify(activity[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Community log failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleAwards(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "api_write" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const body = await request.json();
    const { action, targetId } = body;

    const { awardProjectPoints, awardEventPoints, awardPoints, checkAndAwardBadges, awardChallengeWinPoints, awardChallengeParticipation, checkChallengeBadges } = await import("./lib/auto-awards");
    const { query } = await import("./lib/supabase");

    switch (action) {
      case "project-approved":
        await awardProjectPoints(targetId);
        break;
      case "event-attended":
        await awardEventPoints(targetId);
        break;
      case "challenge-win": {
        const stakePoints = body.stakePoints || 0;
        await awardChallengeWinPoints(targetId, stakePoints);
        break;
      }
      case "challenge-participation":
        await awardChallengeParticipation(targetId);
        break;
      case "challenge-check-badges":
        await checkChallengeBadges(targetId);
        break;
      case "blog-published": {
        const { data: post } = await query("blog_posts", {
          select: "author_id",
          filters: { id: targetId },
          single: true,
        });
        if (post?.author_id) {
          await awardPoints(post.author_id as string, "community", 5);
        }
        break;
      }
      case "profile-completed":
        await awardPoints(targetId, "community", 3);
        break;
      case "check-badges":
        await checkAndAwardBadges(targetId);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown award action" }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Award error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleAuthLogout(request: Request): Promise<Response> {
  try {
    const { deleteRefreshToken } = await import("./lib/auth");
    const body = await request.json();
    await deleteRefreshToken(body.refreshToken);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleChallengeVote(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "api_write" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const { verifyAccessToken } = await import("./lib/auth");
    const { query, from } = await import("./lib/supabase");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { challengeId, participantId } = body;

    if (!challengeId || !participantId) {
      return new Response(
        JSON.stringify({ error: "challengeId and participantId are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { data: entry } = await query("leaderboard_entries", {
      select: "total_points",
      filters: { user_id: payload.userId },
      single: true,
    });
    const weight = entry
      ? Math.max(1, Math.floor((entry.total_points as number) / 50) + 1)
      : 1;

    const { error: voteError } = await from("challenge_votes").insert({
      challenge_id: challengeId,
      voter_id: payload.userId,
      participant_id: participantId,
      weight,
      created_at: new Date().toISOString(),
    });

    if (voteError) {
      if ((voteError.message || "").includes("duplicate") || voteError.code === 409) {
        return new Response(
          JSON.stringify({ error: "You have already voted in this challenge" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      throw new Error(voteError.message || "Vote failed");
    }

    const { data: challenge } = await query("challenges", {
      select: "id, deadline, status",
      filters: { id: challengeId },
      single: true,
    });

    if (challenge && challenge.status !== "completed" && challenge.deadline) {
      const now = new Date();
      const deadline = new Date(challenge.deadline as string);
      if (now >= deadline) {
        const { data: allVotes } = await query("challenge_votes", {
          select: "participant_id, weight",
          filters: { challenge_id: challengeId },
        });

        const tally = new Map<string, number>();
        for (const vote of allVotes || []) {
          const pid = vote.participant_id as string;
          tally.set(pid, (tally.get(pid) || 0) + (vote.weight as number));
        }

        let winnerId = "";
        let maxWeight = 0;
        for (const [pid, w] of tally) {
          if (w > maxWeight) {
            maxWeight = w;
            winnerId = pid;
          }
        }

        if (winnerId) {
          const { distributeWinnings, checkAndAwardChallengeBadges } =
            await import("./lib/challenges");
          await distributeWinnings(challengeId, winnerId);
          await checkAndAwardChallengeBadges(winnerId);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, weight }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Vote failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleVerifyEmail(request: Request): Promise<Response> {
  try {
    const { supabase } = await import("./lib/supabase");
    const { verifyCode } = await import("./lib/auth");
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return new Response(JSON.stringify({ error: "User ID and code required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isValid = await verifyCode(userId, code);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("users")
      .update({ is_active: true, is_approved: true, updated_at: new Date().toISOString() }, { id: userId });

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ message: "Email verified successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Verification failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleResendVerification(request: Request): Promise<Response> {
  try {
    const { query } = await import("./lib/supabase");
    const { generateVerificationCode, storeVerificationCode } = await import("./lib/auth");
    const { sendVerificationEmail } = await import("./lib/email");
    const body = await request.json();

    let email: string;
    let userId: string;

    if (body.userId) {
      const { data: user } = await query("users", {
        select: "id, email, is_active",
        filters: { id: body.userId },
        single: true,
      });
      if (!user) throw new Error("User not found");
      if (user.is_active) throw new Error("This account is already verified");
      email = user.email;
      userId = user.id;
    } else if (body.email) {
      const { data: user } = await query("users", {
        select: "id, email, is_active",
        filters: { email: body.email },
        single: true,
      });
      if (!user) throw new Error("No account found with this email");
      if (user.is_active) throw new Error("This account is already verified");
      email = user.email;
      userId = user.id;
    } else {
      throw new Error("userId or email required");
    }

    const code = generateVerificationCode();
    await storeVerificationCode(userId, code);
    await sendVerificationEmail(email, code);

    return new Response(JSON.stringify({ message: "Verification code resent. Please check your inbox." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to resend verification code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleForgotPassword(request: Request): Promise<Response> {
  try {
    const { query } = await import("./lib/supabase");
    const { generatePasswordResetToken } = await import("./lib/auth");
    const { sendPasswordResetEmail } = await import("./lib/email");
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: user } = await query("users", {
      select: "id, email",
      filters: { email },
      single: true,
    });

    if (!user) {
      return new Response(JSON.stringify({ message: "If an account exists, a reset email has been sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resetToken = generatePasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, resetToken);

    return new Response(JSON.stringify({ message: "If an account exists, a reset email has been sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleResetPassword(request: Request): Promise<Response> {
  try {
    const { supabase } = await import("./lib/supabase");
    const { verifyPasswordResetToken, hashPassword } = await import("./lib/auth");
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return new Response(JSON.stringify({ error: "Token and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const passwordHash = await hashPassword(password);
    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() }, { id: payload.userId });

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ message: "Password reset successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to reset password" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleWhatsAppWebhook(request: Request): Promise<Response> {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const body: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      body[key] = value;
    }

    const { handleWhatsAppWebhook: processWebhook } = await import("./lib/whatsapp/webhook");
    const result = await processWebhook(body);

    return new Response(result.twiml, {
      status: result.status,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    console.error("WhatsApp webhook error:", error.message);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

async function handleWhatsAppStats(request: Request): Promise<Response> {
  try {
    const { verifyAccessToken } = await import("./lib/auth");
    const { query } = await import("./lib/supabase");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload || (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { count: totalInteractions } = await query("whatsapp_interactions", {
      select: "id",
      count: "exact",
      head: true,
      filters: {},
    });

    const { data: allInteractions } = await query("whatsapp_interactions", {
      select: "user_id, phone_number, classification, points",
      filters: {},
    });

    const memberMap = new Map<string, { points: number; messages: number; breakdown: Record<string, number> }>();
    for (const interaction of allInteractions || []) {
      const key = interaction.user_id || interaction.phone_number;
      if (!memberMap.has(key)) {
        memberMap.set(key, { points: 0, messages: 0, breakdown: {} });
      }
      const stats = memberMap.get(key)!;
      stats.points += (interaction.points as number) || 0;
      stats.messages += 1;
      const cls = interaction.classification as string;
      stats.breakdown[cls] = (stats.breakdown[cls] || 0) + 1;
    }

    const topContributors = Array.from(memberMap.entries())
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, 10)
      .map(([id, stats]) => ({ userId: id, ...stats }));

    return new Response(
      JSON.stringify({
        totalInteractions: totalInteractions || 0,
        activeMembers: memberMap.size,
        topContributors,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Stats failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleProfileUpdate(request: Request): Promise<Response> {
  try {
    const { supabase, query } = await import("./lib/supabase");
    const { verifyAccessToken } = await import("./lib/auth");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { skills: newSkills, ...profileData } = body;

    const profileUpdates: Record<string, any> = {};
    if (profileData.fullName !== undefined) profileUpdates.full_name = profileData.fullName;
    if (profileData.username !== undefined) profileUpdates.username = profileData.username || null;
    if (profileData.phone !== undefined) profileUpdates.phone = profileData.phone || null;
    if (profileData.nickname !== undefined) profileUpdates.nickname = profileData.nickname || null;
    if (profileData.avatarUrl !== undefined)
      profileUpdates.avatar_url = profileData.avatarUrl || null;
    if (profileData.department !== undefined) profileUpdates.department = profileData.department;
    if (profileData.level !== undefined) profileUpdates.level = profileData.level;
    if (profileData.experienceLevel !== undefined)
      profileUpdates.experience_level = profileData.experienceLevel;
    if (profileData.funFact !== undefined) profileUpdates.fun_fact = profileData.funFact || null;
    if (profileData.bio !== undefined) profileUpdates.bio = profileData.bio || null;
    if (profileData.xLink !== undefined) profileUpdates.x_link = profileData.xLink || null;
    if (profileData.githubLink !== undefined)
      profileUpdates.github_link = profileData.githubLink || null;
    if (profileData.portfolioLink !== undefined)
      profileUpdates.portfolio_link = profileData.portfolioLink || null;
    profileUpdates.updated_at = new Date().toISOString();

    const { data: profile } = await query("profiles", {
      select: "id",
      filters: { user_id: payload.userId },
      single: true,
    });

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (Object.keys(profileUpdates).length > 1) {
      const { error } = await supabase.from("profiles").update(profileUpdates, { id: profile.id });
      if (error) throw new Error(error.message);
    }

    if (newSkills !== undefined) {
      await supabase.from("profile_skills").delete({ profile_id: profile.id });
      for (const skillName of newSkills) {
        const { data: existingSkill } = await query("skills", {
          select: "id",
          filters: { name: skillName },
          single: true,
        });
        let skillId = existingSkill?.id;
        if (!skillId) {
          const { data: newSkill } = await supabase
            .from("skills")
            .insert({ id: crypto.randomUUID(), name: skillName });
          skillId = newSkill?.[0]?.id;
        }
        if (skillId) {
          await supabase
            .from("profile_skills")
            .insert({ profile_id: profile.id, skill_id: skillId });
        }
      }
    }

    const { data: updatedProfile } = await query("profiles", {
      select: "*",
      filters: { user_id: payload.userId },
      single: true,
    });

    const { data: profileSkills } = await query("profile_skills", {
      select: "skills(name)",
      filters: { profile_id: profile.id },
    });
    const skills = profileSkills?.map((ps: any) => ps.skills?.name).filter(Boolean) || [];

    return new Response(
      JSON.stringify({
        user: {
          id: payload.userId,
          profile: {
            fullName: updatedProfile.full_name,
            username: updatedProfile.username || undefined,
            phone: updatedProfile.phone || undefined,
            nickname: updatedProfile.nickname || undefined,
            avatarUrl: updatedProfile.avatar_url || undefined,
            dateOfBirth: updatedProfile.date_of_birth || undefined,
            department: updatedProfile.department || "",
            level: updatedProfile.level || "L100",
            experienceLevel: updatedProfile.experience_level || undefined,
            funFact: updatedProfile.fun_fact || undefined,
            bio: updatedProfile.bio || undefined,
            xLink: updatedProfile.x_link || undefined,
            githubLink: updatedProfile.github_link || undefined,
            portfolioLink: updatedProfile.portfolio_link || undefined,
            skills,
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Profile update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleAvatarUpload(request: Request): Promise<Response> {
  try {
    const { verifyAccessToken } = await import("./lib/auth");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Only JPEG, PNG, and WebP images are allowed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size must be under 5MB" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { uploadToSupabase } = await import("./lib/upload");
    const result = await uploadToSupabase(file, "avatars", "avatars");

    return new Response(JSON.stringify({ url: result.url, path: result.path }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Upload failed", details: error.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleProjectUpload(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitConfig = { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: "upload" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const { verifyAccessToken } = await import("./lib/auth");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "project-logos";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Only JPEG, PNG, WebP, and SVG images are allowed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size must be under 5MB" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { uploadToSupabase } = await import("./lib/upload");
    const result = await uploadToSupabase(file, bucket, "");

    return new Response(JSON.stringify({ url: result.url, path: result.path }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    console.error("Project upload error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Upload failed", details: error.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleProjectSubmit(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "api_write" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const { verifyAccessToken } = await import("./lib/auth");
    const { supabase } = await import("./lib/supabase");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();

    const { error: projectError, data: inserted } = await supabase
      .from("projects")
      .insert({
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description || null,
        headline: body.headline || null,
        team_name: body.teamName || null,
        cover_image: body.logoUrl || null,
        logo_url: body.logoUrl || null,
        banner_url: body.bannerUrl || null,
        github_url: body.githubUrl || null,
        demo_url: body.demoUrl || null,
        website_url: body.websiteUrl || body.demoUrl || null,
        x_link: body.xLink || null,
        ecosystem: body.ecosystem || "GENERAL",
        hackathon_id: body.hackathonId || null,
        status: "PENDING",
        submitted_by: payload.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (projectError) {
      return new Response(JSON.stringify({ error: projectError.message || "Failed to submit project" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const project = Array.isArray(inserted) ? inserted[0] : inserted;

    if (body.memberIds && body.memberIds.length > 0 && project) {
      await supabase.from("project_members").insert(
        body.memberIds.map((userId: string) => ({
          project_id: project.id,
          user_id: userId,
          role: "Member",
        }))
      );
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    console.error("Project submit error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Submit failed", details: error.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleProfileFetch(request: Request): Promise<Response> {
  try {
    const { supabase, query } = await import("./lib/supabase");
    const { verifyAccessToken } = await import("./lib/auth");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await query("profiles", {
      select: "*",
      filters: { user_id: payload.userId },
      single: true,
    });

    const { data: profileSkills } = await query("profile_skills", {
      select: "skills(name)",
      filters: { profile_id: profile?.id },
    });
    const skills = profileSkills?.map((ps: any) => ps.skills?.name).filter(Boolean) || [];

    const { data: userBadges } = await query("user_badges", {
      select: "badges(name, label, description, icon, color)",
      filters: { user_id: payload.userId },
    });
    const badges = userBadges?.map((ub: any) => ub.badges).filter(Boolean) || [];

    return new Response(
      JSON.stringify({
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
          : null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to fetch profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleDevlogCreate(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: "api_write" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const { verifyAccessToken } = await import("./lib/auth");
    const { supabase } = await import("./lib/supabase");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { error, data } = await supabase.from("devlog_entries").insert({
      user_id: payload.userId,
      week_number: body.week_number,
      content: body.content,
      is_published: body.is_published !== false,
    });

    if (error) {
      if (error.message?.includes("duplicate") || error.code === 409) {
        return new Response(JSON.stringify({ error: "Entry already exists for this week" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: error.message || "Insert failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entry = Array.isArray(data) ? data[0] : data;
    try {
      const { awardPoints } = await import("./lib/auto-awards");
      await awardPoints(payload.userId, "community", 5);

      const { query } = await import("./lib/supabase");
      const { data: allEntries } = await query("devlog_entries", {
        select: "week_number,is_published",
        filters: { user_id: payload.userId, is_published: true },
        order: { column: "week_number", ascending: true },
      });

      if (allEntries && allEntries.length >= 4) {
        const weeks = allEntries.map((e: any) => e.week_number).sort((a: number, b: number) => a - b);
        let longestStreak = 1;
        let currentRun = 1;
        for (let i = 1; i < weeks.length; i++) {
          if (weeks[i] === weeks[i - 1] + 1) {
            currentRun++;
            if (currentRun > longestStreak) longestStreak = currentRun;
          } else {
            currentRun = 1;
          }
        }

        if (longestStreak >= 4) {
          const { data: existingBadge } = await query("user_badges", {
            select: "id",
            filters: { user_id: payload.userId },
            single: true,
          });

          if (!existingBadge) {
            const { data: streakBadge } = await query("badges", {
              select: "id",
              filters: { name: "streak-master" },
              single: true,
            });

            if (streakBadge) {
              await supabase.from("user_badges").insert({
                user_id: payload.userId,
                badge_id: streakBadge.id,
              });
            }
          }
        }
      }
    } catch {}

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to create entry" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleIntakeSubmit(request: Request): Promise<Response> {
  try {
    const { checkRateLimit, getClientIp } = await import("./lib/rate-limit");
    const ip = getClientIp(request);
    const rateLimitConfig = { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: "api_write" };
    const { allowed, headers: rateLimitHeaders } = checkRateLimit(ip, rateLimitConfig);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const { verifyAccessToken } = await import("./lib/auth");
    const { supabase } = await import("./lib/supabase");
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { query } = await import("./lib/supabase");
    const { data: existing } = await query("intake_assessments", {
      select: "id,lane,total_score",
      filters: { user_id: payload.userId },
      single: true,
    });

    if (existing) {
      return new Response(JSON.stringify({ 
        error: "Assessment already submitted",
        result: existing
      }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    const body = await request.json();
    const { error, data } = await supabase.from("intake_assessments").insert({
      user_id: payload.userId,
      swe_score: body.swe_score ?? 0,
      blockchain_score: body.blockchain_score ?? 0,
      total_score: body.total_score ?? 0,
      practical_completed: body.practical_completed ?? false,
      fork_url: body.fork_url || null,
      lane: body.lane || "Foundation Lane",
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message || "Insert failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const assessment = Array.isArray(data) ? data[0] : data;

    try {
      const { awardPoints } = await import("./lib/auto-awards");
      await awardPoints(payload.userId, "community", 3);
    } catch {}

    return new Response(JSON.stringify(assessment), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to submit assessment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const cacheRules: Record<string, string> = {
  "^/$": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  "^/events$": "public, max-age=300, s-maxage=300",
  "^/events/.+": "public, max-age=300, s-maxage=300",
  "^/learn$": "public, max-age=600, s-maxage=600",
  "^/learn/.+": "public, max-age=600, s-maxage=600",
  "^/leaderboard$": "public, s-maxage=300",
  "^/projects$": "public, max-age=300, s-maxage=300",
  "^/projects/.+": "public, max-age=300, s-maxage=300",
  "^/alumni$": "public, max-age=3600, s-maxage=3600",
  "^/blog$": "public, max-age=600, s-maxage=600",
  "^/blog/.+": "public, max-age=600, s-maxage=600",
};

function getCacheHeader(pathname: string): string | null {
  for (const [pattern, header] of Object.entries(cacheRules)) {
    if (new RegExp(pattern).test(pathname)) return header;
  }
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Intercept direct API routes before TanStack Start handles them
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      return handleAuthRegister(request);
    }
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      return handleAuthLogin(request);
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return handleAuthLogout(request);
    }
    if (url.pathname === "/api/auth/profile" && request.method === "POST") {
      return handleProfileUpdate(request);
    }
    if (url.pathname === "/api/auth/profile" && request.method === "GET") {
      return handleProfileFetch(request);
    }
  if (url.pathname === "/api/auth/avatar" && request.method === "POST") {
    return handleAvatarUpload(request);
  }
  if (url.pathname === "/api/auth/verify-email" && request.method === "POST") {
    return handleVerifyEmail(request);
  }
  if (url.pathname === "/api/auth/resend-verification" && request.method === "POST") {
    return handleResendVerification(request);
  }
  if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") {
    return handleForgotPassword(request);
  }
  if (url.pathname === "/api/auth/reset-password" && request.method === "POST") {
    return handleResetPassword(request);
  }
  if (url.pathname === "/api/whatsapp/webhook" && request.method === "POST") {
    return handleWhatsAppWebhook(request);
  }
  if (url.pathname === "/api/whatsapp/stats" && request.method === "GET") {
    return handleWhatsAppStats(request);
  }
  if (url.pathname === "/api/supabase/community-log" && request.method === "POST") {
    return handleCommunityLog(request);
  }
  if (url.pathname === "/api/projects/upload" && request.method === "POST") {
    return handleProjectUpload(request);
  }
  if (url.pathname === "/api/projects/submit" && request.method === "POST") {
    return handleProjectSubmit(request);
  }
  if (url.pathname.startsWith("/api/supabase/")) {
      return handleSupabaseApi(request, url.pathname);
    }
  if (url.pathname === "/api/awards" && request.method === "POST") {
    return handleAwards(request);
  }
  if (url.pathname === "/api/events/attend" && request.method === "POST") {
    return handleEventAttend(request);
  }
  if (url.pathname === "/api/challenges/vote" && request.method === "POST") {
    return handleChallengeVote(request);
  }
  if (url.pathname === "/api/devlog" && request.method === "POST") {
    return handleDevlogCreate(request);
  }
  if (url.pathname === "/api/intake/submit" && request.method === "POST") {
    return handleIntakeSubmit(request);
  }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      let final = await normalizeCatastrophicSsrResponse(response);
      if (request.method === "GET" && final.status >= 200 && final.status < 400) {
        const cacheHeader = getCacheHeader(url.pathname);
        if (cacheHeader) {
          final = new Response(final.body, {
            status: final.status,
            statusText: final.statusText,
            headers: { ...Object.fromEntries(final.headers.entries()), "Cache-Control": cacheHeader },
          });
        }
      }
      return final;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
