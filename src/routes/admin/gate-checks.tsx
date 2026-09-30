import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiQuery, apiUpdate, apiAward } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gate-checks")({
  component: AdminGateChecks,
});

const GATES = [1, 2, 3] as const;
const STATUSES = ["pending", "passed", "failed"] as const;
const PAGE_SIZE = 20;

interface GateCheckRow {
  id: string;
  userId: string;
  trackId: string;
  gate: number;
  status: string;
  devlogCount: number;
  prSubmitted: boolean;
  prMerged: boolean;
  testResults: string | null;
  notes: string | null;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  userEmail: string;
  userFullName: string;
  userAvatarUrl: string | null;
  trackTitle: string;
}

function AdminGateChecks() {
  const queryClient = useQueryClient();
  const [trackFilter, setTrackFilter] = useState("");
  const [gateFilter, setGateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [reviewItem, setReviewItem] = useState<GateCheckRow | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const POINTS_PER_GATE: Record<number, number> = { 1: 20, 2: 30, 3: 50 };

  const { data: gateChecksData, isLoading: gcLoading } = useQuery({
    queryKey: ["admin-gate-checks-raw"],
    queryFn: async () => {
      const res = await apiQuery("gate_checks", {
        select: "*",
        order: { column: "submitted_at", ascending: false },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-gate-checks-users"],
    queryFn: async () => {
      const res = await apiQuery("users", {
        select: "id,email,profiles(full_name,avatar_url)",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: tracksData } = useQuery({
    queryKey: ["admin-gate-checks-tracks"],
    queryFn: async () => {
      const res = await apiQuery("tracks", { select: "id,title" });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const isLoading = gcLoading;

  const userMap = new Map<string, Record<string, unknown>>();
  (usersData || []).forEach((u: Record<string, unknown>) => {
    userMap.set(u.id as string, u);
  });

  const trackMap = new Map<string, string>();
  (tracksData || []).forEach((t: Record<string, unknown>) => {
    trackMap.set(t.id as string, (t.title as string) || "Unknown");
  });

  const rows: GateCheckRow[] = (gateChecksData || []).map((gc: Record<string, unknown>) => {
    const user = userMap.get(gc.user_id as string) || {};
    const profiles = ((user as any).profiles as any[]) || [];
    const profile = profiles[0] as Record<string, unknown> | undefined;
    return {
      id: gc.id as string,
      userId: gc.user_id as string,
      trackId: gc.track_id as string,
      gate: gc.gate as number,
      status: (gc.status as string) || "pending",
      devlogCount: (gc.devlog_count as number) || 0,
      prSubmitted: !!(gc.pr_submitted as boolean),
      prMerged: !!(gc.pr_merged as boolean),
      testResults: (gc.test_results as string) || null,
      notes: (gc.notes as string) || null,
      submittedAt: gc.submitted_at as string,
      reviewedBy: (gc.reviewed_by as string) || null,
      reviewedAt: (gc.reviewed_at as string) || null,
      userEmail: (user.email as string) || "Unknown",
      userFullName: (profile?.full_name as string) || (user.email as string) || "Unknown",
      userAvatarUrl: (profile?.avatar_url as string) || null,
      trackTitle: trackMap.get(gc.track_id as string) || "Unknown",
    };
  });

  const trackOptions = Array.from(new Set(rows.map((r) => r.trackTitle))).sort();

  let filteredRows = rows;
  if (trackFilter) {
    filteredRows = filteredRows.filter((r) => r.trackTitle === trackFilter);
  }
  if (gateFilter) {
    filteredRows = filteredRows.filter((r) => String(r.gate) === gateFilter);
  }
  if (statusFilter) {
    filteredRows = filteredRows.filter((r) => r.status === statusFilter);
  }

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedRows.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      apiUpdate(
        "gate_checks",
        {
          status,
          notes: notes || undefined,
          reviewed_at: new Date().toISOString(),
        },
        { id },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gate-checks-raw"] });
    },
    onError: () => toast.error("Failed to update gate check"),
  });

  const approveMutation = useMutation({
    mutationFn: async (item: GateCheckRow) => {
      await apiUpdate(
        "gate_checks",
        {
          status: "passed",
          notes: reviewNotes || undefined,
          reviewed_at: new Date().toISOString(),
        },
        { id: item.id },
      );
      try {
        await apiAward(`gate${item.gate}-passed`, item.id);
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gate-checks-raw"] });
      setReviewItem(null);
      setReviewNotes("");
      toast.success("Gate check approved");
    },
    onError: () => toast.error("Failed to approve gate check"),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const selectedRows = rows.filter((r) => selectedIds.has(r.id));
      for (const row of selectedRows) {
        await apiUpdate(
          "gate_checks",
          {
            status: "passed",
            reviewed_at: new Date().toISOString(),
          },
          { id: row.id },
        );
        try {
          await apiAward(`gate${row.gate}-passed`, row.id);
        } catch {}
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gate-checks-raw"] });
      setSelectedIds(new Set());
      toast.success("Selected gate checks approved");
    },
    onError: () => toast.error("Failed to bulk approve"),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      for (const id of selectedIds) {
        await apiUpdate(
          "gate_checks",
          {
            status,
            notes: notes || undefined,
            reviewed_at: new Date().toISOString(),
          },
          { id },
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gate-checks-raw"] });
      setSelectedIds(new Set());
      toast.success("Bulk status updated");
    },
    onError: () => toast.error("Failed to bulk update status"),
  });

  const openReview = (row: GateCheckRow) => {
    setReviewItem(row);
    setReviewStatus(row.status);
    setReviewNotes(row.notes || "");
  };

  const handleSaveReview = () => {
    if (!reviewItem) return;
    updateMutation.mutate({
      id: reviewItem.id,
      status: reviewStatus,
      notes: reviewNotes,
    });
    setReviewItem(null);
    setReviewNotes("");
  };

  const handleApprove = () => {
    if (!reviewItem) return;
    approveMutation.mutate(reviewItem);
  };

  const handleReject = () => {
    if (!reviewItem || !reviewNotes.trim()) return;
    updateMutation.mutate({
      id: reviewItem.id,
      status: "failed",
      notes: reviewNotes,
    });
    setReviewItem(null);
    setReviewNotes("");
  };

  const handleRequestChanges = () => {
    if (!reviewItem) return;
    updateMutation.mutate({
      id: reviewItem.id,
      status: "pending",
      notes: reviewNotes,
    });
    setReviewItem(null);
    setReviewNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return {
          variant: "default" as const,
          className: "bg-green-500/20 text-green-400 border-green-500/30",
        };
      case "pending":
        return {
          variant: "default" as const,
          className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        };
      case "failed":
        return {
          variant: "default" as const,
          className: "bg-red-500/20 text-red-400 border-red-500/30",
        };
      default:
        return { variant: "secondary" as const, className: "" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const userInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Gate Checks</h1>
          <p className="text-muted-foreground">Review student gate submissions</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={trackFilter}
          onValueChange={(v) => {
            setTrackFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Tracks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            {trackOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={gateFilter}
          onValueChange={(v) => {
            setGateFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Gates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gates</SelectItem>
            {GATES.map((g) => (
              <SelectItem key={g} value={String(g)}>
                Gate {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => bulkApproveMutation.mutate()}
              disabled={bulkApproveMutation.isPending}
            >
              Approve Selected ({selectedIds.size})
            </Button>
            <Select
              value=""
              onValueChange={(v) => {
                if (v) bulkStatusMutation.mutate({ status: v });
              }}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Bulk Status Change" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={pagedRows.length > 0 && selectedIds.size === pagedRows.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Gate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Reviewed By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pagedRows.length > 0 ? (
              pagedRows.map((row) => {
                const badge = getStatusBadge(row.status);
                return (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => openReview(row)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => toggleSelect(row.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.userAvatarUrl ? (
                          <img
                            src={row.userAvatarUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {userInitials(row.userFullName)}
                          </div>
                        )}
                        <span className="font-medium text-sm truncate max-w-[140px]">
                          {row.userFullName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                      {row.userEmail}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{row.trackTitle}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">Gate {row.gate}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={badge.className}>
                        {getStatusIcon(row.status)}
                        <span className="ml-1">
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.reviewedBy || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReview(row);
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No gate checks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(1, page - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
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
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog
        open={!!reviewItem}
        onOpenChange={(open) => {
          if (!open) {
            setReviewItem(null);
            setReviewNotes("");
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gate Check Review</DialogTitle>
            <DialogDescription>
              Review student submission for Gate {reviewItem?.gate}
            </DialogDescription>
          </DialogHeader>
          {reviewItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                {reviewItem.userAvatarUrl ? (
                  <img
                    src={reviewItem.userAvatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {userInitials(reviewItem.userFullName)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{reviewItem.userFullName}</p>
                  <p className="text-xs text-muted-foreground">{reviewItem.userEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Track:</span>
                  <span className="ml-1 font-medium">{reviewItem.trackTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gate:</span>
                  <span className="ml-1 font-medium">{reviewItem.gate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Points:</span>
                  <span className="ml-1 font-medium">+{POINTS_PER_GATE[reviewItem.gate] || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="ml-1 font-medium">
                    {reviewItem.submittedAt
                      ? new Date(reviewItem.submittedAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>

              {reviewItem.gate === 1 && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <h4 className="text-sm font-medium">Gate 1 Requirements</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">DEVLOG Count:</span>
                    <Badge
                      variant={reviewItem.devlogCount >= 3 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {reviewItem.devlogCount} / 3
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">PR Submitted:</span>
                    {reviewItem.prSubmitted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              )}

              {reviewItem.gate === 2 && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <h4 className="text-sm font-medium">Gate 2 Requirements</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">PR Merged:</span>
                    {reviewItem.prMerged ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Test Results:</span>
                    <span className="ml-1">
                      {reviewItem.testResults || "No test results submitted"}
                    </span>
                  </div>
                </div>
              )}

              {reviewItem.gate === 3 && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <h4 className="text-sm font-medium">Gate 3 Requirements</h4>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Test Results:</span>
                    <span className="ml-1">
                      {reviewItem.testResults || "No test results submitted"}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Notes {reviewStatus === "failed" && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes..."
                  rows={3}
                  className={
                    reviewStatus === "failed" && !reviewNotes.trim() ? "border-destructive" : ""
                  }
                />
              </div>

              {reviewItem.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Previous Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{reviewItem.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewItem(null);
                    setReviewNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={handleRequestChanges}
                  disabled={updateMutation.isPending}
                >
                  Request Changes
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={
                    updateMutation.isPending || (reviewStatus === "failed" && !reviewNotes.trim())
                  }
                >
                  Reject
                </Button>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                >
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
