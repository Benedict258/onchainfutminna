// Client-side replacement for all createServerFn calls
// Uses generic /api/supabase/ REST endpoints in server.ts
// to bypass Seroval serialization issues

function getAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem("bcf-token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

export async function apiQuery(table: string, opts: Record<string, any> = {}) {
  const res = await fetch(`/api/supabase/query/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(opts),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Query failed");
  return json; // { data, error, count }
}

export async function apiQueryAll(table: string, opts: Record<string, any> = {}) {
  const { data } = await apiQuery(table, opts);
  return data || [];
}

export async function apiQuerySingle(table: string, opts: Record<string, any> = {}) {
  const { data } = await apiQuery(table, { ...opts, single: true });
  return data || null;
}

export async function apiInsert(table: string, rows: any) {
  const res = await fetch(`/api/supabase/insert/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(rows),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Insert failed");
  return json; // { data, error }
}

export async function apiUpdate(table: string, data: any, filters: Record<string, any>) {
  const res = await fetch(`/api/supabase/update/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ data, filters }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Update failed");
  return json; // { data, error }
}

export async function apiDelete(table: string, filters: Record<string, any>) {
  const res = await fetch(`/api/supabase/delete/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ filters }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Delete failed");
  return json; // { error }
}

export async function apiRpc(fn: string, params: Record<string, any> = {}) {
  const res = await fetch(`/api/supabase/rpc/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ params }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "RPC failed");
  return json; // { data, error }
}

export async function apiAnalytics() {
  const res = await fetch("/api/supabase/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: "{}",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Analytics failed");
  return json;
}

export async function apiGetSettings() {
  return apiQueryAll("site_settings");
}

export async function apiUpsertSettings(settings: { key: string; value: string }[]) {
  const res = await fetch("/api/supabase/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ settings }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Settings failed");
  return json;
}

export async function apiAdjustPoints(body: Record<string, any>) {
  const res = await fetch("/api/supabase/adjust-points", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Adjust points failed");
  return json;
}

export async function apiAward(action: string, targetId: string) {
  const res = await fetch("/api/awards", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ action, targetId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Award failed");
  return json;
}

export async function apiMarkAttendance(eventId: string, userId: string, attended: boolean) {
  const res = await fetch("/api/events/attend", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ eventId, userId, attended }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Attendance update failed");
  return json;
}

export async function apiCompleteModule(moduleId: string, points?: number) {
  const res = await fetch("/api/supabase/learn-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ moduleId, points }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.error || "Complete module failed");
  return json;
}

export async function apiSubmitQuiz(
  quizId: string,
  answers: { questionId: string; optionId: string }[],
) {
  const token = localStorage.getItem("bcf-token");
  const res = await fetch("/api/learn/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ quizId, answers }),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error || "Quiz submission failed"), json);
  return json;
}

export async function apiLogCommunityActivity(
  activityType: string,
  description: string,
  points: number,
) {
  const res = await fetch("/api/supabase/community-log", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ activityType, description, points }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Community activity log failed");
  return json;
}

export async function apiGetWhatsAppStats() {
  const res = await fetch("/api/whatsapp/stats", {
    method: "GET",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "WhatsApp stats failed");
  return json;
}

export async function apiLogout(refreshToken: string) {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return res.json();
}

export async function apiChallengeVote(challengeId: string, participantId: string) {
  const res = await fetch("/api/challenges/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ challengeId, participantId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Vote failed");
  return json;
}
