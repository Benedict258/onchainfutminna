import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";

export const getProjects = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      ecosystem: z.enum(["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"]).optional(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      featured: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { page, limit, ecosystem, status, featured } = data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const {
      data: projects,
      count,
      error,
    } = await query("projects", {
      select:
        "*, project_members(*, users(id, profiles(full_name, avatar_url))), project_tags(*, tags(id, name))",
      filters: {
        status: status || "APPROVED",
        ...(ecosystem ? { ecosystem } : {}),
        ...(featured !== undefined ? { is_featured: featured } : {}),
      },
      order: { column: "created_at", ascending: false },
      range: [from, to],
      count: "exact",
    });

    if (error) throw error;

    return {
      projects: projects || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  });

export const getProjectById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: project, error } = await query("projects", {
      select:
        "*, project_members(*, users(id, email, profiles(full_name, avatar_url, department, level))), project_tags(*, tags(id, name))",
      filters: { id: data.id },
      single: true,
    });

    if (error) throw error;
    if (!project) throw new Error("Project not found");

    return project;
  });

export const submitProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      headline: z.string().optional(),
      teamName: z.string().optional(),
      coverImage: z.string().url().optional(),
      logoUrl: z.string().url().optional(),
      bannerUrl: z.string().url().optional(),
      githubUrl: z.string().url().optional(),
      demoUrl: z.string().url().optional(),
      xLink: z.string().url().optional(),
      ecosystem: z
        .enum(["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"])
        .default("GENERAL"),
      hackathonId: z.string().uuid().optional(),
      tagIds: z.array(z.string().uuid()).optional(),
      memberIds: z.array(z.string().uuid()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { accessToken, tagIds, memberIds, ...projectData } = data;

    const { data: insertedProjects, error: projectError } = await supabase.from("projects").insert({
      name: projectData.name,
      description: projectData.description,
      headline: projectData.headline,
      team_name: projectData.teamName,
      cover_image: projectData.coverImage || projectData.logoUrl,
      logo_url: projectData.logoUrl || projectData.coverImage,
      banner_url: projectData.bannerUrl,
      github_url: projectData.githubUrl,
      demo_url: projectData.demoUrl,
      x_link: projectData.xLink,
      ecosystem: projectData.ecosystem,
      hackathon_id: projectData.hackathonId,
    });

    if (projectError) throw projectError;

    const project = insertedProjects?.[0];

    if (tagIds && tagIds.length > 0) {
      const { error } = await supabase
        .from("project_tags")
        .insert(tagIds.map((tagId) => ({ project_id: project.id, tag_id: tagId })));
      if (error) throw error;
    }

    if (memberIds && memberIds.length > 0) {
      const { error } = await supabase
        .from("project_members")
        .insert(
          memberIds.map((userId) => ({ project_id: project.id, user_id: userId, role: "Member" })),
        );
      if (error) throw error;
    }

    const { data: fullProject } = await query("projects", {
      select:
        "*, project_members(*, users(id, profiles(full_name, avatar_url))), project_tags(*, tags(id, name))",
      filters: { id: project.id },
      single: true,
    });

    return fullProject;
  });

export const approveProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const { data: updatedProjects, error } = await supabase
      .from("projects")
      .update({ status: "APPROVED" }, { id: data.id });

    if (error) throw error;

    return updatedProjects?.[0];
  });

export const rejectProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const { data: updatedProjects, error } = await supabase
      .from("projects")
      .update({ status: "REJECTED" }, { id: data.id });

    if (error) throw error;

    return updatedProjects?.[0];
  });

export const featureProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      isFeatured: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const { data: updatedProjects, error } = await supabase
      .from("projects")
      .update({ is_featured: data.isFeatured }, { id: data.id });

    if (error) throw error;

    return updatedProjects?.[0];
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("projects").delete({ id: data.id });

    if (error) throw error;

    return { success: true };
  });
