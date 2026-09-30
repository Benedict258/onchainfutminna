import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery, apiInsert, apiUpdate } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Archive, Users, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cohorts")({
  component: AdminCohorts,
});

interface CohortForm {
  name: string;
  startDate: string;
  endDate: string;
}

const defaultForm: CohortForm = {
  name: "",
  startDate: "",
  endDate: "",
};

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const startDate = new Date(start).toLocaleDateString("en-US", opts);
  const endDate = new Date(end).toLocaleDateString("en-US", opts);
  return `${startDate} - ${endDate}`;
}

function getDaysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function AdminCohorts() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CohortForm>(defaultForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formErrors = {
    name: touched.name && !form.name ? "Name is required" : "",
    startDate: touched.startDate && !form.startDate ? "Start date is required" : "",
    endDate: touched.endDate && !form.endDate ? "End date is required" : "",
  };
  const isFormValid = !!form.name && !!form.startDate && !!form.endDate;

  const {
    data: cohorts,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-cohorts"],
    queryFn: async () => {
      const res = await apiQuery("cohorts", {
        select: "*",
        order: { column: "created_at", ascending: false },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: cohortStudentCounts } = useQuery({
    queryKey: ["admin-cohorts-student-counts"],
    queryFn: async () => {
      const res = await apiQuery("users", {
        select: "id,cohort_id",
        filters: { is_active: true },
      });
      const users = (res.data || []) as Record<string, unknown>[];
      const counts: Record<string, number> = {};
      for (const u of users) {
        const cid = u.cohort_id as string;
        if (cid) {
          counts[cid] = (counts[cid] || 0) + 1;
        }
      }
      return counts;
    },
    enabled: !!accessToken,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiInsert("cohorts", {
        name: form.name,
        start_date: new Date(form.startDate).toISOString(),
        end_date: new Date(form.endDate).toISOString(),
        status: "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cohorts"] });
      setDialogOpen(false);
      setForm(defaultForm);
      toast.success("Cohort created");
    },
    onError: () => toast.error("Failed to create cohort"),
  });

  const archiveMutation = useMutation({
    mutationFn: (cohortId: string) =>
      apiUpdate("cohorts", { status: "archived" }, { id: cohortId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cohorts"] });
      toast.success("Cohort archived");
    },
    onError: () => toast.error("Failed to archive cohort"),
  });

  const openCreate = () => {
    setForm(defaultForm);
    setTouched({});
    setDialogOpen(true);
  };

  const isActive = (cohort: Record<string, unknown>): boolean => {
    return (cohort.status as string) !== "archived";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Cohorts</h1>
          <p className="text-muted-foreground">Manage student cohorts and track progress</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Cohort
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load cohorts</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Could not fetch cohorts. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : cohorts && cohorts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((cohort) => {
            const id = cohort.id as string;
            const name = cohort.name as string;
            const startDate = cohort.start_date as string;
            const endDate = cohort.end_date as string;
            const studentCount = cohortStudentCounts?.[id] || 0;
            const active = isActive(cohort);
            const daysLeft = getDaysRemaining(endDate);

            return (
              <Card
                key={id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate({ to: "/admin/cohorts/$id", params: { id } })}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{name}</CardTitle>
                    <Badge variant={active ? "default" : "secondary"}>
                      {active ? "Active" : "Archived"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateRange(startDate, endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {studentCount} student{studentCount !== 1 ? "s" : ""}
                    </div>
                    {active && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${daysLeft <= 0 ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {daysLeft > 0 ? `${daysLeft}d remaining` : "Ended"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveMutation.mutate(id);
                          }}
                          disabled={archiveMutation.isPending}
                        >
                          <Archive className="mr-1 h-3 w-3" />
                          Archive
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No cohorts found. Create your first cohort to start grouping students.
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Cohort</DialogTitle>
            <DialogDescription>Create a new student cohort with a date range</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => setTouched({ ...touched, name: true })}
                placeholder="e.g. Spring 2026 Cohort"
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                onBlur={() => setTouched({ ...touched, startDate: true })}
                className={formErrors.startDate ? "border-destructive" : ""}
              />
              {formErrors.startDate && (
                <p className="text-xs text-destructive mt-1">{formErrors.startDate}</p>
              )}
            </div>
            <div>
              <Label>End Date *</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                onBlur={() => setTouched({ ...touched, endDate: true })}
                className={formErrors.endDate ? "border-destructive" : ""}
              />
              {formErrors.endDate && (
                <p className="text-xs text-destructive mt-1">{formErrors.endDate}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!isFormValid || createMutation.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
