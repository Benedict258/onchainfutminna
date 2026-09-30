import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery, apiInsert } from "@/lib/api-client";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, ExternalLink, FileText, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/certifications")({
  component: AdminCertifications,
});

const TIER_LABELS: Record<number, string> = {
  1: "Foundation",
  2: "Builder",
  3: "Track",
};

const TIER_BADGES: Record<number, string> = {
  1: "bg-blue-500/20 text-blue-400",
  2: "bg-purple-500/20 text-purple-400",
  3: "bg-amber-500/20 text-amber-400",
};

const TRACKS = ["Security Auditor", "Protocol Developer", "Full-Stack dApp"] as const;
const PAGE_SIZE = 20;

interface StudentOption {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
}

interface CertRow {
  id: string;
  userId: string;
  tier: number;
  track: string | null;
  sbtTxHash: string | null;
  pdfUrl: string | null;
  portfolioUrl: string | null;
  cohortYear: number | null;
  issuedAt: string;
  issuedBy: string | null;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AdminCertifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [tier, setTier] = useState<string>("");
  const [track, setTrack] = useState<string>("");
  const [cohortYear, setCohortYear] = useState(new Date().getFullYear().toString());
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const currentTier = tier ? parseInt(tier) : 0;

  const {
    data: certsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-certifications"],
    queryFn: async () => {
      const res = await apiQuery("certifications", {
        select: "*",
        order: { column: "issued_at", ascending: false },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-certifications-users"],
    queryFn: async () => {
      const res = await apiQuery("users", {
        select: "id,email,profiles(full_name,avatar_url)",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: gateChecksData } = useQuery({
    queryKey: ["admin-certifications-gate-checks"],
    queryFn: async () => {
      const res = await apiQuery("gate_checks", {
        select: "user_id,gate,status",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: dialogOpen,
  });

  const { data: allStudentsData } = useQuery({
    queryKey: ["admin-certifications-all-students"],
    queryFn: async () => {
      const res = await apiQuery("users", {
        select: "id,email,role,profiles(full_name,avatar_url)",
        filters: { is_active: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: dialogOpen,
  });

  const eligibleStudents = useMemo(() => {
    if (!allStudentsData || !gateChecksData) return [];

    const studentMap = new Map<string, StudentOption>();
    for (const u of allStudentsData) {
      const role = (u.role as string) || "";
      if (role === "ADMIN" || role === "SUPER_ADMIN") continue;
      const profiles = (u.profiles as any[]) || [];
      const profile = profiles[0] as Record<string, unknown> | undefined;
      studentMap.set(u.id as string, {
        userId: u.id as string,
        email: (u.email as string) || "",
        fullName: (profile?.full_name as string) || (u.email as string) || "Unknown",
        avatarUrl: (profile?.avatar_url as string) || "",
      });
    }

    const passedGates = new Map<string, Set<number>>();
    for (const gc of gateChecksData) {
      const uid = gc.user_id as string;
      const g = gc.gate as number;
      const status = gc.status as string;
      if (status !== "passed") continue;
      if (!passedGates.has(uid)) passedGates.set(uid, new Set());
      passedGates.get(uid)!.add(g);
    }

    if (currentTier === 0) {
      return Array.from(studentMap.values());
    }

    const eligible: StudentOption[] = [];
    for (const [uid, student] of studentMap) {
      const gates = passedGates.get(uid);
      if (!gates) continue;
      if (currentTier === 1 && gates.has(1)) eligible.push(student);
      else if (currentTier === 2 && gates.has(2)) eligible.push(student);
      else if (currentTier === 3 && gates.has(3)) eligible.push(student);
    }
    return eligible;
  }, [allStudentsData, gateChecksData, currentTier]);

  const userMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    if (usersData) {
      for (const u of usersData) {
        map.set(u.id as string, u);
      }
    }
    return map;
  }, [usersData]);

  const rows: CertRow[] = useMemo(() => {
    if (!certsData) return [];
    return certsData.map((c) => {
      const certUser = userMap.get(c.user_id as string) || {};
      const profiles = (certUser.profiles as any[]) || [];
      const profile = profiles[0] as Record<string, unknown> | undefined;
      return {
        id: c.id as string,
        userId: c.user_id as string,
        tier: c.tier as number,
        track: (c.track as string) || null,
        sbtTxHash: (c.sbt_tx_hash as string) || null,
        pdfUrl: (c.pdf_url as string) || null,
        portfolioUrl: (c.portfolio_url as string) || null,
        cohortYear: (c.cohort_year as number) || null,
        issuedAt: c.issued_at as string,
        issuedBy: (c.issued_by as string) || null,
        studentName: (profile?.full_name as string) || (certUser.email as string) || "Unknown",
        studentEmail: (certUser.email as string) || "",
        studentAvatar: (profile?.avatar_url as string) || "",
      };
    });
  }, [certsData, userMap]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent) throw new Error("No student selected");
      const payload: Record<string, unknown> = {
        user_id: selectedStudent.userId,
        tier: currentTier,
        cohort_year: cohortYear ? parseInt(cohortYear) : null,
        portfolio_url: portfolioUrl || null,
        issued_by: user?.id,
      };
      if (currentTier === 3 && track) {
        payload.track = track;
      }
      payload.pdf_url = "https://placeholder.local/cert.pdf";
      return apiInsert("certifications", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Certificate issued");
    },
    onError: () => toast.error("Failed to issue certificate"),
  });

  function resetForm() {
    setSelectedStudent(null);
    setTier("");
    setTrack("");
    setCohortYear(new Date().getFullYear().toString());
    setPortfolioUrl("");
  }

  function openIssueDialog() {
    resetForm();
    setDialogOpen(true);
  }

  const isFormValid = selectedStudent && tier && (currentTier !== 3 || track);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Certifications</h1>
          <p className="text-muted-foreground">Issue and manage student certificates</p>
        </div>
        <Button onClick={openIssueDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Issue Certificate
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>SBT Status</TableHead>
              <TableHead>PDF</TableHead>
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
                    <AlertTitle>Failed to load certifications</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Could not fetch data. Please try again.</span>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : pagedRows.length > 0 ? (
              pagedRows.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={cert.studentAvatar} />
                        <AvatarFallback className="text-xs">
                          {getInitials(cert.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{cert.studentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {cert.studentEmail}
                  </TableCell>
                  <TableCell>
                    <Badge className={TIER_BADGES[cert.tier] || "bg-muted text-muted-foreground"}>
                      Tier {cert.tier} &middot; {TIER_LABELS[cert.tier] || ""}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {cert.track || <span className="text-muted-foreground"></span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(cert.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {cert.sbtTxHash ? (
                      <a
                        href={`https://suivision.xyz/txblock/${cert.sbtTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-400 hover:underline"
                      >
                        Minted
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-yellow-400">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cert.pdfUrl ? (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <FileText className="h-3 w-3" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground"></span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No certifications issued yet
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Certificate</DialogTitle>
            <DialogDescription>Issue a blockchain certificate to a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Tier</Label>
              <Select
                value={tier}
                onValueChange={(v) => {
                  setTier(v);
                  setSelectedStudent(null);
                  setTrack("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tier 1 &mdash; Foundation</SelectItem>
                  <SelectItem value="2">Tier 2 &mdash; Builder</SelectItem>
                  <SelectItem value="3">Tier 3 &mdash; Track</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Student</Label>
              <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentSearchOpen}
                    className="w-full justify-between"
                    disabled={!tier}
                  >
                    {selectedStudent
                      ? selectedStudent.fullName
                      : tier
                        ? "Search students..."
                        : "Select a tier first"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or email..." />
                    <CommandList>
                      <CommandEmpty>
                        {tier ? "No eligible students found" : "No students"}
                      </CommandEmpty>
                      <CommandGroup>
                        {eligibleStudents.map((s) => (
                          <CommandItem
                            key={s.userId}
                            value={s.fullName}
                            onSelect={() => {
                              setSelectedStudent(s);
                              setStudentSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedStudent?.userId === s.userId ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={s.avatarUrl} />
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(s.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm">{s.fullName}</p>
                                <p className="text-xs text-muted-foreground">{s.email}</p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {currentTier === 3 && (
              <div>
                <Label>Track</Label>
                <Select value={track} onValueChange={setTrack}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Cohort Year</Label>
              <Input
                type="number"
                value={cohortYear}
                onChange={(e) => setCohortYear(e.target.value)}
                placeholder="2026"
              />
            </div>

            <div>
              <Label>Portfolio URL</Label>
              <Input
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => issueMutation.mutate()}
                disabled={!isFormValid || issueMutation.isPending}
              >
                Issue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
