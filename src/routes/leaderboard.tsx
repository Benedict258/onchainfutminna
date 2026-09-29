import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Crown, BookOpen, Code, Users, Calendar, ArrowRight } from "lucide-react";
import { getLeaderboard } from "@/lib/api/leaderboard.server";
import { getBadgeConfig } from "@/lib/badges";

type TimeFilter = "all" | "month" | "week";

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

function PodiumCard({
  entry,
  rank,
}: {
  entry: {
    rank: number;
    user: {
      profile: {
        fullName: string;
        nickname: string | null;
        avatarUrl: string | null;
        department: string | null;
      } | null;
    };
    totalPoints: number;
    user_badges: {
      badges: { name: string; label: string; color: string; bg_color: string } | null;
    }[];
  };
  rank: number;
}) {
  const profile = entry.user.profile;
  const name = profile?.nickname || profile?.fullName || "Anonymous";
  const initials = name
    .split(" ")
    .map((p: string) => p[0])
    .join("");

  const borderColor =
    rank === 1
      ? "border-primary"
      : rank === 2
        ? "border-muted-foreground/30"
        : "border-amber-700/30";
  const Icon = rank === 1 ? Crown : Medal;
  const iconColor =
    rank === 1 ? "text-primary" : rank === 2 ? "text-muted-foreground" : "text-amber-600";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Avatar
          className={`${rank === 1 ? "h-20 w-20 ring-2 ring-primary ring-offset-2 ring-offset-background" : "h-16 w-16"}`}
        >
          <AvatarImage src={profile?.avatarUrl || undefined} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <span
          className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-xs font-bold ${
            rank === 1
              ? "bg-primary text-primary-foreground"
              : rank === 2
                ? "bg-muted-foreground text-background"
                : "bg-amber-700 text-white"
          }`}
        >
          {rank}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground text-center">{name}</p>
      {profile?.department && <p className="text-xs text-muted-foreground">{profile.department}</p>}
      <p className="mt-1 text-headline-sm text-primary">{entry.totalPoints.toLocaleString()}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
      <div
        className={`mt-3 flex items-center gap-1 rounded-full border px-3 py-1 ${borderColor} ${
          rank === 1 ? "bg-primary/5" : "bg-surface-low"
        }`}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      {
        title: "Club Rankings  Leaderboard | BlockchainClub FUTMinna",
      },
      {
        name: "description",
        content:
          "Top contributors and builders of Blockchain Club FUTMinna. On-chain proof of excellence.",
      },
      {
        property: "og:title",
        content: "Club Rankings  BlockchainClub FUTMinna Leaderboard",
      },
      {
        property: "og:description",
        content: "Celebrating the top contributors and builders of the club.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const fetchLeaderboard = useServerFn(getLeaderboard);

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", timeFilter],
    queryFn: () =>
      fetchLeaderboard({
        data: {
          limit: 50,
        },
      }),
  });

  const entries = data ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            LEADERBOARD
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Top Builders &<br />
            <span className="text-primary">Contributors</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Celebrating the most active and impactful members of the BlockchainClub FUTMinna community. Points are
            earned through events, learning, building, and community engagement.
          </p>
        </div>
      </section>

      {/* PODIUM */}
      {top3.length >= 3 && (
        <section className="border-b border-border bg-surface-low">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
            <div className="flex items-end justify-center gap-4 sm:gap-8 md:gap-16">
              <PodiumCard entry={top3[1]} rank={2} />
              <PodiumCard entry={top3[0]} rank={1} />
              <PodiumCard entry={top3[2]} rank={3} />
            </div>
          </div>
        </section>
      )}

      {/* FILTERS */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4">
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <TabsList className="bg-background/50">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* TABLE */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg text-muted-foreground">No leaderboard entries yet.</p>
            <p className="mt-2 text-sm text-muted-foreground/60">
              Start contributing to earn points!
            </p>
          </div>
        ) : (
          <>
            {/* TABLE HEADER */}
            <div className="hidden md:grid md:grid-cols-[48px_1fr_120px_120px] gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
              <span>Rank</span>
              <span>Builder</span>
              <span className="text-right">Points</span>
              <span className="text-right">Badges</span>
            </div>

            {/* ENTRIES */}
            <div className="divide-y divide-border">
              {(top3.length >= 3 ? rest : entries).map((entry) => {
                const profile = entry.user.profile;
                const name = profile?.nickname || profile?.fullName || "Anonymous";
                const initials = name
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("");

                return (
                  <div
                    key={entry.rank}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[48px_1fr_120px_120px] gap-4 items-center px-4 py-3 hover:bg-surface-low/50 transition-colors"
                  >
                    <span className="text-sm font-mono text-muted-foreground hidden md:block">
                      #{entry.rank}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground md:hidden">
                        #{entry.rank}
                      </span>
                      <Link to="/members/$memberId" params={{ memberId: entry.user.id }}>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link to="/members/$memberId" params={{ memberId: entry.user.id }} className="hover:text-primary transition-colors">
                          <p className="text-sm font-medium text-foreground">{name}</p>
                        </Link>
                        {profile?.department && (
                          <p className="text-xs text-muted-foreground">{profile.department}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary text-right">
                      {entry.totalPoints.toLocaleString()}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {entry.user_badges?.slice(0, 2).map((ub) => {
                        const badge = ub.badges;
                        if (!badge) return null;
                        const config = getBadgeConfig(badge.name);
                        if (!config) return null;
                        const BadgeIcon = config.icon;
                        return (
                          <Badge
                            key={badge.name}
                            variant="outline"
                            className={`text-[9px] ${config.bgColor} ${config.color} border-current/20`}
                          >
                            <BadgeIcon className="mr-0.5 h-2.5 w-2.5" />
                            {config.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* POINTS LEGEND */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-12">
          <h3 className="text-headline-sm mb-6 text-center">How Points Are Earned</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Calendar,
                label: "Event Points",
                description: "Attending workshops, hackathons, and meetups.",
                color: "text-blue-400",
              },
              {
                icon: BookOpen,
                label: "Learn Points",
                description: "Completing modules, passing quizzes, and finishing tracks.",
                color: "text-emerald-400",
              },
              {
                icon: Code,
                label: "Build Points",
                description: "Submitting projects, shipping features, and code reviews.",
                color: "text-purple-400",
              },
              {
                icon: Users,
                label: "Community Points",
                description: "Mentoring peers, contributing to discussions, and helping out.",
                color: "text-amber-400",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-card p-5">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16 text-center">
        <Trophy className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-6 text-headline-lg">CLIMB THE RANKS</h2>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Earn points by attending events, completing learning tracks, shipping projects, and
          contributing to the community.
        </p>
        <a href="https://chat.whatsapp.com/IZBSVUSyxayE0nTqO71HRt" target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="mt-8 font-semibold tracking-wide">
            Join the Community <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </section>
    </div>
  );
}


