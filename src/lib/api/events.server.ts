import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import { requireAdmin, requireUser } from "@/lib/api/guard.server";

export const getEvents = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      filter: z.enum(["upcoming", "past", "all"]).default("all"),
      type: z.enum(["WORKSHOP", "HACKATHON", "TALK", "BOOTCAMP", "SOCIAL", "OTHER"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { page, limit, filter, type } = data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const now = new Date().toISOString();

    const filters: Record<string, any> = { is_published: true };

    if (filter === "upcoming") {
      filters.start_date = { __op: "gte", value: now };
    } else if (filter === "past") {
      filters.start_date = { __op: "lt", value: now };
    }

    if (type) {
      filters.type = type;
    }

    const {
      data: events,
      count,
      error,
    } = await query("events", {
      select: "*, event_rsvps(id, user_id), event_resources(id)",
      filters,
      order: { column: "start_date", ascending: false },
      range: [from, to],
      count: "exact",
    });

    if (error) throw error;

    return {
      events: events || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  });

export const getEventById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: event, error } = await query("events", {
      select:
        "*, event_rsvps(*, users(id, profile:profiles(full_name, avatar_url))), event_resources(*)",
      filters: { id: data.id },
      single: true,
    });

    if (error) throw error;
    if (!event) throw new Error("Event not found");

    return event;
  });

export const rsvpToEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      eventId: z.string().uuid(),
      userId: z.string().uuid(),
      accessToken: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // Only the signed-in user's own RSVP.
    if (requireUser(data.accessToken).userId !== data.userId) throw new Error("Forbidden");
    const { eventId, userId } = data;

    const { data: existing } = await query("event_rsvps", {
      select: "id",
      filters: { user_id: userId, event_id: eventId },
      single: true,
    });

    if (existing) {
      throw new Error("Already RSVPed to this event");
    }

    const { data: inserted, error } = await supabase
      .from("event_rsvps")
      .insert({ user_id: userId, event_id: eventId });

    if (error) throw error;

    return inserted?.[0];
  });

export const cancelRsvp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      eventId: z.string().uuid(),
      userId: z.string().uuid(),
      accessToken: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // Only the signed-in user's own RSVP.
    if (requireUser(data.accessToken).userId !== data.userId) throw new Error("Forbidden");
    const { eventId, userId } = data;

    const { data: existing } = await query("event_rsvps", {
      select: "id",
      filters: { user_id: userId, event_id: eventId },
      single: true,
    });

    if (!existing) {
      throw new Error("RSVP not found");
    }

    const { error } = await supabase
      .from("event_rsvps")
      .delete({ user_id: userId, event_id: eventId });

    if (error) throw error;

    return { success: true };
  });

export const createEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      type: z
        .enum(["WORKSHOP", "HACKATHON", "TALK", "BOOTCAMP", "SOCIAL", "OTHER"])
        .default("OTHER"),
      location: z.string().optional(),
      isVirtual: z.boolean().default(false),
      virtualLink: z.string().url().optional(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      coverImage: z.string().url().optional(),
      isPublished: z.boolean().default(false),
      isFeatured: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, ...eventData } = data;

    const { data: inserted, error } = await supabase.from("events").insert({
      title: eventData.title,
      description: eventData.description,
      type: eventData.type,
      location: eventData.location,
      is_virtual: eventData.isVirtual,
      virtual_link: eventData.virtualLink,
      start_date: eventData.startDate,
      end_date: eventData.endDate,
      cover_image: eventData.coverImage,
      is_published: eventData.isPublished,
      is_featured: eventData.isFeatured,
    });

    if (error) throw error;

    return inserted?.[0];
  });

export const updateEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      type: z.enum(["WORKSHOP", "HACKATHON", "TALK", "BOOTCAMP", "SOCIAL", "OTHER"]).optional(),
      location: z.string().optional(),
      isVirtual: z.boolean().optional(),
      virtualLink: z.string().url().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      coverImage: z.string().url().optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, id, ...updateData } = data;

    const processed: Record<string, unknown> = {};
    if (updateData.title !== undefined) processed.title = updateData.title;
    if (updateData.description !== undefined) processed.description = updateData.description;
    if (updateData.type !== undefined) processed.type = updateData.type;
    if (updateData.location !== undefined) processed.location = updateData.location;
    if (updateData.isVirtual !== undefined) processed.is_virtual = updateData.isVirtual;
    if (updateData.virtualLink !== undefined) processed.virtual_link = updateData.virtualLink;
    if (updateData.startDate !== undefined) processed.start_date = updateData.startDate;
    if (updateData.endDate !== undefined) processed.end_date = updateData.endDate;
    if (updateData.coverImage !== undefined) processed.cover_image = updateData.coverImage;
    if (updateData.isPublished !== undefined) processed.is_published = updateData.isPublished;
    if (updateData.isFeatured !== undefined) processed.is_featured = updateData.isFeatured;

    const { data: updatedRows, error } = await supabase.from("events").update(processed, { id });

    if (error) throw error;

    return updatedRows?.[0];
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { error } = await supabase.from("events").delete({ id: data.id });

    if (error) throw error;

    return { success: true };
  });

export const markAttendance = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      eventId: z.string().uuid(),
      userId: z.string().uuid(),
      attended: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, eventId, userId, attended } = data;

    const { data: updatedRows, error } = await supabase
      .from("event_rsvps")
      .update({ attended }, { event_id: eventId, user_id: userId });

    if (error) throw error;

    return updatedRows?.[0];
  });

export const markAttendanceAndAward = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      eventId: z.string().uuid(),
      userId: z.string().uuid(),
      attended: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, eventId, userId, attended } = data;

    const { data: updatedRows, error } = await supabase
      .from("event_rsvps")
      .update({ attended }, { event_id: eventId, user_id: userId });

    if (error) throw error;

    if (attended) {
      const { awardEventPoints } = await import("@/lib/auto-awards");
      await awardEventPoints(eventId);
    }

    return updatedRows?.[0];
  });

export const addEventResource = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      eventId: z.string().uuid(),
      title: z.string().min(1),
      url: z.string().url(),
      type: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, eventId, ...resourceData } = data;

    const { data: inserted, error } = await supabase.from("event_resources").insert({
      event_id: eventId,
      title: resourceData.title,
      url: resourceData.url,
      type: resourceData.type,
    });

    if (error) throw error;

    return inserted?.[0];
  });
