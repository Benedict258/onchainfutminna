import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Clock, Calendar, ExternalLink } from "lucide-react";
import { getBlogPostBySlug } from "@/lib/api/blog.server";

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

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Blog Post | BlockchainClub FUTMinna" },
      { name: "description", content: "Blog post from Blockchain Club FUTMinna." },
    ],
  }),
  component: BlogPostDetailPage,
});

function formatDate(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function BlogPostSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="aspect-[2/1] w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function BlogPostDetailPage() {
  const params = Route.useParams();
  const slug = params.slug;
  const fetchPost = useServerFn(getBlogPostBySlug);

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchPost({ data: { slug } }),
  });

  if (isLoading) return <BlogPostSkeleton />;

  if (error || !post) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Post not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  const author = post.users?.profiles;
  const tags = post.blog_post_tags?.map((bt: any) => bt.tags).filter(Boolean) || [];

  return (
    <div className="bg-background">
      <article className="mx-auto max-w-4xl px-6 py-16">
        <Button asChild variant="ghost" className="mb-6 -ml-2">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {post.category && (
            <Badge variant="outline" className={CATEGORY_COLORS[post.category] || ""}>
              {CATEGORY_LABELS[post.category] || post.category}
            </Badge>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(post.published_at)}
            </span>
          )}
        </div>

        <h1 className="text-headline-xl md:text-display-sm tracking-tight mb-6">{post.title}</h1>

        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
          <Avatar className="h-12 w-12">
            <AvatarImage src={author?.avatar_url || undefined} />
            <AvatarFallback className="text-sm">
              {author?.full_name
                ?.split(" ")
                .map((p: string) => p[0])
                .join("") || "A"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{author?.full_name || "Anonymous"}</p>
            <p className="text-sm text-muted-foreground">
              {post.published_at ? formatDate(post.published_at) : "Draft"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {Math.ceil((post.content?.length || 0) / 1000)} min read
          </div>
        </div>

        {post.cover_image && (
          <div className="aspect-[2/1] w-full rounded-xl overflow-hidden mb-10">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 font-medium">
            {post.excerpt}
          </p>
        )}

        {post.content && (
          <div className="prose prose-invert prose-lg max-w-none mb-10">
            <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
              {post.content}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-8 border-t border-border">
            {tags.map((tag: any) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-border">
          <h3 className="text-headline-sm mb-4">About the Author</h3>
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={author?.avatar_url || undefined} />
              <AvatarFallback>
                {author?.full_name
                  ?.split(" ")
                  .map((p: string) => p[0])
                  .join("") || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="font-medium text-foreground">{author?.full_name || "Anonymous"}</p>
              {author?.bio && <p className="text-sm text-muted-foreground">{author.bio}</p>}
              <div className="flex items-center gap-3">
                {author?.github_link && (
                  <a
                    href={author.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    GitHub <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {author?.x_link && (
                  <a
                    href={author.x_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    X <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
