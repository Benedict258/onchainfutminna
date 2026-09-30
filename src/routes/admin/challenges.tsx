import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { apiQuery, apiQueryAll, apiUpdate, apiDelete } from "@/lib/api-client";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Users,
  Coins,
  AlertCircle,
  Code,
  Zap,
  Users as UsersIcon,
  Flag,
  Palette,
  FileText,
  Search,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  CODE_DUEL: "Code Duel",
  TEAM_CLASH: "Team Clash",
  OPEN: "Open",
  CTF: "CTF",
  DESIGN: "Design",
  CONTENT: "Content",
  RESEARCH: "Research",
  SPEED: "Speed Sprint",
};

const TYPE_COLORS: Record<string, string> = {
  CODE_DUEL: "bg-cyan-500/20 text-cyan-400",
  TEAM_CLASH: "bg-orange-500/20 text-orange-400",
  OPEN: "bg-emerald-500/20 text-emerald-400",
  CTF: "bg-red-500/20 text-red-400",
  DESIGN: "bg-pink-500/20 text-pink-400",
  CONTENT: "bg-violet-500/20 text-violet-400",
  RESEARCH: "bg-amber-500/20 text-amber-400",
  SPEED: "bg-blue-500/20 text-blue-400",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  rejected: "bg-red-500/20 text-red-400",
};

export const Route = createFileRoute("/admin/challenges")({
  component: AdminChallenges,
});

function AdminChallenges() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-challenges", statusFilter, typeFilter, page],
    queryFn: async () => {
      const filters: Record<string, any> = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (typeFilter) {
        filters.type = typeFilter;
      }
      const from = (page - 1) * 20;
      const res = await apiQuery("challenges", {
        select:
          "*, creator:profiles!challenges_creator_id_fkey(full_name, avatar_url), challenge_participants(id)",
        filters,
        order: { column: "created_at", ascending: false },
        range: [from, from + 19],
        count: "exact",
      });
      return {
        challenges: res.data || [],
        total: res.count || 0,
        page,
        limit: 20,
        totalPages: Math.ceil((res.count || 0) / 20),
      };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (challengeId: string) =>
      apiUpdate("challenges", { status: "active" }, { id: challengeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      toast.success("Challenge approved");
    },
    onError: () => toast.error("Failed to approve challenge"),
  });

  const rejectMutation = useMutation({
    mutationFn: (challengeId: string) =>
      apiUpdate("challenges", { status: "rejected" }, { id: challengeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      setRejectTarget(null);
      toast.success("Challenge rejected");
    },
    onError: () => toast.error("Failed to reject challenge"),
  });

  const challenges = data?.challenges || [];
  const stats = {
    pending: challenges.filter((c: any) => c.status === "pending").length,
    active: challenges.filter((c: any) => c.status === "active").length,
    total: data?.total || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Challenge Approval</h1>
          <p className="text-muted-foreground">Review and approve challenge submissions</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.pending > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Clock className="mr-1 h-3 w-3" />
              {stats.pending} pending
            </Badge>
          )}
          {stats.active > 0 && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              {stats.active} active
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex gap-2">
          {(["all", "pending", "active", "completed", "rejected"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Stake</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load challenges</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Could not fetch challenges.</span>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : challenges.length > 0 ? (
              challenges.map((challenge: any) => (
                <TableRow
                  key={challenge.id}
                  className="cursor-pointer hover:bg-surface-low"
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setDetailOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{challenge.title}</TableCell>
                  <TableCell>
                    <Badge
                      className={TYPE_COLORS[challenge.type] || "bg-muted text-muted-foreground"}
                    >
                      {TYPE_LABELS[challenge.type] || challenge.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {challenge.creator?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-amber-400" />
                      {challenge.stake_points || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {challenge.challenge_participants?.length || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[challenge.status] || ""}>
                      {challenge.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {challenge.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveMutation.mutate(challenge.id);
                            }}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectTarget(challenge);
                            }}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChallenge(challenge);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No challenges found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(1, page - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({
              length: Math.min(5, data.totalPages),
            }).map((_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, data.totalPages - 4)) + i;
              if (pageNum > data.totalPages) return null;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink onClick={() => setPage(pageNum)} isActive={pageNum === page}>
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                className={page === data.totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedChallenge?.title}</DialogTitle>
            <DialogDescription>Challenge details and rules</DialogDescription>
          </DialogHeader>
          {selectedChallenge && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    TYPE_COLORS[selectedChallenge.type] || "bg-muted text-muted-foreground"
                  }
                >
                  {TYPE_LABELS[selectedChallenge.type] || selectedChallenge.type}
                </Badge>
                <Badge className={STATUS_COLORS[selectedChallenge.status] || ""}>
                  {selectedChallenge.status}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                  {selectedChallenge.description || "No description"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Rules & Guidelines</Label>
                <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line bg-surface-low rounded-lg p-3 font-mono">
                  {selectedChallenge.rules || "No rules specified"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Start Time
                  </Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedChallenge.start_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    End Time
                  </Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedChallenge.end_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Max Participants
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedChallenge.max_participants || "Unlimited"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Stake Points
                  </Label>
                  <p className="text-sm font-medium">{selectedChallenge.stake_points || 0} pts</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Public
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedChallenge.is_public ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Creator
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedChallenge.creator?.full_name || "Unknown"}
                  </p>
                </div>
              </div>

              {selectedChallenge.status === "pending" && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectTarget(selectedChallenge);
                      setDetailOpen(false);
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      approveMutation.mutate(selectedChallenge.id);
                      setDetailOpen(false);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <AlertDialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject &quot;
              {rejectTarget?.title}&quot;? This will mark the challenge as rejected and it will not
              be visible in the arena.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => rejectMutation.mutate(rejectTarget.id)}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
