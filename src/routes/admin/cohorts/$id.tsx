import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiQuery, apiUpdate } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  BookOpen,
  ShieldCheck,
  Plus,
  Download,
  Search,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/cohorts/$id')({
  component: CohortDashboard,
});

const GATE_STATUS_COLORS: Record<string, string> = {
  passed: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  na: 'bg-muted text-muted-foreground',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getGateBadgeClass(status: string): string {
  if (status === 'passed') return GATE_STATUS_COLORS.passed;
  if (status === 'pending') return GATE_STATUS_COLORS.pending;
  if (status === 'failed') return GATE_STATUS_COLORS.failed;
  return GATE_STATUS_COLORS.na;
}

function getGateLabel(status: string): string {
  if (status === 'passed') return 'Passed';
  if (status === 'pending') return 'Pending';
  if (status === 'failed') return 'Failed';
  return 'N/A';
}

interface StudentProgress {
  userId: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  track: string;
  phase: string;
  modulesDone: number;
  modulesTotal: number;
  progressPct: number;
  totalPoints: number;
  gate1: string;
  gate2: string;
  gate3: string;
  lastActive: string;
}

function exportStudentCSV(students: StudentProgress[], cohortName: string) {
  const header = [
    'Name',
    'Email',
    'Username',
    'Track',
    'Phase',
    'Modules Done',
    'Modules Total',
    'Progress %',
    'Points',
    'Gate 1',
    'Gate 2',
    'Gate 3',
    'Last Active',
  ];
  const rows = students.map((s) => [
    s.fullName,
    s.email,
    s.username,
    s.track,
    s.phase,
    String(s.modulesDone),
    String(s.modulesTotal),
    String(s.progressPct),
    String(s.totalPoints),
    getGateLabel(s.gate1),
    getGateLabel(s.gate2),
    getGateLabel(s.gate3),
    s.lastActive,
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cohortName.replace(/\s+/g, '_')}-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exported');
}

function CohortDashboard() {
  const { id: cohortId } = Route.useParams();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { data: cohort, isLoading: cohortLoading } = useQuery({
    queryKey: ['admin-cohort', cohortId],
    queryFn: async () => {
      const res = await apiQuery('cohorts', {
        select: '*',
        filters: { id: cohortId },
        single: true,
      });
      return res.data as Record<string, unknown> | null;
    },
    enabled: !!cohortId && !!accessToken,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-cohort-users', cohortId],
    queryFn: async () => {
      const res = await apiQuery('users', {
        select: 'id,email,cohort_id',
        filters: { cohort_id: cohortId, is_active: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!cohortId && !!accessToken,
  });

  const { data: profilesData } = useQuery({
    queryKey: ['admin-cohort-profiles', cohortId],
    queryFn: async () => {
      const userIds = (usersData || []).map((u) => u.id as string);
      if (userIds.length === 0) return [];
      const res = await apiQuery('profiles', {
        select: 'user_id,full_name,avatar_url,username,department,level,updated_at',
      });
      const allProfiles = (res.data || []) as Record<string, unknown>[];
      return allProfiles.filter((p) => userIds.includes(p.user_id as string));
    },
    enabled: !!cohortId && !!accessToken && !!usersData,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['admin-cohort-leaderboard', cohortId],
    queryFn: async () => {
      const userIds = (usersData || []).map((u) => u.id as string);
      if (userIds.length === 0) return [];
      const res = await apiQuery('leaderboard_entries', {
        select: 'user_id,total_points',
      });
      const allEntries = (res.data || []) as Record<string, unknown>[];
      return allEntries.filter((e) => userIds.includes(e.user_id as string));
    },
    enabled: !!cohortId && !!accessToken && !!usersData,
  });

  const { data: progressData } = useQuery({
    queryKey: ['admin-cohort-progress', cohortId],
    queryFn: async () => {
      const userIds = (usersData || []).map((u) => u.id as string);
      if (userIds.length === 0) return [];
      const res = await apiQuery('user_module_progress', {
        select: 'user_id,module_id',
      });
      return ((res.data || []) as Record<string, unknown>[]).filter((p) =>
        userIds.includes(p.user_id as string),
      );
    },
    enabled: !!cohortId && !!accessToken && !!usersData,
  });

  const { data: modulesData } = useQuery({
    queryKey: ['admin-cohort-modules'],
    queryFn: async () => {
      const res = await apiQuery('modules', {
        select: 'id',
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: gateData } = useQuery({
    queryKey: ['admin-cohort-gates', cohortId],
    queryFn: async () => {
      const userIds = (usersData || []).map((u) => u.id as string);
      if (userIds.length === 0) return [];
      const res = await apiQuery('gate_checks', {
        select: 'user_id,gate_number,status',
      });
      return ((res.data || []) as Record<string, unknown>[]).filter((g) =>
        userIds.includes(g.user_id as string),
      );
    },
    enabled: !!cohortId && !!accessToken && !!usersData,
  });

  const addStudentsMutation = useMutation({
    mutationFn: async () => {
      for (const userId of selectedUsers) {
        await apiUpdate('users', { cohort_id: cohortId }, { id: userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cohort-users', cohortId] });
      queryClient.invalidateQueries({ queryKey: ['admin-cohorts-student-counts'] });
      setAddStudentOpen(false);
      setSelectedUsers(new Set());
      setUserSearch('');
      toast.success(`${selectedUsers.size} student(s) added to cohort`);
    },
    onError: () => toast.error('Failed to add students'),
  });

  const students = useMemo((): StudentProgress[] => {
    if (!usersData || !profilesData) return [];

    const profileMap = new Map<string, Record<string, unknown>>();
    for (const p of profilesData || []) {
      profileMap.set(p.user_id as string, p);
    }

    const lbMap = new Map<string, Record<string, unknown>>();
    for (const lb of leaderboardData || []) {
      lbMap.set(lb.user_id as string, lb);
    }

    const progressMap = new Map<string, Set<string>>();
    for (const p of progressData || []) {
      const uid = p.user_id as string;
      if (!progressMap.has(uid)) progressMap.set(uid, new Set());
      progressMap.get(uid)!.add(p.module_id as string);
    }

    const gateMap = new Map<string, Record<number, string>>();
    for (const g of gateData || []) {
      const uid = g.user_id as string;
      const gateNum = g.gate_number as number;
      const status = g.status as string;
      if (!gateMap.has(uid)) gateMap.set(uid, {});
      gateMap.get(uid)![gateNum] = status;
    }

    const totalModules = (modulesData || []).length;

    return usersData.map((u): StudentProgress => {
      const userId = u.id as string;
      const profile = profileMap.get(userId);
      const lb = lbMap.get(userId);
      const completedSet = progressMap.get(userId) || new Set();
      const gates = gateMap.get(userId) || {};

      const modulesDone = completedSet.size;
      const progressPct = totalModules > 0 ? Math.round((modulesDone / totalModules) * 100) : 0;

      return {
        userId,
        email: (u.email as string) || '',
        fullName: (profile?.full_name as string) || 'Unknown',
        username: (profile?.username as string) || '',
        avatarUrl: (profile?.avatar_url as string) || '',
        track: (profile?.department as string) || 'N/A',
        phase: (profile?.level as string) || 'N/A',
        modulesDone,
        modulesTotal: totalModules,
        progressPct,
        totalPoints: (lb?.total_points as number) || 0,
        gate1: gates[1] || 'na',
        gate2: gates[2] || 'na',
        gate3: gates[3] || 'na',
        lastActive: (profile?.updated_at as string) || (u.created_at as string) || '',
      };
    });
  }, [usersData, profilesData, leaderboardData, progressData, gateData, modulesData]);

  const avgProgress = useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round(students.reduce((sum, s) => sum + s.progressPct, 0) / students.length);
  }, [students]);

  const gatesPassed = useMemo(() => {
    let count = 0;
    for (const s of students) {
      if (s.gate1 === 'passed') count++;
      if (s.gate2 === 'passed') count++;
      if (s.gate3 === 'passed') count++;
    }
    return count;
  }, [students]);

  const handleUserSearch = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await apiQuery('profiles', {
        select: 'user_id,full_name,avatar_url,username,email:users(email)',
        filters: {
          __or: [
            { full_name: { __op: 'ilike', value: `%${query}%` } },
            { username: { __op: 'ilike', value: `%${query}%` } },
          ],
        },
        limit: 20,
      });
      const results = (res.data || []) as Record<string, unknown>[];
      setSearchResults(results);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const isLoading = cohortLoading;
  const cohortName = (cohort?.name as string) || '';
  const startDate = cohort?.start_date as string;
  const endDate = cohort?.end_date as string;
  const daysRemaining = endDate
    ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/admin/cohorts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cohorts
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cohort not found</AlertTitle>
          <AlertDescription>
            The requested cohort could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/admin/cohorts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cohorts
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportStudentCSV(students, cohortName)}
            disabled={students.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setAddStudentOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-headline-lg">{cohortName}</h1>
        <p className="text-muted-foreground">
          {startDate && new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {' - '}
          {endDate && new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          <span className={`ml-3 text-sm font-medium ${daysRemaining <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Ended'}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{students.length}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <BookOpen className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{avgProgress}%</p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <ShieldCheck className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{gatesPassed}</p>
              <p className="text-xs text-muted-foreground">Gates Passed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Gate 1</TableHead>
              <TableHead>Gate 2</TableHead>
              <TableHead>Gate 3</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.userId} className="cursor-pointer hover:bg-muted/50">
                  <TableCell onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatarUrl} alt={student.fullName} />
                        <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-muted-foreground text-sm"
                    onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}
                  >
                    {student.email}
                  </TableCell>
                  <TableCell onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}>
                    <Badge variant="secondary">{student.track}</Badge>
                  </TableCell>
                  <TableCell
                    className="text-sm"
                    onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}
                  >
                    {student.phase}
                  </TableCell>
                  <TableCell
                    className="font-mono text-sm"
                    onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}
                  >
                    {student.modulesDone}/{student.modulesTotal}
                  </TableCell>
                  <TableCell onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress value={student.progressPct} className="h-2 w-16" />
                      <span className="text-xs text-muted-foreground">{student.progressPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="font-mono text-sm"
                    onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}
                  >
                    {student.totalPoints}
                  </TableCell>
                  <TableCell onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}>
                    <Badge className={getGateBadgeClass(student.gate1)}>
                      {getGateLabel(student.gate1)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}>
                    <Badge className={getGateBadgeClass(student.gate2)}>
                      {getGateLabel(student.gate2)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}>
                    <Badge className={getGateBadgeClass(student.gate3)}>
                      {getGateLabel(student.gate3)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-muted-foreground text-sm"
                    onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}
                  >
                    {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => navigate({ to: '/admin/students/$userId', params: { userId: student.userId } })}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No students in this cohort yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Students</DialogTitle>
            <DialogDescription>
              Search for users to add to {cohortName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {searchResults.map((result) => {
                  const userId = result.user_id as string;
                  const name = result.full_name as string;
                  const username = result.username as string;
                  const avatarUrl = result.avatar_url as string;
                  const isSelected = selectedUsers.has(userId);

                  return (
                    <div
                      key={userId}
                      className={`flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors hover:bg-muted ${
                        isSelected ? 'bg-primary/10 border border-primary/30' : ''
                      }`}
                      onClick={() => toggleUser(userId)}
                    >
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} alt={name} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        {username && <p className="text-xs text-muted-foreground">@{username}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : userSearch.length >= 2 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found matching "{userSearch}"
              </p>
            ) : userSearch.length === 1 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Type at least 2 characters to search
              </p>
            ) : null}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {selectedUsers.size} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAddStudentOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addStudentsMutation.mutate()}
                  disabled={selectedUsers.size === 0 || addStudentsMutation.isPending}
                >
                  {addStudentsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Selected
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


