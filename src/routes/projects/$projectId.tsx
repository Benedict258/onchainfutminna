import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Globe,
  Twitter,
  Users,
  Star,
  Layers,
} from "lucide-react";
import { getProjectById } from "@/lib/api/projects.server";
import { useAuthStore } from "@/stores/auth-store";
import { Edit3 } from "lucide-react";

const ECOSYSTEM_LABELS: Record<string, string> = {
  EVM: "EVM",
  SUI_MOVE: "Sui",
  APTOS_MOVE: "Aptos",
  SOLANA_RUST: "Solana",
  GENERAL: "General",
};

const ECOSYSTEM_COLORS: Record<string, string> = {
  EVM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SUI_MOVE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  APTOS_MOVE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SOLANA_RUST: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  GENERAL: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Details | BlockchainClub FUTMinna" },
      {
        name: "description",
        content: "Project details from Blockchain Club FUTMinna.",
      },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="aspect-[2/1] w-full rounded-xl" />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function ProjectDetailPage() {
  const params = Route.useParams();
  const projectId = params.projectId;
  const fetchProject = useServerFn(getProjectById);
  const { user } = useAuthStore();

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject({ data: { id: projectId } }),
  });

  const isOwner = !!(user?.id && project?.submitted_by === user.id);

  if (isLoading) return <ProjectSkeleton />;

  if (error || !project) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  const members = project.project_members ?? [];
  const tags = project.project_tags ?? [];
  const bannerImage = project.banner_url || project.cover_image;
  const membersCount = members.length;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Button asChild variant="ghost" className="mb-6 -ml-2">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>

        {bannerImage && (
          <div className="aspect-[4/1] w-full rounded-xl overflow-hidden mb-8">
            <img
              src={bannerImage}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge
            variant="outline"
            className={
              ECOSYSTEM_COLORS[project.ecosystem] || ECOSYSTEM_COLORS.GENERAL
            }
          >
            {ECOSYSTEM_LABELS[project.ecosystem] || project.ecosystem}
          </Badge>
          {project.is_featured && (
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20"
            >
              <Star className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>


        <div className="flex items-start gap-5 mb-6">
          {project.logo_url && (
            <Avatar className="h-16 w-16 rounded-xl border-2 border-border shrink-0">
              <AvatarImage src={project.logoUrl} />
              <AvatarFallback className="text-xl rounded-xl">
                {project.name
                  ?.split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2) || "P"}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="text-headline-xl md:text-display-md tracking-tight">
              {project.name}
              {isOwner && (
                <Button variant="outline" size="sm" className="ml-3 -mt-1 align-middle" asChild>
                  <Link to="/projects/submit">
                    <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                  </Link>
                </Button>
              )}
            </h1>
            {project.headline && (
              <p className="mt-2 text-body-lg text-muted-foreground">
                {project.headline}
              </p>
            )}
            {project.team_name && (
              <p className="mt-1 text-sm text-muted-foreground/70">
                by {project.team_name}
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="md:col-span-2 border-border bg-card">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-headline-sm mb-3">About This Project</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.description || "No description available."}
                </p>
              </div>

              {tags.length > 0 && (
                <div>
                  <h2 className="text-headline-sm mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(
                      (t: { tag: { id: string; name: string } }) => (
                        <Badge
                          key={t.tag.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {t.tag.name}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-headline-sm">Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium">{membersCount}</p>
                      <p className="text-muted-foreground">
                        {membersCount === 1 ? "Team Member" : "Team Members"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium">
                        {ECOSYSTEM_LABELS[project.ecosystem] || project.ecosystem}
                      </p>
                      <p className="text-muted-foreground">Ecosystem</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="text-headline-sm mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Links
                </h3>
                <div className="space-y-3">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {(project.demo_url || project.website_url) && (
                    <a
                      href={project.demo_url || project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {project.x_link && (
                    <a
                      href={project.x_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      X / Twitter
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {!project.github_url &&
                    !project.demo_url &&
                    !project.website_url &&
                    !project.x_link && (
                      <p className="text-sm text-muted-foreground/60">
                        No links added yet.
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {members.length > 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h2 className="text-headline-sm mb-5 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map(
                  (m: {
                    user: {
                      id: string;
                      email?: string;
                      profile?: {
                        fullName: string;
                        avatarUrl: string | null;
                        department: string | null;
                        level: string | null;
                      };
                    };
                  }) => (
                    <Link
                      key={m.user.id}
                      to="/members/$memberId"
                      params={{ memberId: m.user.id }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-surface-low transition-all"
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={m.user.profile?.avatarUrl || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {m.user.profile?.fullName
                            ?.split(" ")
                            .map((p: string) => p[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.user.profile?.fullName || m.user.email || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.user.profile?.department ||
                            m.user.profile?.level ||
                            "Member"}
                        </p>
                      </div>
                    </Link>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


