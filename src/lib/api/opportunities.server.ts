import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api/guard.server";

export const getOpportunities = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      type: z
        .enum(["HACKATHON", "GRANT", "BOUNTY", "JOB", "INTERNSHIP", "PROGRAM", "AMBASSADOR"])
        .optional(),
      status: z.enum(["OPEN", "CLOSING_SOON", "CLOSED"]).optional(),
      ecosystem: z.enum(["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { page, limit, type, status, ecosystem } = data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const filters: Record<string, any> = { is_published: true };
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (ecosystem) filters.ecosystem = ecosystem;

    const {
      data: opportunities,
      count,
      error,
    } = await query("opportunities", {
      select: "*",
      filters,
      order: { column: "deadline", ascending: true },
      range: [from, to],
      count: "exact",
    });

    if (error) throw error;

    return {
      opportunities: opportunities || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  });

export const getOpportunityById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: opportunity, error } = await query("opportunities", {
      select: "*",
      filters: { id: data.id },
      single: true,
    });

    if (error) throw error;
    if (!opportunity) throw new Error("Opportunity not found");

    return opportunity;
  });

export const createOpportunity = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      title: z.string().min(1),
      organizer: z.string().optional(),
      type: z
        .enum(["HACKATHON", "GRANT", "BOUNTY", "JOB", "INTERNSHIP", "PROGRAM", "AMBASSADOR"])
        .default("HACKATHON"),
      ecosystem: z
        .enum(["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"])
        .default("GENERAL"),
      description: z.string().optional(),
      prize: z.string().optional(),
      imageUrl: z.string().optional(),
      applyUrl: z.string().url().optional(),
      deadline: z.string().datetime().optional(),
      status: z.enum(["OPEN", "CLOSING_SOON", "CLOSED"]).default("OPEN"),
      isPublished: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, ...opportunityData } = data;

    const processed: Record<string, unknown> = {
      title: opportunityData.title,
      organizer: opportunityData.organizer,
      type: opportunityData.type,
      ecosystem: opportunityData.ecosystem,
      description: opportunityData.description,
      prize: opportunityData.prize,
      image_url: opportunityData.imageUrl,
      apply_url: opportunityData.applyUrl,
      deadline: opportunityData.deadline,
      status: opportunityData.status,
      is_published: opportunityData.isPublished,
    };

    const { data: inserted, error } = await supabase.from("opportunities").insert(processed);

    if (error) throw error;

    return inserted[0];
  });

export const updateOpportunity = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      organizer: z.string().optional(),
      type: z
        .enum(["HACKATHON", "GRANT", "BOUNTY", "JOB", "INTERNSHIP", "PROGRAM", "AMBASSADOR"])
        .optional(),
      ecosystem: z.enum(["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"]).optional(),
      description: z.string().optional(),
      prize: z.string().optional(),
      imageUrl: z.string().optional(),
      applyUrl: z.string().url().optional(),
      deadline: z.string().datetime().optional(),
      status: z.enum(["OPEN", "CLOSING_SOON", "CLOSED"]).optional(),
      isPublished: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, id, ...updateData } = data;

    const processed: Record<string, unknown> = {};
    if (updateData.title !== undefined) processed.title = updateData.title;
    if (updateData.organizer !== undefined) processed.organizer = updateData.organizer;
    if (updateData.type !== undefined) processed.type = updateData.type;
    if (updateData.ecosystem !== undefined) processed.ecosystem = updateData.ecosystem;
    if (updateData.description !== undefined) processed.description = updateData.description;
    if (updateData.prize !== undefined) processed.prize = updateData.prize;
    if (updateData.imageUrl !== undefined) processed.image_url = updateData.imageUrl;
    if (updateData.applyUrl !== undefined) processed.apply_url = updateData.applyUrl;
    if (updateData.deadline !== undefined) processed.deadline = updateData.deadline;
    if (updateData.status !== undefined) processed.status = updateData.status;
    if (updateData.isPublished !== undefined) processed.is_published = updateData.isPublished;

    const { data: updated, error } = await supabase.from("opportunities").update(processed, { id });

    if (error) throw error;

    return updated[0];
  });

export const deleteOpportunity = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { error } = await supabase.from("opportunities").delete({ id: data.id });

    if (error) throw error;

    return { success: true };
  });
