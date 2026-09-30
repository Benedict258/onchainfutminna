import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery, apiUpdate, apiDelete, apiAward } from "@/lib/api-client";
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
import { Check, X, Star, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/projects")({
  component: AdminProjects,
});

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function AdminProjects() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deleteItem, setDeleteItem] = useState<Record<string, unknown> | null>(null);
  const [page, setPage] = useState(1);

  const statusParam = statusFilter === "ALL" ? undefined : statusFilter;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-projects", statusFilter, page],
    queryFn: async () => {
      const filters: Record<string, any> = {};
      if (statusParam) filters.status = statusParam;
      const from = (page - 1) * 20;
      const res = await apiQuery("projects", {
        select:
          "*,project_members(*,users(id,profiles(full_name,avatar_url))),project_tags(*,tags(id,name))",
        filters,
        order: { column: "created_at", ascending: false },
        range: [from, from + 19],
        count: "exact",
      });
      return {
        projects: res.data || [],
        total: res.count || 0,
        page,
        limit: 20,
        totalPages: Math.ceil((res.count || 0) / 20),
      };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiUpdate("projects", { status: "APPROVED" }, { id }),
    onSuccess: async (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project approved");
      try {
        await apiAward("project-approved", id);
      } catch {}
    },
    onError: () => toast.error("Failed to approve project"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiUpdate("projects", { status: "REJECTED" }, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project rejected");
    },
    onError: () => toast.error("Failed to reject project"),
  });

  const featureMutation = useMutation({
    mutationFn: (variables: { id: string; isFeatured: boolean }) =>
      apiUpdate("projects", { is_featured: variables.isFeatured }, { id: variables.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project updated");
    },
    onError: () => toast.error("Failed to update project"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete("projects", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      setDeleteItem(null);
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg">Projects</h1>
        <p className="text-muted-foreground">Review and manage submitted projects</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <Button
            key={f}
            variant={statusFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Builders</TableHead>
              <TableHead>Ecosystem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load projects</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Could not fetch projects. Please try again.</span>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : data?.projects && data.projects.length > 0 ? (
              data.projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {project.name}
                      {project.github_url && (
                        <a
                          href={project.github_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {project.project_members
                        ?.slice(0, 3)
                        .map((member: Record<string, unknown>) => {
                          const users = member.users as Record<string, unknown>;
                          const profiles = users?.profiles as Record<string, unknown> | undefined;
                          return (
                            <div
                              key={users?.id as string}
                              className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-background"
                              title={(profiles?.full_name as string) || "Unknown"}
                            >
                              {profiles?.full_name
                                ? (profiles.full_name as string)
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                : "?"}
                            </div>
                          );
                        })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.ecosystem}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status as string)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {project.status === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => approveMutation.mutate(project.id as string)}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => rejectMutation.mutate(project.id as string)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          featureMutation.mutate({
                            id: project.id as string,
                            isFeatured: !(project.is_featured as boolean),
                          })
                        }
                      >
                        <Star
                          className={`h-4 w-4 ${
                            project.is_featured
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteItem(project)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No projects found
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
            {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => {
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.name as string}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteItem?.id as string)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
