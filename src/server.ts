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
    // Generous per IP: a whole campus can share one address on Wi-Fi.
    const rateLimitKey = `register:${ip}`;
    const headers = getRateLimitHeaders(rateLimitKey, 20, 15 * 60 * 1000);

    if (headers["Retry-After"]) {
      return new Response(
        JSON.stringify({ error: "Too many registration attempts. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...headers },
        },
      );
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
    // Generous per IP (shared campus Wi-Fi); the per-account limit below stops guessing.
    const rateLimitKey = `login:${ip}`;
    const headers = getRateLimitHeaders(rateLimitKey, 60, 15 * 60 * 1000);

    if (headers["Retry-After"]) {
      return new Response(
        JSON.stringify({ error: "Too many login attempts. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...headers },
        },
      );
    }

    const { login } = await import("./lib/api/auth-direct");
    const body = await request.json();
    const identifier =
      typeof body?.identifier === "string" ? body.identifier.trim().toLowerCase() : "";
    const perAccount = await enforceLimits([[`login-account:${identifier}`, 10, 15 * MINUTE]]);
    if (perAccount) return perAccount;
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

// Tables only admins may read through the generic query route.
const ADMIN_ONLY_TABLES = [
  "users",
  "refresh_tokens",
  "verification_codes",
  "rust_scholarship_applications",
  "scholarship_admins",
  "whatsapp_interactions",
];
// Credentials: never readable through the generic route, not even by admins.
const SECRET_FIELDS = /password|\btoken\b|refresh_tokens|verification_codes/i;
// Personal data members and visitors must not pull for other people.
const PRIVATE_FIELDS = /\b(phone|phone_whatsapp|date_of_birth|email)\b/i;
const ADMIN_ONLY_REF = new RegExp(`\\b(${ADMIN_ONLY_TABLES.join("|")})\\b`, "i");

/** Returns an error message if this generic read must be refused, else null. */
function checkQueryAccess(table: string, body: any, isAdmin: boolean): string | null {
  if (!/^[a-z_]+$/.test(table ?? "")) return "Invalid table";
  const select = String(body?.select ?? "*");
  // Everything a caller can name: selected/embedded columns, filter columns, sort column.
  const referenced = [
    select,
    ...Object.keys(body?.filters ?? {}),
    String(body?.order?.column ?? ""),
  ].join(" ");
  if (SECRET_FIELDS.test(referenced)) return "Forbidden";
  if (isAdmin) return null;
  if (ADMIN_ONLY_TABLES.includes(table) || ADMIN_ONLY_REF.test(referenced)) return "Forbidden";
  if (PRIVATE_FIELDS.test(referenced)) return "Forbidden";
  // "*" on profiles (directly or embedded) would include phone and date of birth.
  if ((table === "profiles" && select.includes("*")) || /profiles\s*\(\s*\*/.test(select))
    return "Forbidden";
  return null;
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
      (op) => pathname.includes(`/api/supabase/${op}`),
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

    // This route runs with the service-role key, so it must enforce access itself.
    if (op === "query" || op === "analytics") {
      const caller = authHeader?.startsWith("Bearer ")
        ? verifyAccessToken(authHeader.slice(7))
        : null;
      const isAdmin = caller?.role === "ADMIN" || caller?.role === "SUPER_ADMIN";
      const denied =
        op === "analytics"
          ? isAdmin
            ? null
            : "Forbidden"
          : checkQueryAccess(table, body, isAdmin);
      if (denied) {
        return new Response(JSON.stringify({ error: denied }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

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

        const moduleId = typeof body.moduleId === "string" ? body.moduleId : "";
        const { data: moduleRow } = moduleId
          ? await query("modules", { select: "id", filters: { id: moduleId }, single: true })
          : { data: null };

        if (!moduleRow) {
          return new Response(JSON.stringify({ error: "A valid moduleId is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Points are fixed on the server; a client-supplied value is ignored.
        const progressResult = await completeModule(payload.userId, moduleId);
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
    // Marking attendance awards points, so only admins may do it.
    if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      typeof eventId !== "string" ||
      typeof userId !== "string" ||
      typeof attended !== "boolean"
    ) {
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

// Points for self-reported community activities, and how many count per day.
const COMMUNITY_ACTIVITY_POINTS: Record<string, number> = {
  pair_programming: 5,
  review: 5,
};
const COMMUNITY_DAILY_LIMIT = 3;

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
    const activityType = typeof body.activityType === "string" ? body.activityType : "";
    const description = typeof body.description === "string" ? body.description.slice(0, 500) : "";
    // Points are decided here, never by the client.
    const points = COMMUNITY_ACTIVITY_POINTS[activityType];

    if (!points || !description) {
      return new Response(
        JSON.stringify({ error: "Unknown activity type or missing description" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const userId = payload.userId;

    const { awardPoints } = await import("./lib/auto-awards");
    const now = new Date().toISOString();

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { count: todayCount } = await query("community_activities", {
      select: "id",
      count: "exact",
      head: true,
      filters: {
        user_id: userId,
        activity_type: activityType,
        created_at: { __op: "gte", value: startOfDay.toISOString() },
      },
    });
    if ((todayCount ?? 0) >= COMMUNITY_DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Daily limit reached for this activity. Try again tomorrow." }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

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

    // Only admin screens trigger awards; nobody else may hand out points or badges.
    const { verifyAccessToken } = await import("./lib/auth");
    const authHeader = request.headers.get("Authorization");
    const caller = authHeader?.startsWith("Bearer ")
      ? verifyAccessToken(authHeader.slice(7))
      : null;
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN")) {
      return new Response(JSON.stringify({ error: caller ? "Forbidden" : "Unauthorized" }), {
        status: caller ? 403 : 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const targetId = typeof body.targetId === "string" ? body.targetId : "";

    const {
      awardProjectPoints,
      awardEventPoints,
      awardPoints,
      checkAndAwardBadges,
      awardChallengeWinPoints,
      awardChallengeParticipation,
      checkChallengeBadges,
    } = await import("./lib/auto-awards");
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
      return new Response(JSON.stringify({ error: "challengeId and participantId are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: entry } = await query("leaderboard_entries", {
      select: "total_points",
      filters: { user_id: payload.userId },
      single: true,
    });
    const weight = entry ? Math.max(1, Math.floor((entry.total_points as number) / 50) + 1) : 1;

    const { error: voteError } = await from("challenge_votes").insert({
      challenge_id: challengeId,
      voter_id: payload.userId,
      participant_id: participantId,
      weight,
      created_at: new Date().toISOString(),
    });

    if (voteError) {
      if ((voteError.message || "").includes("duplicate") || voteError.code === 409) {
        return new Response(JSON.stringify({ error: "You have already voted in this challenge" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
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

const MINUTE = 60 * 1000;

const jsonResponse = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

// Request values used in filters must be plain strings: the query helper treats
// {__op, value} objects as operators, which would let a caller rewrite the filter.
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Counts this request against each [key, max, windowMs] limit; a 429 response if any is used up. */
async function enforceLimits(limits: [string, number, number][]): Promise<Response | null> {
  const { getRateLimitHeaders } = await import("./lib/rate-limit");
  for (const [key, max, windowMs] of limits) {
    const headers = getRateLimitHeaders(key, max, windowMs);
    if (headers["Retry-After"]) {
      return jsonResponse({ error: "Too many attempts. Please try again later." }, 429, headers);
    }
  }
  return null;
}

async function handleVerifyEmail(request: Request): Promise<Response> {
  try {
    const { supabase, query } = await import("./lib/supabase");
    const { verifyCode } = await import("./lib/auth");
    const { getClientIp } = await import("./lib/rate-limit");
    const body = await request.json();
    const userId = str(body.userId);
    const code = str(body.code);

    if (!userId || !/^\d{6}$/.test(code)) {
      return jsonResponse({ error: "User ID and a 6-digit code are required" }, 400);
    }

    // 5 guesses per account per 15 minutes makes the 900,000-code space impractical to guess.
    const limited = await enforceLimits([
      [`verify-ip:${getClientIp(request)}`, 60, 15 * MINUTE],
      [`verify-user:${userId}`, 5, 15 * MINUTE],
    ]);
    if (limited) return limited;

    const isValid = await verifyCode(userId, code);
    if (!isValid) {
      return jsonResponse({ error: "Invalid or expired code" }, 400);
    }

    const { error } = await supabase
      .from("users")
      .update(
        { is_active: true, is_approved: true, updated_at: new Date().toISOString() },
        { id: userId },
      );

    if (error) throw new Error(error.message);

    // Best effort: a failed welcome email must not undo a successful verification.
    try {
      const { data: user } = await query("users", {
        select: "email, profiles(full_name)",
        filters: { id: userId },
        single: true,
      });
      if (user?.email) {
        const { sendWelcomeEmail } = await import("./lib/email");
        const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles;
        await sendWelcomeEmail(user.email, profile?.full_name || "builder");
      }
    } catch (e) {
      console.error("[verify-email] welcome email failed:", (e as Error).message);
    }

    return jsonResponse({ message: "Email verified successfully" });
  } catch (error) {
    console.error("[verify-email]", error);
    return jsonResponse({ error: "Verification failed" }, 500);
  }
}

async function handleResendVerification(request: Request): Promise<Response> {
  try {
    const { query } = await import("./lib/supabase");
    const { generateVerificationCode, storeVerificationCode } = await import("./lib/auth");
    const { sendVerificationEmail } = await import("./lib/email");
    const { getClientIp } = await import("./lib/rate-limit");
    const body = await request.json();
    const userId = str(body.userId);
    const emailInput = str(body.email);

    if (!userId && !emailInput) {
      return jsonResponse({ error: "userId or email required" }, 400);
    }

    const limited = await enforceLimits([
      [`resend-ip:${getClientIp(request)}`, 15, 15 * MINUTE],
      [`resend-target:${userId || emailInput}`, 3, 15 * MINUTE],
    ]);
    if (limited) return limited;

    const { data: user } = await query("users", {
      select: "id, email, is_active",
      filters: userId ? { id: userId } : { email: emailInput },
      single: true,
    });

    // Looking up by email: answer the same way whether or not the account exists.
    const generic = { message: "If an unverified account exists, a new code has been sent." };
    if (!user)
      return userId ? jsonResponse({ error: "User not found" }, 404) : jsonResponse(generic);
    if (user.is_active) {
      return userId
        ? jsonResponse({ error: "This account is already verified" }, 400)
        : jsonResponse(generic);
    }

    const code = generateVerificationCode();
    await storeVerificationCode(user.id, code);
    await sendVerificationEmail(user.email, code);

    return jsonResponse({ message: "Verification code resent. Please check your inbox." });
  } catch (error) {
    console.error("[resend-verification]", error);
    return jsonResponse({ error: "Failed to resend verification code. Please try again." }, 500);
  }
}

async function handleForgotPassword(request: Request): Promise<Response> {
  const generic = { message: "If an account exists, a reset email has been sent" };
  try {
    const { query } = await import("./lib/supabase");
    const { generatePasswordResetToken } = await import("./lib/auth");
    const { sendPasswordResetEmail } = await import("./lib/email");
    const { getClientIp } = await import("./lib/rate-limit");
    const body = await request.json();
    const email = str(body.email);

    if (!email) return jsonResponse({ error: "Email required" }, 400);

    const limited = await enforceLimits([
      [`forgot-ip:${getClientIp(request)}`, 15, 15 * MINUTE],
      [`forgot-email:${email}`, 3, 60 * MINUTE],
    ]);
    if (limited) return limited;

    const { data: user } = await query("users", {
      select: "id, email, password_hash",
      filters: { email },
      single: true,
    });

    if (user) {
      const resetToken = generatePasswordResetToken(user.id, user.password_hash);
      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (e) {
        // Don't reveal (via a different response) that this email has an account.
        console.error("[forgot-password] reset email failed:", (e as Error).message);
      }
    }

    return jsonResponse(generic);
  } catch (error) {
    console.error("[forgot-password]", error);
    return jsonResponse({ error: "Failed to process request" }, 500);
  }
}

async function handleResetPassword(request: Request): Promise<Response> {
  try {
    const { supabase, query } = await import("./lib/supabase");
    const {
      verifyPasswordResetToken,
      passwordFingerprint,
      hashPassword,
      deleteAllUserRefreshTokens,
    } = await import("./lib/auth");
    const { getClientIp } = await import("./lib/rate-limit");
    const body = await request.json();
    const token = str(body.token);
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || !password) {
      return jsonResponse({ error: "Token and password required" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }

    const limited = await enforceLimits([[`reset-ip:${getClientIp(request)}`, 10, 15 * MINUTE]]);
    if (limited) return limited;

    const payload = verifyPasswordResetToken(token);
    const { data: user } = payload
      ? await query("users", {
          select: "id, password_hash",
          filters: { id: payload.userId },
          single: true,
        })
      : { data: null };

    // The token carries a fingerprint of the password hash at the time it was issued, so
    // once the password changes (i.e. the link has been used) it no longer matches.
    if (!payload || !user || passwordFingerprint(user.password_hash) !== payload.pwd) {
      return jsonResponse({ error: "This reset link is invalid, expired or already used" }, 400);
    }

    const passwordHash = await hashPassword(password);
    const { error } = await supabase
      .from("users")
      .update(
        { password_hash: passwordHash, updated_at: new Date().toISOString() },
        { id: user.id },
      );

    if (error) throw new Error(error.message);

    // Sign out every existing session for this account.
    await deleteAllUserRefreshTokens(user.id);

    return jsonResponse({ message: "Password reset successfully" });
  } catch (error) {
    console.error("[reset-password]", error);
    return jsonResponse({ error: "Failed to reset password" }, 500);
  }
}

async function handleScholarshipApply(request: Request): Promise<Response> {
  try {
    const { z } = await import("zod");
    const { supabase, query } = await import("./lib/supabase");
    const { getClientIp } = await import("./lib/rate-limit");
    const { scholarshipConfig } = await import("./lib/config/scholarship");

    const limited = await enforceLimits([
      [`scholarship-ip:${getClientIp(request)}`, 30, 60 * MINUTE],
    ]);
    if (limited) return limited;

    // Mirrors the table's constraints, so bad input gets a clear message instead of a DB error.
    const schema = z.object({
      full_name: z.string().trim().min(2).max(120),
      email: z.string().trim().toLowerCase().email().max(254),
      phone_whatsapp: z.string().trim().min(7).max(20),
      department: z.string().trim().min(1).max(120),
      level: z.enum(["100", "200", "300", "400", "500", "Postgraduate", "Graduate"]),
      club_member: z.boolean(),
      programming_experience: z.enum(["never", "beginner", "intermediate", "advanced"]),
      rust_experience: z.enum(["none", "a_little", "comfortable"]),
      github_url: z.string().url().max(300).nullable(),
      can_attend_full: z.enum(["yes", "mostly", "no"]),
      weekly_hours: z.enum(["under_5", "5_10", "10_15", "15_plus"]),
      has_laptop: z.enum(["yes", "shared", "no"]),
      motivation: z.string().trim().min(1).max(800),
      goal_by_end_nov: z.string().trim().min(1).max(500),
      built_description: z.string().trim().max(800),
      built_link: z.string().url().max(500).nullable(),
    });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join(".") || "form";
      return jsonResponse({ error: `Please check the "${field}" field.` }, 400);
    }
    const app = parsed.data;

    const { data: settings } = await query("scholarship_settings", {
      select: "opens_at,closes_at",
      filters: { id: 1 },
      single: true,
    });
    const now = new Date();
    if (settings && !(new Date(settings.opens_at) <= now && now <= new Date(settings.closes_at))) {
      return jsonResponse({ error: "Applications for this scholarship are closed." }, 403);
    }

    // This route writes with the service key (RLS bypassed), so only known fields go in;
    // status and review scores keep their table defaults.
    const { error } = await supabase.from("rust_scholarship_applications").insert(
      {
        ...app,
        // Agreed to by submitting (see the note above the form's Submit button).
        accuracy_confirmed: true,
        seat_forfeit_ack: true,
        data_consent: true,
        languages_tools: [],
        rust_reasoning: "",
      },
      { returning: "minimal" },
    );
    if (error) {
      if (error.pgCode === "23505" || error.code === 409) {
        return jsonResponse({ error: "An application with this email already exists." }, 409);
      }
      throw new Error(error.message);
    }

    // Best effort: the application is saved even if the confirmation email fails.
    try {
      const { sendScholarshipConfirmationEmail } = await import("./lib/email");
      await sendScholarshipConfirmationEmail(app.email, app.full_name, {
        resultsAnnounce: scholarshipConfig.resultsAnnounce,
        bootcampDates: scholarshipConfig.bootcampDates,
        contactEmail: scholarshipConfig.contactEmail,
      });
    } catch (e) {
      console.error("[scholarship-apply] confirmation email failed:", (e as Error).message);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("[scholarship-apply]", error);
    return jsonResponse({ error: "Submission failed. Please try again." }, 500);
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

    const memberMap = new Map<
      string,
      { points: number; messages: number; breakdown: Record<string, number> }
    >();
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
    return new Response(JSON.stringify({ error: "Upload failed. Please try again." }), {
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
        { status: 400, headers: { "Content-Type": "application/json" } },
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
    return new Response(JSON.stringify({ error: "Upload failed. Please try again." }), {
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

    const { error: projectError, data: inserted } = await supabase.from("projects").insert({
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
      return new Response(
        JSON.stringify({ error: projectError.message || "Failed to submit project" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const project = Array.isArray(inserted) ? inserted[0] : inserted;

    if (body.memberIds && body.memberIds.length > 0 && project) {
      await supabase.from("project_members").insert(
        body.memberIds.map((userId: string) => ({
          project_id: project.id,
          user_id: userId,
          role: "Member",
        })),
      );
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders },
    });
  } catch (error: any) {
    console.error("Project submit error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: "Submit failed. Please try again." }), {
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
        const weeks = allEntries
          .map((e: any) => e.week_number)
          .sort((a: number, b: number) => a - b);
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
      return new Response(
        JSON.stringify({
          error: "Assessment already submitted",
          result: existing,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json", ...rateLimitHeaders },
        },
      );
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

// Inline scripts are needed for SSR hydration data and the theme script, so script-src
// allows them; the policy still blocks third-party scripts, framing, and sending data
// anywhere except this site and Supabase.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    return withSecurityHeaders(await route(request, env, ctx));
  },
};

async function route(request: Request, env: unknown, ctx: unknown): Promise<Response> {
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
  if (url.pathname === "/api/scholarship/apply" && request.method === "POST") {
    return handleScholarshipApply(request);
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
          headers: {
            ...Object.fromEntries(final.headers.entries()),
            "Cache-Control": cacheHeader,
          },
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
}
