import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase, query } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api/guard.server";

export const getBlogPosts = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      category: z.string().optional(),
      featured: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { page, limit, category, featured } = data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const filters: Record<string, any> = { status: "PUBLISHED" };
    if (category) filters.category = category;
    if (featured !== undefined) filters.is_featured = featured;

    const {
      data: posts,
      count,
      error,
    } = await query("blog_posts", {
      select:
        "id, title, slug, excerpt, cover_image, category, is_featured, published_at, created_at, author_id, users(id, profiles(full_name, avatar_url)), blog_post_tags(*, tags(id, name))",
      filters,
      order: { column: "published_at", ascending: false },
      range: [from, to],
      count: "exact",
    });

    if (error) throw error;

    return {
      posts: posts || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  });

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { data: post, error } = await query("blog_posts", {
      select:
        "*, users(id, profiles(full_name, avatar_url, bio, github_link, x_link)), blog_post_tags(*, tags(id, name))",
      filters: { slug: data.slug },
      single: true,
    });

    if (error) throw error;
    if (!post) throw new Error("Blog post not found");

    return post;
  });

export const createBlogPost = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      title: z.string().min(1),
      slug: z.string().min(1),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      coverImage: z.string().url().optional(),
      category: z.string().optional(),
      isFeatured: z.boolean().default(false),
      status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
      tagIds: z.array(z.string().uuid()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, tagIds, ...postData } = data;

    const { data: existingSlug } = await query("blog_posts", {
      select: "id",
      filters: { slug: postData.slug },
      single: true,
    });

    if (existingSlug) {
      throw new Error("Slug already exists");
    }

    const { data: inserted, error: postError } = await supabase.from("blog_posts").insert({
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      content: postData.content,
      cover_image: postData.coverImage,
      category: postData.category,
      is_featured: postData.isFeatured,
      status: postData.status,
      published_at: postData.status === "PUBLISHED" ? new Date().toISOString() : null,
    });

    if (postError) throw postError;

    const post = inserted[0];

    if (tagIds && tagIds.length > 0) {
      const { error } = await supabase
        .from("blog_post_tags")
        .insert(tagIds.map((tagId) => ({ post_id: post.id, tag_id: tagId })));
      if (error) throw error;
    }

    const { data: fullPost } = await query("blog_posts", {
      select: "*, users(id, profiles(full_name)), blog_post_tags(*, tags(id, name))",
      filters: { id: post.id },
      single: true,
    });

    return fullPost;
  });

export const updateBlogPost = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      coverImage: z.string().url().optional(),
      category: z.string().optional(),
      isFeatured: z.boolean().optional(),
      status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
      tagIds: z.array(z.string().uuid()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, id, tagIds, ...updateData } = data;

    const { data: existing } = await query("blog_posts", {
      select: "id, slug, status, published_at",
      filters: { id },
      single: true,
    });

    if (!existing) {
      throw new Error("Blog post not found");
    }

    if (updateData.slug && updateData.slug !== existing.slug) {
      const { data: slugExists } = await query("blog_posts", {
        select: "id",
        filters: { slug: updateData.slug },
        single: true,
      });

      if (slugExists) {
        throw new Error("Slug already exists");
      }
    }

    const processed: Record<string, unknown> = {};
    if (updateData.title !== undefined) processed.title = updateData.title;
    if (updateData.slug !== undefined) processed.slug = updateData.slug;
    if (updateData.excerpt !== undefined) processed.excerpt = updateData.excerpt;
    if (updateData.content !== undefined) processed.content = updateData.content;
    if (updateData.coverImage !== undefined) processed.cover_image = updateData.coverImage;
    if (updateData.category !== undefined) processed.category = updateData.category;
    if (updateData.isFeatured !== undefined) processed.is_featured = updateData.isFeatured;
    if (updateData.status !== undefined) processed.status = updateData.status;

    if (updateData.status === "PUBLISHED" && existing.status === "DRAFT") {
      processed.published_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase.from("blog_posts").update(processed, { id });

    if (error) throw error;

    const post = updated[0];

    if (tagIds !== undefined) {
      await supabase.from("blog_post_tags").delete({ post_id: id });

      if (tagIds.length > 0) {
        const { error: tagError } = await supabase
          .from("blog_post_tags")
          .insert(tagIds.map((tagId) => ({ post_id: id, tag_id: tagId })));
        if (tagError) throw tagError;
      }
    }

    return post;
  });

export const publishBlogPost = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
      publish: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { accessToken, id, publish } = data;

    const { data: existing } = await query("blog_posts", {
      select: "id, published_at",
      filters: { id },
      single: true,
    });

    if (!existing) {
      throw new Error("Blog post not found");
    }

    const { data: updated, error } = await supabase.from("blog_posts").update(
      {
        status: publish ? "PUBLISHED" : "DRAFT",
        published_at:
          publish && !existing.published_at ? new Date().toISOString() : existing.published_at,
      },
      { id },
    );

    if (error) throw error;

    return updated[0];
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      id: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.accessToken);
    const { error } = await supabase.from("blog_posts").delete({ id: data.id });

    if (error) throw error;

    return { success: true };
  });
