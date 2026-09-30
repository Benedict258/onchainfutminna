import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth";

// Applications hold applicant PII and are not readable with the anon key,
// so admin access goes through the service role, gated by our own JWT.
const TABLE = "rust_scholarship_applications";
const STATUSES = ["pending", "shortlisted", "selected", "waitlisted", "rejected"] as const;

function requireAdmin(accessToken: string) {
  const decoded = verifyAccessToken(accessToken);
  if (!decoded || (decoded.role !== "ADMIN" && decoded.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  return decoded;
}

async function serviceFetch(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.message || `Supabase request failed (${res.status})`);
  return json;
}

export const listScholarshipApplications = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    return (await serviceFetch(
      `${TABLE}?select=*&order=total_score.desc.nullslast,created_at.asc`,
    )) as Record<string, any>[];
  });

const score = z.number().int().min(0).max(5).nullable().optional();

export const updateScholarshipApplication = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      patch: z
        .object({
          status: z.enum(STATUSES).optional(),
          score_commitment: score,
          score_motivation: score,
          score_evidence: score,
          score_community: score,
          score_potential: score,
          score_giveback: score,
          reviewer_notes: z.string().max(2000).nullable().optional(),
        })
        .strict(),
    }),
  )
  .handler(async ({ data }) => {
    const admin = requireAdmin(data.accessToken);
    await serviceFetch(`${TABLE}?id=eq.${data.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        ...data.patch,
        reviewed_by: admin.userId,
        reviewed_at: new Date().toISOString(),
      }),
    });
    return { ok: true };
  });
