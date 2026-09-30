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
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/admin/scholarships/dev3pack-rust")({
  component: AdminPage,
});

type Application = Record<string, any>;

const STATUSES = ["pending", "shortlisted", "selected", "waitlisted", "rejected"];

// Every applicant answer, grouped the way the form asks them.
const SECTIONS: { title: string; fields: [key: string, label: string][] }[] = [
  {
    title: "Personal",
    fields: [
      ["full_name", "Full name"],
      ["email", "Email"],
      ["phone_whatsapp", "Phone (WhatsApp)"],
      ["telegram_handle", "Telegram"],
      ["department", "Department"],
      ["level", "Level"],
      ["gender", "Gender"],
    ],
  },
  {
    title: "Background",
    fields: [
      ["github_url", "GitHub"],
      ["social_url", "X / Twitter"],
      ["club_member", "Club member"],
      ["programming_experience", "Programming experience"],
      ["rust_experience", "Rust experience"],
      ["built_description", "Something they built"],
      ["built_link", "Link to what they built"],
    ],
  },
  {
    title: "Motivation",
    fields: [
      ["motivation", "Why this scholarship"],
      ["hard_learning", "Learning something hard"],
      ["goal_by_end_nov", "Goal by end of November"],
      ["want_to_build", "Something they would like to build"],
    ],
  },
  {
    title: "Availability",
    fields: [
      ["can_attend_full", "Can attend full bootcamp"],
      ["weekly_hours", "Weekly hours"],
      ["has_laptop", "Has laptop"],
      ["internet_quality", "Internet quality"],
    ],
  },
  {
    title: "Give back & declarations",
    fields: [
      ["giveback_plan", "Give-back plan"],
      ["accuracy_confirmed", "Info is accurate"],
      ["seat_forfeit_ack", "Understands seat forfeit"],
      ["data_consent", "Data consent"],
      ["created_at", "Submitted"],
    ],
  },
];

// Rubric from docs/dev3pack-rust-scholarship-kit.md; total_score is computed by the DB.
const RUBRIC: [key: string, label: string][] = [
  ["score_commitment", "Commitment (25%)"],
  ["score_motivation", "Motivation (20%)"],
  ["score_evidence", "Evidence of effort (20%)"],
  ["score_community", "Community involvement (15%)"],
  ["score_potential", "Potential to learn (10%)"],
  ["score_giveback", "Give-back plan (10%)"],
];

function formatValue(key: string, v: unknown) {
  if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.join(", ");
  if (key === "created_at") return new Date(String(v)).toLocaleString();
  return ENUM_KEYS.has(key) ? String(v).replace(/_/g, " ") : String(v);
}

// Dropdown answers stored as snake_case values ("a_little", "15_plus").
const ENUM_KEYS = new Set([
  "programming_experience",
  "rust_experience",
  "can_attend_full",
  "weekly_hours",
  "has_laptop",
  "internet_quality",
]);

function ApplicationSheet({
  app,
  onClose,
  onSave,
  saving,
}: {
  app: Application | null;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [notes, setNotes] = useState<string | null>(null);
  if (!app) return null;
  const notesValue = notes ?? app.reviewer_notes ?? "";

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          setNotes(null);
          onClose();
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{app.full_name}</SheetTitle>
          <SheetDescription>
            {app.email} · Score {app.total_score != null ? Number(app.total_score).toFixed(1) : "-"}
            /100
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {section.title}
              </h3>
              <dl className="space-y-3">
                {section.fields.map(([key, label]) => {
                  const value = formatValue(key, app[key]);
                  const isLink = typeof app[key] === "string" && /^https?:\/\//.test(app[key]);
                  return (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-sm whitespace-pre-wrap break-words">
                        {value == null ? (
                          <span className="text-muted-foreground">Not provided</span>
                        ) : isLink ? (
                          <a
                            href={app[key]}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-primary"
                          >
                            {app[key]}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}

          <section className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Review
            </h3>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">Status</span>
              <Select value={app.status} onValueChange={(v) => onSave({ status: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {RUBRIC.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-sm">{label}</span>
                <Select
                  value={app[key] == null ? "none" : String(app[key])}
                  onValueChange={(v) => onSave({ [key]: v === "none" ? null : Number(v) })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="space-y-2">
              <span className="text-sm">Reviewer notes</span>
              <Textarea
                value={notesValue}
                maxLength={2000}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                size="sm"
                disabled={saving || notes == null}
                onClick={() => onSave({ reviewer_notes: notesValue || null })}
              >
                Save notes
              </Button>
            </div>
            {app.reviewed_at && (
              <p className="text-xs text-muted-foreground">
                Last reviewed {new Date(app.reviewed_at).toLocaleString()}
              </p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AdminPage() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["scholarship-apps"],
    queryFn: () => listScholarshipApplications({ data: { accessToken: accessToken! } }),
    enabled: !!accessToken,
  });

  const updateScore = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) =>
      updateScholarshipApplication({ data: { accessToken: accessToken!, id, patch } }),
    onSuccess: () => {
      toast.success("Saved");
      return qc.invalidateQueries({ queryKey: ["scholarship-apps"] });
    },
    onError: (err: any) => toast.error(err.message || "Update failed"),
  });

  const openApp = data?.find((d) => d.id === openId) ?? null;

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
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr
                key={r.id}
                className="border-b cursor-pointer hover:bg-muted/50"
                onClick={() => setOpenId(r.id)}
              >
                <td className="p-2">{r.full_name}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.department}</td>
                <td className="p-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={r.status}
                    onValueChange={(v) => updateScore.mutate({ id: r.id, patch: { status: v } })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  {r.total_score != null ? Number(r.total_score).toFixed(1) : "-"}
                </td>
                <td className="p-2 text-right">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCount > 15 && <div className="text-red-500">Warning: more than 15 selected</div>}
      <ApplicationSheet
        key={openId ?? "none"}
        app={openApp}
        onClose={() => setOpenId(null)}
        saving={updateScore.isPending}
        onSave={(patch) => openApp && updateScore.mutate({ id: openApp.id, patch })}
      />
    </PageShell>
  );
}
