import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api/guard.server";

export const getPartners = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      category: z.enum(["ECOSYSTEM", "COMMUNITY", "SPONSOR"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const filters: Record<string, any> = { is_active: true };
    if (data.category) filters.category = data.category;

    const { data: partners, error } = await query("partners", {
      select: "*",
      filters,
      order: { column: "order", ascending: true },
    });

    if (error) throw error;

    return partners || [];
  });

export const createPartner = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      name: z.string().min(1),
      logoUrl: z.string().url().optional(),
      website: z.string().url().optional(),
      description: z.string().optional(),
      category: z.enum(["ECOSYSTEM", "COMMUNITY", "SPONSOR"]).default("COMMUNITY"),
      order: z.number().default(0),
      isActive: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, ...partnerData } = data;

    const { data: inserted, error } = await supabase.from("partners").insert({
      name: partnerData.name,
      logo_url: partnerData.logoUrl,
      website: partnerData.website,
      description: partnerData.description,
      category: partnerData.category,
      order: partnerData.order,
      is_active: partnerData.isActive,
    });

    if (error) throw error;

    return inserted[0];
  });

export const updatePartner = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      logoUrl: z.string().url().optional(),
      website: z.string().url().optional(),
      description: z.string().optional(),
      category: z.enum(["ECOSYSTEM", "COMMUNITY", "SPONSOR"]).optional(),
      order: z.number().optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, id, ...updateData } = data;

    const processed: Record<string, unknown> = {};
    if (updateData.name !== undefined) processed.name = updateData.name;
    if (updateData.logoUrl !== undefined) processed.logo_url = updateData.logoUrl;
    if (updateData.website !== undefined) processed.website = updateData.website;
    if (updateData.description !== undefined) processed.description = updateData.description;
    if (updateData.category !== undefined) processed.category = updateData.category;
    if (updateData.order !== undefined) processed.order = updateData.order;
    if (updateData.isActive !== undefined) processed.is_active = updateData.isActive;

    const { data: updated, error } = await supabase.from("partners").update(processed, { id });

    if (error) throw error;

    return updated[0];
  });

export const deletePartner = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { error } = await supabase.from("partners").delete({ id: data.id });

    if (error) throw error;

    return { success: true };
  });
