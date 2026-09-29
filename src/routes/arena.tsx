import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiQueryAll, apiQuery, apiInsert } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import {
  Swords,
  Clock,
  Users,
  Coins,
  Trophy,
  Eye,
  ArrowRight,
  Timer,
  Zap,
  Palette,
  FileText,
  Search,
  Code,
  Flag,
  Plus,
  Crown,
} from "lucide-react"

type ChallengeFilter = "all" | "live" | "upcoming" | "past"
type ChallengeTypeFilter =
  | "all"
  | "CODE_DUEL"
  | "TEAM_CLASH"
  | "OPEN"
  | "CTF"
  | "DESIGN"
  | "CONTENT"
  | "RESEARCH"
  | "SPEED"

const TYPE_LABELS: Record<string, string> = {
  CODE_DUEL: "Code Duel",
  TEAM_CLASH: "Team Clash",
  OPEN: "Open",
  CTF: "CTF",
  DESIGN: "Design",
  CONTENT: "Content",
  RESEARCH: "Research",
  SPEED: "Speed Sprint",
}

const TYPE_COLORS: Record<string, string> = {
  CODE_DUEL: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  TEAM_CLASH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  OPEN: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CTF: "bg-red-500/10 text-red-400 border-red-500/20",
  DESIGN: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  CONTENT: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  RESEARCH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SPEED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  CODE_DUEL: <Code className="h-3.5 w-3.5" />,
  TEAM_CLASH: <Users className="h-3.5 w-3.5" />,
  OPEN: <Zap className="h-3.5 w-3.5" />,
  CTF: <Flag className="h-3.5 w-3.5" />,
  DESIGN: <Palette className="h-3.5 w-3.5" />,
  CONTENT: <FileText className="h-3.5 w-3.5" />,
  RESEARCH: <Search className="h-3.5 w-3.5" />,
  SPEED: <Timer className="h-3.5 w-3.5" />,
}

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      {
        title: "Challenge Arena | BlockchainClub FUTMinna",
      },
      {
        name: "description",
        content:
          "Compete in code duels, CTF challenges, design battles, and more. Stake points and climb the leaderboard.",
      },
    ],
  }),
  component: ArenaPage,
})

function formatCountdown(seconds: number) {
  if (seconds <= 0) return "Ended"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function useCountdown(targetTime: string | null) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!targetTime) return { seconds: 0, isExpired: true }
  const diff = Math.max(0, Math.floor((new Date(targetTime).getTime() - now) / 1000))
  return { seconds: diff, isExpired: diff <= 0 }
}

function getChallengeStatus(challenge: Record<string, any>) {
  const now = new Date()
  const start = new Date(challenge.start_time)
  const end = new Date(challenge.end_time)
  if (now < start) return "upcoming"
  if (now >= start && now <= end) return "live"
  return "past"
}

function ArenaSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card overflow-hidden"
        >
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ArenaPage() {
  const [statusFilter, setStatusFilter] = useState<ChallengeFilter>("all")
  const [typeFilter, setTypeFilter] = useState<ChallengeTypeFilter>("all")
  const { user } = useAuthStore()

  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["arena-challenges"],
    queryFn: () =>
      apiQueryAll("challenges", {
        select: "*, challenge_participants(id, user_id), creator:profiles!challenges_creator_id_fkey(full_name, avatar_url)",
        order: { column: "start_time", ascending: true },
      }),
    refetchInterval: 15000,
  })

  const { data: leaderboard } = useQuery({
    queryKey: ["arena-leaderboard"],
    queryFn: () =>
      apiQueryAll("leaderboard_entries", {
        select: "*, profiles(full_name, avatar_url)",
        order: { column: "total_points", ascending: false },
        limit: 10,
      }),
  })

  const allChallenges: any[] = challenges || []

  const now = new Date()
  const liveChallenges = allChallenges.filter(
    (c) => new Date(c.start_time) <= now && now <= new Date(c.end_time)
  )
  const upcomingChallenges = allChallenges.filter(
    (c) => new Date(c.start_time) > now
  )
  const pastChallenges = allChallenges.filter(
    (c) => new Date(c.end_time) < now
  )

  const filteredChallenges = (() => {
    let list: any[] = []
    if (statusFilter === "live") list = liveChallenges
    else if (statusFilter === "upcoming") list = upcomingChallenges
    else if (statusFilter === "past") list = pastChallenges
    else list = allChallenges

    if (typeFilter !== "all") {
      list = list.filter((c) => c.type === typeFilter)
    }
    return list
  })()

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            <Swords className="h-3.5 w-3.5" />
            CHALLENGE ARENA
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Prove Your Skills,<br />
            <span className="text-primary">Earn Glory</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Stake points, compete in challenges, and climb the leaderboard. Win
            duels, crush CTFs, and earn community recognition.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="font-semibold">
              <Link to="/arena/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Challenge
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/leaderboard">
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center gap-8 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">Live now:</span>
            <span className="font-semibold">{liveChallenges.length}</span>
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Upcoming:</span>
            <span className="font-semibold">{upcomingChallenges.length}</span>
          </span>
          <span className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Total challenges:</span>
            <span className="font-semibold">{allChallenges.length}</span>
          </span>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAIN CONTENT */}
          <div className="flex-1 min-w-0">
            {/* FILTER TABS - Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ChallengeFilter)}
              >
                <TabsList className="bg-background/50">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="live">Live Now</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* FILTER TABS - Type */}
            <div className="mb-8">
              <Tabs
                value={typeFilter}
                onValueChange={(v) =>
                  setTypeFilter(v as ChallengeTypeFilter)
                }
              >
                <TabsList className="bg-background/50 flex-wrap h-auto gap-1 p-1">
                  {(
                    [
                      "all",
                      "CODE_DUEL",
                      "TEAM_CLASH",
                      "OPEN",
                      "CTF",
                      "DESIGN",
                      "CONTENT",
                      "RESEARCH",
                      "SPEED",
                    ] as ChallengeTypeFilter[]
                  ).map((t) => (
                    <TabsTrigger key={t} value={t} className="text-xs">
                      {t !== "all" && TYPE_ICONS[t]}
                      <span className={t !== "all" ? "ml-1.5" : ""}>
                        {t === "all" ? "All" : TYPE_LABELS[t]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* LIVE NOW SECTION */}
            {liveChallenges.length > 0 &&
              (statusFilter === "all" || statusFilter === "live") && (
                <div className="mb-10">
                  <h2 className="text-headline-md mb-5 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Now
                  </h2>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {liveChallenges
                      .filter((c) =>
                        typeFilter === "all" ? true : c.type === typeFilter
                      )
                      .slice(0, 3)
                      .map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                        />
                      ))}
                  </div>
                </div>
              )}

            {/* UPCOMING SECTION */}
            {upcomingChallenges.length > 0 &&
              (statusFilter === "all" || statusFilter === "upcoming") && (
                <div className="mb-10">
                  <h2 className="text-headline-md mb-5">
                    {statusFilter === "all"
                      ? "Upcoming"
                      : "Upcoming Challenges"}
                  </h2>
                </div>
              )}

            {/* CHALLENGES GRID */}
            {challengesLoading ? (
              <ArenaSkeleton />
            ) : filteredChallenges.length === 0 ? (
              <div className="text-center py-16">
                <Swords className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg text-muted-foreground">
                  No challenges found.
                </p>
                <p className="mt-2 text-sm text-muted-foreground/60">
                  Create one or check back soon!
                </p>
                <Button asChild className="mt-6">
                  <Link to="/arena/create">Create Challenge</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                  />
                ))}
              </div>
            )}
          </div>

          {/* LEADERBOARD SIDEBAR */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-24">
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h3 className="text-headline-sm mb-4 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Top Duelists
                  </h3>
                  <div className="space-y-3">
                    {leaderboard && leaderboard.length > 0 ? (
                      leaderboard.map((entry: any, i: number) => {
                        const profile = entry.profiles
                        const initials = profile?.full_name
                          ? profile.full_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)
                          : "?"
                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-3"
                          >
                            <span
                              className={`w-6 text-center text-xs font-bold ${
                                i === 0
                                  ? "text-amber-400"
                                  : i === 1
                                    ? "text-slate-300"
                                    : i === 2
                                      ? "text-orange-400"
                                      : "text-muted-foreground"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={profile?.avatar_url}
                              />
                              <AvatarFallback className="text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {profile?.full_name || "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.total_points?.toLocaleString() || 0} pts
                              </p>
                            </div>
                            {i < 3 && (
                              <Crown
                                className={`h-3.5 w-3.5 ${
                                  i === 0
                                    ? "text-amber-400"
                                    : i === 1
                                      ? "text-slate-300"
                                      : "text-orange-400"
                                }`}
                              />
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No leaderboard data yet
                      </p>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                  >
                    <Link to="/leaderboard">
                      View Full Leaderboard
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* STATS CARD */}
              <Card className="border-border bg-card mt-4">
                <CardContent className="p-5">
                  <h3 className="text-headline-sm mb-3">Arena Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-low rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {allChallenges.filter(
                          (c) => c.status === "completed"
                        ).length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed
                      </p>
                    </div>
                    <div className="bg-surface-low rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {allChallenges.reduce(
                          (sum, c) =>
                            sum + ((c.stake_points || 0) * (c.challenge_participants?.length || 0)),
                          0
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Points Staked
                      </p>
                    </div>
                    <div className="bg-surface-low rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {allChallenges.filter(
                          (c) => c.status === "active"
                        ).length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active
                      </p>
                    </div>
                    <div className="bg-surface-low rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {allChallenges.reduce(
                          (sum, c) =>
                            sum + (c.challenge_participants?.length || 0),
                          0
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Participants
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* CTA */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <Swords className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-6 text-headline-lg">
              Ready to Challenge?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Create your own challenge or join an existing one. Stake points,
              compete, and earn glory.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 font-semibold tracking-wide"
            >
              <Link to="/arena/create">
                Create Challenge <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ChallengeCard({ challenge }: { challenge: any }) {
  const status = getChallengeStatus(challenge)
  const { seconds, isExpired } = useCountdown(
    status === "live"
      ? challenge.end_time
      : status === "upcoming"
        ? challenge.start_time
        : null
  )

  const participants = challenge.challenge_participants?.length || 0
  const max = challenge.max_participants || 0
  const pointsPool =
    (challenge.stake_points || 0) * participants
  const creator = challenge.creator
  const creatorName = creator?.full_name || "Anonymous"
  const creatorInitials = creator?.full_name
    ? creator.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
    : "?"
  const isFull = max > 0 && participants >= max

  return (
    <article className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className={`text-[10px] gap-1 ${TYPE_COLORS[challenge.type] || TYPE_COLORS.OPEN}`}
          >
            {TYPE_ICONS[challenge.type]}
            {TYPE_LABELS[challenge.type] || challenge.type}
          </Badge>
          {status === "live" && (
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              LIVE
            </Badge>
          )}
        </div>

        <h3 className="text-headline-sm mb-2 group-hover:text-primary transition-colors">
          {challenge.title}
        </h3>
        {challenge.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {challenge.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Avatar className="h-6 w-6">
            <AvatarImage src={creator?.avatar_url} />
            <AvatarFallback className="text-[10px]">
              {creatorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{creatorName}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {pointsPool > 0 ? `${pointsPool} pts` : "Free"}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants}
            {max > 0 ? `/${max}` : ""}
          </span>
          {status === "live" && (
            <span className="flex items-center gap-1 text-amber-400">
              <Timer className="h-3 w-3" />
              {formatCountdown(seconds)}
            </span>
          )}
          {status === "upcoming" && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Starts in {formatCountdown(seconds)}
            </span>
          )}
          {status === "past" && (
            <span className="flex items-center gap-1">Ended</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === "live" && !isFull && (
            <Button asChild size="sm" className="text-xs flex-1">
              <Link
                to="/arena/$challengeId"
                params={{ challengeId: challenge.id }}
              >
                Join Now
              </Link>
            </Button>
          )}
          {status === "live" && isFull && (
            <Button size="sm" variant="outline" className="text-xs flex-1" disabled>
              Full
            </Button>
          )}
          {status === "upcoming" && (
            <Button asChild size="sm" variant="outline" className="text-xs flex-1">
              <Link
                to="/arena/$challengeId"
                params={{ challengeId: challenge.id }}
              >
                Register
              </Link>
            </Button>
          )}
          {status !== "live" && status !== "upcoming" && (
            <Button asChild size="sm" variant="outline" className="text-xs flex-1">
              <Link
                to="/arena/$challengeId"
                params={{ challengeId: challenge.id }}
              >
                View Results
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost" className="text-xs">
            <Link
              to="/arena/$challengeId"
              params={{ challengeId: challenge.id }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}


