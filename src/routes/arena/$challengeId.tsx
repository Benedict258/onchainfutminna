import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiQuerySingle, apiQueryAll, apiInsert, apiUpdate } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import {
  ArrowLeft,
  Swords,
  Clock,
  Users,
  Coins,
  Trophy,
  Share2,
  Timer,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  Code,
  Zap,
  Flag,
  Palette,
  FileText,
  Search,
  Crown,
  Link as LinkIcon,
  Github,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

const TYPE_LABELS: Record<string, string> = {
  CODE_DUEL: "Code Duel",
  TEAM_CLASH: "Team Clash",
  OPEN: "Open Challenge",
  CTF: "CTF",
  DESIGN: "Design Challenge",
  CONTENT: "Content Clash",
  RESEARCH: "Research Sprint",
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

function formatCountdown(seconds: number) {
  if (seconds <= 0) return "Ended"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
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

function getChallengePhase(challenge: any) {
  const now = new Date()
  const start = new Date(challenge.start_time)
  const end = new Date(challenge.end_time)
  if (now < start) return "upcoming"
  if (now >= start && now <= end) return "live"
  return "past"
}

export const Route = createFileRoute("/arena/$challengeId")({
  head: () => ({
    meta: [
      { title: "Challenge | BlockchainClub FUTMinna" },
      { name: "description", content: "Challenge detail page." },
    ],
  }),
  component: ChallengeDetailPage,
})

function ChallengeDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function ChallengeDetailPage() {
  const params = Route.useParams()
  const challengeId = params.challengeId
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [submissionUrl, setSubmissionUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { data: challenge, isLoading } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () =>
      apiQuerySingle("challenges", {
        select:
          "*, creator:profiles!challenges_creator_id_fkey(full_name, avatar_url, department, level), challenge_participants(*, participant:profiles(full_name, avatar_url, department, level))",
        filters: { id: challengeId },
      }),
    refetchInterval: 10000,
  })

  const { data: submissions } = useQuery({
    queryKey: ["challenge-submissions", challengeId],
    queryFn: () =>
      apiQueryAll("challenge_participants", {
        select: "*, participant:profiles(full_name, avatar_url, department, level)",
        filters: { challenge_id: challengeId },
      }),
    enabled: !!challenge,
  })

  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiInsert("challenge_participants", {
        challenge_id: challengeId,
        user_id: user!.id,
        status: "joined",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] })
      queryClient.invalidateQueries({
        queryKey: ["challenge-submissions", challengeId],
      })
      toast.success("You joined the challenge!")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to join challenge")
    },
  })

  const voteMutation = useMutation({
    mutationFn: async ({
      submissionId,
      vote,
    }: {
      submissionId: string
      vote: "up" | "down"
    }) => {
      const sub = (submissions || []).find((s: any) => s.id === submissionId)
      const currentVotes = sub?.votes || 0
      return apiUpdate(
        "challenge_participants",
        { votes: vote === "up" ? currentVotes + 1 : currentVotes - 1 },
        { id: submissionId }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["challenge-submissions", challengeId],
      })
      toast.success("Vote recorded!")
    },
    onError: () => toast.error("Failed to vote"),
  })

  if (isLoading) return <ChallengeDetailSkeleton />

  if (!challenge) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-muted-foreground">Challenge not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/arena">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Arena
          </Link>
        </Button>
      </div>
    )
  }

  const phase = getChallengePhase(challenge)
  const now = new Date()
  const startDate = new Date(challenge.start_time)
  const endDate = new Date(challenge.end_time)

  const timerTarget =
    phase === "upcoming"
      ? challenge.start_time
      : phase === "live"
        ? challenge.end_time
        : null

  const { seconds, isExpired } = useCountdown(timerTarget)

  const creator = challenge.creator
  const creatorName = creator?.full_name || "Anonymous"
  const creatorInitials = creator?.full_name
    ? creator.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
    : "?"

  const participantList: any[] = challenge.challenge_participants || []
  const allSubmissions: any[] = submissions || []
  const participantCount = participantList.length
  const max = challenge.max_participants || 0
  const isFull = max > 0 && participantCount >= max

  const myParticipation = user
    ? participantList.find((p: any) => p.user_id === user.id)
    : null
  const hasJoined = !!myParticipation

  const pointsPool = (challenge.stake_points || 0) * participantCount
  const isAutomated =
    challenge.type === "CODE_DUEL" || challenge.type === "SPEED"
  const isCommunityVoted =
    challenge.type === "OPEN" || challenge.type === "CONTENT" || challenge.type === "DESIGN"

  async function handleJoin() {
    if (!user) {
      toast.error("Login required")
      return
    }
    joinMutation.mutate()
  }

  async function handleSubmitEntry() {
    if (!submissionUrl.trim()) {
      toast.error("Please enter a submission URL")
      return
    }
    if (!myParticipation) {
      toast.error("You must join the challenge first")
      return
    }
    setSubmitting(true)
    try {
      await apiUpdate(
        "challenge_participants",
        { submission_url: submissionUrl.trim(), status: "submitted" },
        { id: myParticipation.id }
      )
      queryClient.invalidateQueries({
        queryKey: ["challenge-submissions", challengeId],
      })
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] })
      toast.success("Submission received!")
      setSubmissionUrl("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: challenge.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied!")
    }
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Button variant="ghost" className="mb-6 -ml-2" asChild>
          <Link to="/arena">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Arena
          </Link>
        </Button>

        {/* HEADER */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge
            variant="outline"
            className={`gap-1 ${TYPE_COLORS[challenge.type] || TYPE_COLORS.OPEN}`}
          >
            {TYPE_ICONS[challenge.type]}
            {TYPE_LABELS[challenge.type] || challenge.type}
          </Badge>
          {challenge.status === "pending" && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              Pending Approval
            </Badge>
          )}
          {challenge.status === "active" && phase === "live" && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              LIVE
            </Badge>
          )}
          {phase === "past" && (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
              Ended
            </Badge>
          )}
        </div>

        <h1 className="text-headline-xl md:text-display-md tracking-tight mb-6">
          {challenge.title}
        </h1>

        {/* TIMER BAR */}
        <div className="rounded-lg border border-border bg-card p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {phase === "upcoming" ? "Starts In" : phase === "live" ? "Ends In" : "Status"}
                </p>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    phase === "live" && seconds < 3600
                      ? "text-destructive animate-pulse"
                      : phase === "live"
                        ? "text-amber-400"
                        : ""
                  }`}
                >
                  {phase === "past" ? "Completed" : formatCountdown(seconds)}
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Points Pool
                </p>
                <p className="text-2xl font-bold tabular-nums text-primary">
                  {pointsPool.toLocaleString()}
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Participants
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {participantCount}
                  {max > 0 && (
                    <span className="text-lg text-muted-foreground">
                      /{max}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {phase === "live" && !hasJoined && !isFull && challenge.status === "active" && (
                <Button onClick={handleJoin} disabled={joinMutation.isPending}>
                  {joinMutation.isPending
                    ? "Joining..."
                    : `Join (Stake ${challenge.stake_points || 0} pts)`}
                </Button>
              )}
              {hasJoined && phase === "live" && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Joined
                </Badge>
              )}
              {isFull && !hasJoined && (
                <Button disabled>Full</Button>
              )}
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* LEFT: Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h2 className="text-headline-sm mb-3">About This Challenge</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {challenge.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Rules */}
            {challenge.rules && (
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <h2 className="text-headline-sm mb-3">Rules & Guidelines</h2>
                  <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-line">
                    {challenge.rules}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Automated: Submit Entry */}
            {isAutomated && phase === "live" && hasJoined && (
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <h2 className="text-headline-sm mb-3">Submit Your Entry</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {challenge.type === "CODE_DUEL"
                      ? "Submit your PR or repository link for review."
                      : "Submit your solution before the timer runs out."}
                  </p>
                  <div className="flex gap-3">
                    <Input
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://github.com/your-repo/pull/1"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSubmitEntry}
                      disabled={submitting || !submissionUrl.trim()}
                    >
                      {submitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Github className="mr-2 h-4 w-4" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                  {myParticipation?.submission_url && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-muted-foreground">
                        Submitted:{" "}
                      </span>
                      <a
                        href={myParticipation.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {myParticipation.submission_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Community-voted: Submissions Grid */}
            {isCommunityVoted && (
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <h2 className="text-headline-sm mb-4">
                    Submissions ({allSubmissions.filter((s: any) => s.status === "submitted").length})
                  </h2>
                  {allSubmissions.filter((s: any) => s.status === "submitted").length > 0 ? (
                    <div className="grid gap-3">
                      {allSubmissions
                        .filter((s: any) => s.status === "submitted")
                        .map((sub: any) => {
                          const participant = sub.participant
                          const name = participant?.full_name || "Anonymous"
                          const initials = name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                          return (
                            <div
                              key={sub.id}
                              className="flex items-center gap-4 rounded-lg border border-border bg-surface-low p-4"
                            >
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={participant?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{name}</p>
                                {sub.submission_url && (
                                  <a
                                    href={sub.submission_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                    View Submission
                                  </a>
                                )}
                              </div>
                              {phase === "past" && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      voteMutation.mutate({
                                        submissionId: sub.id,
                                        vote: "up",
                                      })
                                    }
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <span className="text-sm font-semibold tabular-nums w-8 text-center">
                                    {sub.votes || 0}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      voteMutation.mutate({
                                        submissionId: sub.id,
                                        vote: "down",
                                      })
                                    }
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No submissions yet. Be the first!
                    </p>
                  )}

                  {/* Submit Entry for community voted */}
                  {phase === "live" && hasJoined && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="text-headline-xs mb-3">Submit Your Entry</h3>
                      <div className="flex gap-3">
                        <Input
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                          placeholder="https://your-submission-link.com"
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSubmitEntry}
                          disabled={submitting || !submissionUrl.trim()}
                        >
                          {submitting ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Participants list - for automated types */}
            {isAutomated && participantList.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <h2 className="text-headline-sm mb-4">
                    Participants ({participantList.length})
                  </h2>
                  <div className="space-y-2">
                    {participantList.map((p: any) => {
                      const participant = p.participant
                      const name = participant?.full_name || "Anonymous"
                      const initials = name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{name}</p>
                            {participant?.department && (
                              <p className="text-xs text-muted-foreground">
                                {participant.department}{" "}
                                {participant.level ? `• ${participant.level}` : ""}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              p.status === "submitted"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : p.status === "won"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                            }
                          >
                            {p.status === "submitted"
                              ? "Submitted"
                              : p.status === "won"
                                ? "Winner"
                                : "Joined"}
                          </Badge>
                          {p.submission_url && (
                            <a
                              href={p.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Winner Announcement */}
            {phase === "past" && challenge.winner_id && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-amber-400" />
                    <div>
                      <h2 className="text-headline-sm text-amber-400">
                        Challenge Completed
                      </h2>
                      <p className="text-sm text-amber-400/80 mt-1">
                        Winner has been announced. Total prize pool: {pointsPool} points.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">
            {/* Creator */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <h3 className="text-headline-sm mb-3">Created By</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={creator?.avatar_url} />
                    <AvatarFallback className="text-sm">
                      {creatorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{creatorName}</p>
                    {creator?.department && (
                      <p className="text-xs text-muted-foreground">
                        {creator.department}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="border-border bg-card">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-headline-sm">Challenge Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium">
                        {startDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-muted-foreground">
                        {startDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {endDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Coins className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium">
                        {challenge.stake_points || 0} points stake
                      </p>
                      <p className="text-muted-foreground">Per participant</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium">
                        {max > 0 ? `${max} max` : "Unlimited"} participants
                      </p>
                      <p className="text-muted-foreground">
                        {max > 0
                          ? `${max - participantCount} spots remaining`
                          : "Open participation"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wager Breakdown */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <h3 className="text-headline-sm mb-3">Wager Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stake per entry</span>
                    <span className="font-semibold">
                      {challenge.stake_points || 0} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total entries</span>
                    <span className="font-semibold">{participantCount}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold">Total Pool</span>
                    <span className="font-semibold text-primary">
                      {pointsPool.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Winner(s) split</span>
                    <span className="font-semibold text-emerald-400">
                      {pointsPool.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Button variant="outline" className="w-full" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Challenge
            </Button>

            {/* Login prompt */}
            {!user && (
              <Button asChild className="w-full">
                <a href="/auth">Login to Participate</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


