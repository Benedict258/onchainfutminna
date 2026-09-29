import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  FileText,
  ArrowRight,
  Clock,
  Tag,
  BookOpen,
  Megaphone,
  Code,
  Newspaper,
  Users,
} from "lucide-react";
import { getBlogPosts } from "@/lib/api/blog.server";

type CategoryFilter =
  | "all"
  | "Announcement"
  | "Tutorial"
  | "Recap"
  | "Build in Public";

const CATEGORY_LABELS: Record<string, string> = {
  Announcement: "Announcements",
  Tutorial: "Tutorials",
  Recap: "Recaps",
  "Build in Public": "Build in Public",
};

const CATEGORY_COLORS: Record<string, string> = {
  Announcement: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Tutorial: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Recap: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Build in Public": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function formatDate(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BlogSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card overflow-hidden"
        >
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Resources | BlockchainClub FUTMinna" },
      {
        name: "description",
        content: "Event recaps, tutorials, and ecosystem deep-dives.",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const [category, setCategory] = useState<CategoryFilter>("all");

  const fetchPosts = useServerFn(getBlogPosts);

  const { data, isLoading } = useQuery({
    queryKey: ["blog", category],
    queryFn: () =>
      fetchPosts({
        data: {
          page: 1,
          limit: 50,
          category: category === "all" ? undefined : category,
        },
      }),
  });

  const posts = data?.posts ?? [];
  const featured = posts.filter(
    (p: { isFeatured: boolean }) => p.isFeatured
  );
  const regular = posts.filter(
    (p: { isFeatured: boolean }) => !p.isFeatured
  );

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            BLOG
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Updates &<br />
            <span className="text-primary">Insights</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Event recaps, tutorials, build logs, and ecosystem deep-dives from
            the BlockchainClub FUTMinna community.
          </p>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <Tabs
            value={category}
            onValueChange={(v) => setCategory(v as CategoryFilter)}
          >
            <TabsList className="bg-background/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Announcement">Announcements</TabsTrigger>
              <TabsTrigger value="Tutorial">Tutorials</TabsTrigger>
              <TabsTrigger value="Recap">Recaps</TabsTrigger>
              <TabsTrigger value="Build in Public">Build in Public</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* POSTS */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        {isLoading ? (
          <BlogSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg text-muted-foreground">
              No posts found.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/60">
              Check back soon for new content!
            </p>
          </div>
        ) : (
          <>
            {/* FEATURED POST */}
            {featured.length > 0 && (
              <div className="mb-10">
                <h2 className="text-headline-md mb-5">Featured Post</h2>
                {featured.slice(0, 1).map((post) => (
                  <Card
                    key={post.id}
                    className="group relative overflow-hidden border-border bg-card p-0"
                  >
                    <div className="grid md:grid-cols-[1.2fr_1fr]">
                      <div className="aspect-[16/10] md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <FileText className="h-16 w-16 text-primary/30" />
                        )}
                      </div>
                      <div className="p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          {post.category && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${CATEGORY_COLORS[post.category] || ""}`}
                            >
                              {CATEGORY_LABELS[post.category] ||
                                post.category}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            3 min read
                          </span>
                        </div>
                        <h3 className="mt-4 text-headline-lg group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-3 text-muted-foreground leading-relaxed">
                            {post.excerpt.length > 200
                              ? post.excerpt.slice(0, 200) + "..."
                              : post.excerpt}
                          </p>
                        )}
                        <div className="mt-5 flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                post.author?.profile?.avatarUrl || undefined
                              }
                            />
                            <AvatarFallback className="text-xs">
                              {post.author?.profile?.fullName
                                ?.split(" ")
                                .map((p: string) => p[0])
                                .join("") || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {post.author?.profile?.fullName || "Anonymous"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(post.publishedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="mt-5 self-start text-xs"
                        >
                          <Link to="/blog/$slug" params={{ slug: post.slug }}>
                            Read More{" "}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* POST GRID */}
            <h2 className="text-headline-md mb-5">
              {category === "all"
                ? "All Posts"
                : CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(featured.length > 0 ? regular : posts).map((post) => (
                <article
                  key={post.id}
                  className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-surface-high to-surface-low flex items-center justify-center overflow-hidden">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      {post.category && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${CATEGORY_COLORS[post.category] || ""}`}
                        >
                          {CATEGORY_LABELS[post.category] || post.category}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-headline-sm group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              post.author?.profile?.avatarUrl || undefined
                            }
                          />
                          <AvatarFallback className="text-[9px]">
                            {post.author?.profile?.fullName
                              ?.split(" ")
                              .map((p: string) => p[0])
                              .join("") || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {post.author?.profile?.fullName || "Anonymous"}
                        </span>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        <Link to="/blog/$slug" params={{ slug: post.slug }}>Read →</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* TAGS SECTION */}
            <div className="mt-16 pt-10 border-t border-border">
              <h3 className="text-headline-sm mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Solidity",
                  "Move",
                  "Rust",
                  "DeFi",
                  "NFTs",
                  "ZK Proofs",
                  "L2",
                  "DAO",
                  "Hackathon",
                  "Tutorial",
                  "Ethereum",
                  "Solana",
                ].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-headline-lg">WANT TO CONTRIBUTE?</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Share your knowledge with the community. Write a tutorial, recap an
            event, or document your build journey.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 font-semibold tracking-wide"
          >
            <Link to="/join">
              Start Writing <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}


