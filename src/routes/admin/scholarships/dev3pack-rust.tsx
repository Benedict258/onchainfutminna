import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listScholarshipApplications,
  updateScholarshipApplication,
} from "@/lib/api/scholarship.server";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/admin/scholarships/dev3pack-rust")({
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["scholarship-apps"],
    queryFn: () => listScholarshipApplications({ data: { accessToken: accessToken! } }),
    enabled: !!accessToken,
  });

  const updateScore = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) =>
      updateScholarshipApplication({ data: { accessToken: accessToken!, id, patch } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scholarship-apps"] }),
    onError: (err: any) => toast.error(err.message || "Update failed"),
  });

  const q = search.trim().toLowerCase();
  const rows = q
    ? data?.filter(
        (r) => r.full_name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q),
      )
    : data;

  const exportCSV = () => {
    if (!data) return;
    const headers = Object.keys(data[0] || {});
    const rows = data.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          const s = v == null ? "" : String(v);
          if (/^[=+\-@]/.test(s)) return "'" + s;
          return '"' + s.replace(/"/g, '""') + '"';
        })
        .join(","),
    );
    const csv = "\ufeff" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dev3pack-rust-scholarship-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
  };

  const selectedCount = data?.filter((d) => d.status === "selected").length || 0;

  return (
    <PageShell className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dev3pack Rust Scholarship Admin</h1>
        <div className="flex gap-2">
          <span>Selected: {selectedCount}/15</span>
          <Button onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>
      <Input
        placeholder="Search name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading && <p className="text-sm text-muted-foreground">Loading applications…</p>}
      {error && <p className="text-sm text-red-500">{(error as Error).message}</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      )}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Dept</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.full_name}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.department}</td>
                <td className="p-2">
                  <Select
                    value={r.status}
                    onValueChange={(v) => updateScore.mutate({ id: r.id, patch: { status: v } })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["pending", "shortlisted", "selected", "waitlisted", "rejected"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">{r.total_score?.toFixed(1) || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCount > 15 && <div className="text-red-500">Warning: more than 15 selected</div>}
    </PageShell>
  );
}
