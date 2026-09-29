import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Search, Download, AlertCircle, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/students")({
  component: AdminStudents,
});

const GATE_STATUS_COLORS: Record<string, string> = {
  passed: "bg-green-500/20 text-green-400 hover:bg-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30",
  failed: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
  na: "bg-muted text-muted-foreground hover:bg-muted/80",
};

const TRACK_LABELS: Record<string, string> = {
  EVM: "EVM",
  SUI_MOVE: "Sui Move",
  APTOS_MOVE: "Aptos Move",
  SOLANA_RUST: "Solana Rust",
  GENERAL: "General",
};

type SortField = "name" | "points" | "progress" | "last_active";
type SortDir = "asc" | "desc";

interface StudentRow {
  userId: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  track: string;
  phase: string;
  totalPoints: number;
  modulesDone: number;
  modulesTotal: number;
  gateStatus: string;
  lastActive: string;
}

function exportCSV(students: StudentRow[]) {
  const header = [
    "Name",
    "Email",
    "Username",
    "Track",
    "Phase",
    "Total Points",
    "Progress %",
    "Modules Done",
    "Gate Status",
    "Last Active",
  ];
  const rows = students.map((s) => [
    s.fullName,
    s.email,
    s.username,
    s.track,
    s.phase,
    String(s.totalPoints),
    s.modulesTotal > 0
      ? String(Math.round((s.modulesDone / s.modulesTotal) * 100))
      : "0",
    `${s.modulesDone}/${s.modulesTotal}`,
    s.gateStatus,
    s.lastActive,
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `students-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGateBadgeClass(status: string): string {
  if (status === "passed") return GATE_STATUS_COLORS.passed;
  if (status === "pending") return GATE_STATUS_COLORS.pending;
  if (status === "failed") return GATE_STATUS_COLORS.failed;
  return GATE_STATUS_COLORS.na;
}

function getGateLabel(status: string): string {
  if (status === "passed") return "Passed";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return "N/A";
}

function AdminStudents() {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<string>("");
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-student-profiles"],
    queryFn: async () => {
      const res = await apiQuery("profiles", {
        select: "user_id,full_name,avatar_url,username,department,level,experience_level,updated_at",
        order: { column: "full_name", ascending: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ["admin-student-leaderboard"],
    queryFn: async () => {
      const res = await apiQuery("leaderboard_entries", {
        select: "user_id,total_points,event_points,learn_points,build_points,community_points,updated_at",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-student-users"],
    queryFn: async () => {
      const res = await apiQuery("users", {
        select: "id,email,role,is_active,created_at",
        filters: { is_active: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: progressData } = useQuery({
    queryKey: ["admin-student-progress"],
    queryFn: async () => {
      const res = await apiQuery("user_module_progress", {
        select: "user_id,module_id",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: tracksData } = useQuery({
    queryKey: ["admin-student-tracks"],
    queryFn: async () => {
      const res = await apiQuery("tracks", {
        select: "id,title,ecosystem,phase_count",
        filters: { is_published: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: modulesData } = useQuery({
    queryKey: ["admin-student-modules"],
    queryFn: async () => {
      const res = await apiQuery("modules", {
        select: "id,track_id,title,phase",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const isLoading = profilesLoading;

  const students = useMemo(() => {
    if (!profilesData || !usersData) return [];

    const userMap = new Map<string, Record<string, unknown>>();
    for (const u of usersData) {
      userMap.set(u.id as string, u);
    }

    const lbMap = new Map<string, Record<string, unknown>>();
    if (leaderboardData) {
      for (const lb of leaderboardData) {
        lbMap.set(lb.user_id as string, lb);
      }
    }

    const progressMap = new Map<string, Set<string>>();
    if (progressData) {
      for (const p of progressData) {
        const uid = p.user_id as string;
        if (!progressMap.has(uid)) progressMap.set(uid, new Set());
        progressMap.get(uid)!.add(p.module_id as string);
      }
    }

    const totalModules = (modulesData || []).length;

    return profilesData
      .filter((p) => {
        const userId = p.user_id as string;
        const user = userMap.get(userId);
        return user && (user.role as string) !== "SUPER_ADMIN" && (user.role as string) !== "ADMIN";
      })
      .map((p): StudentRow => {
        const userId = p.user_id as string;
        const user = userMap.get(userId);
        const lb = lbMap.get(userId);
        const completedSet = progressMap.get(userId) || new Set();

        const department = (p.department as string) || "N/A";
        const level = (p.level as string) || "N/A";

        return {
          userId,
          email: (user?.email as string) || "",
          fullName: (p.full_name as string) || "Unknown",
          username: (p.username as string) || "",
          avatarUrl: (p.avatar_url as string) || "",
          track: department,
          phase: level,
          totalPoints: (lb?.total_points as number) || 0,
          modulesDone: completedSet.size,
          modulesTotal: totalModules,
          gateStatus: "na",
          lastActive: (p.updated_at as string) || (user?.created_at as string) || "",
        };
      });
  }, [profilesData, usersData, leaderboardData, progressData, modulesData]);

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(lower) ||
          s.email.toLowerCase().includes(lower) ||
          s.username.toLowerCase().includes(lower),
      );
    }

    if (trackFilter) {
      result = result.filter((s) => s.track === trackFilter);
    }

    if (phaseFilter) {
      result = result.filter((s) => {
        if (phaseFilter === "capstone") return s.phase === "L500" || s.phase === "L600";
        return s.phase === phaseFilter;
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.fullName.localeCompare(b.fullName);
          break;
        case "points":
          cmp = a.totalPoints - b.totalPoints;
          break;
        case "progress":
          const pa = a.modulesTotal > 0 ? a.modulesDone / a.modulesTotal : 0;
          const pb = b.modulesTotal > 0 ? b.modulesDone / b.modulesTotal : 0;
          cmp = pa - pb;
          break;
        case "last_active":
          cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [students, search, trackFilter, phaseFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const pagedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const availableTracks = useMemo(() => {
    const tracks = new Set(students.map((s) => s.track));
    return Array.from(tracks).sort();
  }, [students]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Students</h1>
          <p className="text-muted-foreground">Track student progress and performance</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportCSV(filteredStudents)}
          disabled={filteredStudents.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={trackFilter}
          onValueChange={(value) => {
            setTrackFilter(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Tracks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            {availableTracks.map((t) => (
              <SelectItem key={t} value={t}>
                {TRACK_LABELS[t] || t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={phaseFilter}
          onValueChange={(value) => {
            setPhaseFilter(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {["L100", "L200", "L300", "L400", "L500", "L600"].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
            <SelectItem value="capstone">Capstone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("name")}
                >
                  Student
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("points")}
                >
                  Points
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Gate</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("last_active")}
                >
                  Last Active
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !profilesData ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load students</AlertTitle>
                    <AlertDescription>
                      <span>Could not fetch student data. Please try again.</span>
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : pagedStudents.length > 0 ? (
              pagedStudents.map((student) => {
                const progressPct =
                  student.modulesTotal > 0
                    ? Math.round((student.modulesDone / student.modulesTotal) * 100)
                    : 0;
                return (
                  <TableRow
                    key={student.userId}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/admin/students/$userId", params: { userId: student.userId } })}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatarUrl} alt={student.fullName} />
                          <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {student.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {student.username ? `@${student.username}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.track}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{student.phase}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={progressPct} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">
                          {student.modulesDone}/{student.modulesTotal}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.totalPoints}</TableCell>
                    <TableCell>
                      <Badge className={getGateBadgeClass(student.gateStatus)}>
                        {getGateLabel(student.gateStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {student.lastActive
                        ? new Date(student.lastActive).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No students found
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
    </div>
  );
}


