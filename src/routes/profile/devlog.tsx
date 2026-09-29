import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Flame } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery, apiInsert, apiUpdate, apiDelete } from "@/lib/api-client";

export const Route = createFileRoute("/profile/devlog")({
  head: () => ({
    meta: [
      { title: "My DEVLOG | BlockchainClub FUTMinna" },
      { name: "description", content: "Manage your weekly development log." },
    ],
  }),
  component: DevlogPage,
});

interface DevlogEntry {
  id: string;
  user_id: string;
  week_number: number;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const TOTAL_WEEKS = 24;

function computeStreaks(entries: DevlogEntry[]) {
  const publishedWeeks = entries
    .filter((e) => e.is_published)
    .map((e) => e.week_number)
    .sort((a, b) => a - b);

  if (publishedWeeks.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let currentRun = 1;
  for (let i = 1; i < publishedWeeks.length; i++) {
    if (publishedWeeks[i] === publishedWeeks[i - 1] + 1) {
      currentRun++;
    } else {
      if (currentRun > longest) longest = currentRun;
      currentRun = 1;
    }
  }
  if (currentRun > longest) longest = currentRun;

  const maxWeek = publishedWeeks[publishedWeeks.length - 1];
  let current = 0;
  for (let w = maxWeek; w > 0; w--) {
    if (publishedWeeks.includes(w)) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest };
}

function DevlogPage() {
  const { user, accessToken } = useAuthStore();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DevlogEntry | null>(null);
  const [content, setContent] = useState("");
  const [weekNumber, setWeekNumber] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const entriesQueryKey = ["devlog_entries", userId];

  const { data: entries = [], isLoading } = useQuery({
    queryKey: entriesQueryKey,
    queryFn: async () => {
      const result = await apiQuery("devlog_entries", {
        filters: { user_id: userId },
        order: { column: "week_number", ascending: true },
      });
      return (result.data || []) as DevlogEntry[];
    },
    enabled: !!userId,
  });

  const entryByWeek = new Map<number, DevlogEntry>();
  entries.forEach((e) => entryByWeek.set(e.week_number, e));

  const { current: currentStreak, longest: longestStreak } = computeStreaks(entries);

  function getNextEmptyWeek() {
    const existingWeeks = new Set(entries.map((e) => e.week_number));
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      if (!existingWeeks.has(w)) return w;
    }
    return entries.length > 0 ? Math.max(...entries.map((e) => e.week_number)) + 1 : 1;
  }

  function openCreateModal(targetWeek?: number) {
    setEditingEntry(null);
    setWeekNumber(targetWeek ?? getNextEmptyWeek());
    setContent("");
    setIsPublished(false);
    setIsModalOpen(true);
  }

  function openEditModal(entry: DevlogEntry) {
    setEditingEntry(entry);
    setWeekNumber(entry.week_number);
    setContent(entry.content || "");
    setIsPublished(entry.is_published || false);
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!userId) return;
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    setIsSaving(true);
    try {
      if (editingEntry) {
        await apiUpdate(
          "devlog_entries",
          { content, is_published: isPublished, updated_at: new Date().toISOString() },
          { id: editingEntry.id }
        );
        toast.success("Entry updated");
      } else {
        const res = await fetch("/api/devlog", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            week_number: weekNumber,
            content,
            is_published: isPublished,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to create entry");
        toast.success("Entry created");
      }
      queryClient.invalidateQueries({ queryKey: entriesQueryKey });
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingEntry) return;
    try {
      await apiDelete("devlog_entries", { id: editingEntry.id });
      toast.success("Entry deleted");
      queryClient.invalidateQueries({ queryKey: entriesQueryKey });
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  if (isLoading) {
    return <DevlogSkeleton />;
  }

  const weeks = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">My DEVLOG</h1>
        <div className="flex items-center gap-3">
          {currentStreak > 0 && (
            <Badge variant="secondary" className="gap-1 text-sm px-3 py-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              {currentStreak}-week streak
            </Badge>
          )}
          {longestStreak > 0 && (
            <span className="text-xs text-muted-foreground">
              Longest: {longestStreak}w
            </span>
          )}
          <Button onClick={() => openCreateModal()} size="sm">
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {weeks.map((week) => {
          const entry = entryByWeek.get(week);
          const borderColor = entry
            ? entry.is_published
              ? "border-green-500/50"
              : "border-yellow-500/50"
            : "border-border opacity-50";

          return (
            <Card
              key={week}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${borderColor}`}
              onClick={() => {
                if (entry) {
                  openEditModal(entry);
                } else {
                  openCreateModal(week);
                }
              }}
            >
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Week {week}
                  {entry?.is_published && <Flame className="h-3 w-3 text-orange-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                {entry ? (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {entry.content.slice(0, 100)}
                      {entry.content.length > 100 ? "..." : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">No entry yet</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? `Edit Week ${weekNumber}` : `New Entry for Week ${weekNumber}`}
            </DialogTitle>
            <DialogDescription>
              Write your weekly DEVLOG entry in Markdown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="week-number" className="text-sm font-medium">
                Week Number
              </label>
              <Input
                id="week-number"
                type="number"
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                min={1}
                disabled={!!editingEntry}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your weekly log in Markdown..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="publish" className="text-sm font-medium cursor-pointer">
                Publish
              </label>
              <Switch
                id="publish"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {editingEntry && (
                <Button variant="destructive" onClick={handleDelete} size="sm">
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DevlogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}


