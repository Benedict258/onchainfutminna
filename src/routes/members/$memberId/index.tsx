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
  Twitter,
  ExternalLink,
  Award,
  BookOpen,
  Briefcase,
  Notebook,
} from "lucide-react";
import { getMemberById } from "@/lib/api/members.server";

const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LEVEL_LABELS: Record<string, string> = {
  L100: "Level 100",
  L200: "Level 200",
  L300: "Level 300",
  L400: "Level 400",
  L500: "Level 500",
  L600: "Level 600",
};

export const Route = createFileRoute("/members/$memberId/")({
  head: () => ({
    meta: [
      { title: "Member Profile | BlockchainClub FUTMinna" },
      { name: "description", content: "Member profile on Blockchain Club FUTMinna." },
    ],
  }),
  component: MemberProfilePage,
});

function MemberSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

function MemberProfilePage() {
  const params = Route.useParams();
  const memberId = params.memberId;
  const fetchMember = useServerFn(getMemberById);

  const {
    data: member,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["member", memberId],
    queryFn: () => fetchMember({ data: { id: memberId } }),
  });

  if (isLoading) return <MemberSkeleton />;

  if (error || !member) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Member not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/leaderboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leaderboard
          </Link>
        </Button>
      </div>
    );
  }

  const skills = member.profile_skills?.map((ps: any) => ps.skills?.name).filter(Boolean) || [];
  const leaderboard = member.leaderboard_entries;
  const totalPoints = leaderboard?.total_points || 0;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Button asChild variant="ghost" className="mb-6 -ml-2">
          <Link to="/leaderboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leaderboard
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {member.full_name
                ?.split(" ")
                .map((p: string) => p[0])
                .join("") || "M"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-headline-xl tracking-tight">{member.full_name}</h1>
            {member.nickname && <p className="text-muted-foreground">"{member.nickname}"</p>}
            <div className="flex flex-wrap items-center gap-3">
              {member.department && (
                <Badge variant="secondary" className="text-xs">
                  {member.department}
                </Badge>
              )}
              {member.level && (
                <Badge variant="secondary" className="text-xs">
                  {LEVEL_LABELS[member.level] || member.level}
                </Badge>
              )}
              {member.experience_level && (
                <Badge variant="secondary" className="text-xs">
                  {EXPERIENCE_LABELS[member.experience_level] || member.experience_level}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {member.bio && (
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-headline-sm mb-2">About</h2>
              <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
            </CardContent>
          </Card>
        )}

        {member.fun_fact && (
          <Card className="border-border bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-headline-sm mb-2">Fun Fact</h2>
              <p className="text-muted-foreground">{member.fun_fact}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {skills.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h2 className="text-headline-sm mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {totalPoints > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h2 className="text-headline-sm mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Points
                </h2>
                <p className="text-3xl font-bold text-primary">{totalPoints}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Points</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="border-border bg-card mb-6">
          <CardContent className="p-6">
            <h2 className="text-headline-sm mb-3 flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              Links
            </h2>
            <div className="space-y-3">
              {member.github_link && (
                <a
                  href={member.github_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {member.x_link && (
                <a
                  href={member.x_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  X / Twitter
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {member.portfolio_link && (
                <a
                  href={member.portfolio_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Portfolio
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {!member.github_link && !member.x_link && !member.portfolio_link && (
                <p className="text-sm text-muted-foreground/60">No links added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h2 className="text-headline-sm mb-3 flex items-center gap-2">
              <Notebook className="h-4 w-4 text-primary" />
              DEVLOG
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              View this member's weekly development log.
            </p>
            <Button asChild variant="outline">
              <Link to="/members/$memberId/devlog" params={{ memberId }}>
                View DEVLOG
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
