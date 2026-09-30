import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  apiQuery,
  apiQueryAll,
  apiQuerySingle,
  apiInsert,
  apiUpdate,
  apiDelete,
} from "@/lib/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, BookOpen, Layers, FileText, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/learn")({
  component: AdminLearn,
});

type Ecosystem = "EVM" | "SUI_MOVE" | "APTOS_MOVE" | "SOLANA_RUST" | "GENERAL";
type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const ECOSYSTEMS: Ecosystem[] = ["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"];
const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

interface TrackForm {
  title: string;
  description: string;
  ecosystem: string;
  difficulty: string;
  iconUrl: string;
  isPublished: boolean;
  order: number;
}

const defaultTrackForm: TrackForm = {
  title: "",
  description: "",
  ecosystem: "GENERAL",
  difficulty: "BEGINNER",
  iconUrl: "",
  isPublished: false,
  order: 0,
};

interface ModuleForm {
  trackId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  isPublished: boolean;
}

const defaultModuleForm: ModuleForm = {
  trackId: "",
  title: "",
  description: "",
  content: "",
  order: 0,
  isPublished: false,
};

interface ResourceForm {
  title: string;
  url: string;
  type: string;
  ecosystem: string;
  isPublished: boolean;
}

const defaultResourceForm: ResourceForm = {
  title: "",
  url: "",
  type: "",
  ecosystem: "GENERAL",
  isPublished: false,
};

function AdminLearn() {
  const queryClient = useQueryClient();

  // Track state
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [editTrack, setEditTrack] = useState<Record<string, unknown> | null>(null);
  const [trackForm, setTrackForm] = useState<TrackForm>(defaultTrackForm);

  // Module state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editModule, setEditModule] = useState<Record<string, unknown> | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(defaultModuleForm);

  // Resource state
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [editResource, setEditResource] = useState<Record<string, unknown> | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceForm>(defaultResourceForm);
  const [deleteResourceItem, setDeleteResourceItem] = useState<Record<string, unknown> | null>(
    null,
  );

  // Delete states
  const [deleteTrackItem, setDeleteTrackItem] = useState<Record<string, unknown> | null>(null);
  const [deleteModuleItem, setDeleteModuleItem] = useState<Record<string, unknown> | null>(null);

  // Expanded track
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  // Queries
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: () =>
      apiQueryAll("tracks", {
        select: "*,modules(id)",
        order: { column: "order", ascending: true },
      }).then((tracks) =>
        tracks.map((track: any) => ({
          ...track,
          _count: { modules: track.modules?.length || 0 },
          modules: undefined,
        })),
      ),
  });

  const { data: trackDetail } = useQuery({
    queryKey: ["admin-track-detail", expandedTrack],
    queryFn: () =>
      apiQuerySingle("tracks", {
        select: "*,modules(*,quizzes(id,pass_mark,quiz_questions(id)))",
        filters: { id: expandedTrack! },
      }),
    enabled: !!expandedTrack,
  });

  const { data: resources } = useQuery({
    queryKey: ["admin-resources"],
    queryFn: () =>
      apiQueryAll("resources", {
        select: "*",
        order: { column: "created_at", ascending: false },
      }),
  });

  // Track mutations
  const createTrackMutation = useMutation({
    mutationFn: () =>
      apiInsert("tracks", {
        title: trackForm.title,
        description: trackForm.description || undefined,
        ecosystem: trackForm.ecosystem as Ecosystem,
        difficulty: trackForm.difficulty as Difficulty,
        icon_url: trackForm.iconUrl || undefined,
        is_published: trackForm.isPublished,
        order: trackForm.order,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
      setTrackDialogOpen(false);
      setTrackForm(defaultTrackForm);
      toast.success("Track created");
    },
    onError: () => toast.error("Failed to create track"),
  });

  const updateTrackMutation = useMutation({
    mutationFn: () =>
      apiUpdate(
        "tracks",
        {
          title: trackForm.title,
          description: trackForm.description || undefined,
          ecosystem: trackForm.ecosystem as Ecosystem,
          difficulty: trackForm.difficulty as Difficulty,
          icon_url: trackForm.iconUrl || undefined,
          is_published: trackForm.isPublished,
          order: trackForm.order,
        },
        { id: editTrack?.id as string },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
      setTrackDialogOpen(false);
      setEditTrack(null);
      setTrackForm(defaultTrackForm);
      toast.success("Track updated");
    },
    onError: () => toast.error("Failed to update track"),
  });

  // Module mutations
  const createModuleMutation = useMutation({
    mutationFn: () =>
      apiInsert("modules", {
        track_id: moduleForm.trackId,
        title: moduleForm.title,
        description: moduleForm.description || undefined,
        content: moduleForm.content || undefined,
        order: moduleForm.order,
        is_published: moduleForm.isPublished,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-track-detail"] });
      setModuleDialogOpen(false);
      setModuleForm(defaultModuleForm);
      toast.success("Module created");
    },
    onError: () => toast.error("Failed to create module"),
  });

  const updateModuleMutation = useMutation({
    mutationFn: () =>
      apiUpdate(
        "modules",
        {
          title: moduleForm.title,
          description: moduleForm.description || undefined,
          content: moduleForm.content || undefined,
          order: moduleForm.order,
          is_published: moduleForm.isPublished,
        },
        { id: editModule?.id as string },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-track-detail"] });
      setModuleDialogOpen(false);
      setEditModule(null);
      setModuleForm(defaultModuleForm);
      toast.success("Module updated");
    },
    onError: () => toast.error("Failed to update module"),
  });

  // Resource mutations
  const createResourceMutation = useMutation({
    mutationFn: () =>
      apiInsert("resources", {
        title: resourceForm.title,
        url: resourceForm.url,
        type: resourceForm.type || undefined,
        ecosystem: resourceForm.ecosystem as Ecosystem,
        is_published: resourceForm.isPublished,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      setResourceDialogOpen(false);
      setResourceForm(defaultResourceForm);
      toast.success("Resource added");
    },
    onError: () => toast.error("Failed to add resource"),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: () => apiDelete("resources", { id: deleteResourceItem?.id as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      setDeleteResourceItem(null);
      toast.success("Resource deleted");
    },
    onError: () => toast.error("Failed to delete resource"),
  });

  const updateResourceMutation = useMutation({
    mutationFn: () =>
      apiUpdate(
        "resources",
        {
          title: resourceForm.title,
          url: resourceForm.url,
          type: resourceForm.type || undefined,
          ecosystem: resourceForm.ecosystem as Ecosystem,
          is_published: resourceForm.isPublished,
        },
        { id: editResource?.id as string },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      setResourceDialogOpen(false);
      setEditResource(null);
      setResourceForm(defaultResourceForm);
      toast.success("Resource updated");
    },
    onError: () => toast.error("Failed to update resource"),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: () => apiDelete("tracks", { id: deleteTrackItem?.id as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
      setDeleteTrackItem(null);
      setExpandedTrack(null);
      toast.success("Track deleted");
    },
    onError: () => toast.error("Failed to delete track"),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: () => apiDelete("modules", { id: deleteModuleItem?.id as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-track-detail"] });
      setDeleteModuleItem(null);
      toast.success("Module deleted");
    },
    onError: () => toast.error("Failed to delete module"),
  });

  const openCreateTrack = () => {
    setEditTrack(null);
    setTrackForm(defaultTrackForm);
    setTrackDialogOpen(true);
  };

  const openEditTrack = (track: Record<string, unknown>) => {
    setEditTrack(track);
    setTrackForm({
      title: track.title as string,
      description: (track.description as string) || "",
      ecosystem: track.ecosystem as string,
      difficulty: track.difficulty as string,
      iconUrl: (track.icon_url as string) || "",
      isPublished: (track.is_published as boolean) || false,
      order: (track.order as number) || 0,
    });
    setTrackDialogOpen(true);
  };

  const openCreateModule = (trackId: string) => {
    setEditModule(null);
    setModuleForm({ ...defaultModuleForm, trackId });
    setModuleDialogOpen(true);
  };

  const openEditModule = (mod: Record<string, unknown>) => {
    setEditModule(mod);
    setModuleForm({
      trackId: (mod.track_id as string) || "",
      title: mod.title as string,
      description: (mod.description as string) || "",
      content: (mod.content as string) || "",
      order: (mod.order as number) || 0,
      isPublished: (mod.is_published as boolean) || false,
    });
    setModuleDialogOpen(true);
  };

  const openCreateResource = () => {
    setEditResource(null);
    setResourceForm(defaultResourceForm);
    setResourceDialogOpen(true);
  };

  const openEditResource = (resource: Record<string, unknown>) => {
    setEditResource(resource);
    setResourceForm({
      title: resource.title as string,
      url: resource.url as string,
      type: (resource.type as string) || "",
      ecosystem: (resource.ecosystem as string) || "GENERAL",
      isPublished: (resource.is_published as boolean) || false,
    });
    setResourceDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg">Learn</h1>
        <p className="text-muted-foreground">Manage learning tracks, modules, and resources</p>
      </div>

      <Tabs defaultValue="tracks">
        <TabsList>
          <TabsTrigger value="tracks">
            <Layers className="mr-2 h-4 w-4" />
            Tracks
          </TabsTrigger>
          <TabsTrigger value="modules">
            <BookOpen className="mr-2 h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="resources">
            <LinkIcon className="mr-2 h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateTrack}>
              <Plus className="mr-2 h-4 w-4" />
              Create Track
            </Button>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Ecosystem</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tracks && tracks.length > 0 ? (
                  tracks.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell className="font-medium">{track.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{track.ecosystem}</Badge>
                      </TableCell>
                      <TableCell>{track.difficulty}</TableCell>
                      <TableCell>{track._count?.modules || 0}</TableCell>
                      <TableCell>
                        <Badge variant={track.is_published ? "default" : "secondary"}>
                          {track.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedTrack(expandedTrack === track.id ? null : track.id)
                            }
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditTrack(track)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTrackItem(track)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No tracks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Expanded track modules */}
          {expandedTrack && trackDetail && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Modules - {trackDetail.title}</CardTitle>
                <Button size="sm" onClick={() => openCreateModule(expandedTrack)}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Module
                </Button>
              </CardHeader>
              <CardContent>
                {trackDetail.modules && trackDetail.modules.length > 0 ? (
                  <div className="space-y-2">
                    {trackDetail.modules.map((mod: Record<string, unknown>) => (
                      <div
                        key={mod.id as string}
                        className="flex items-center justify-between rounded border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{mod.title as string}</p>
                            <p className="text-xs text-muted-foreground">
                              Order: {mod.order as number}
                            </p>
                          </div>
                          <Badge variant={mod.is_published ? "default" : "secondary"}>
                            {mod.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModule(mod)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteModuleItem(mod)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No modules yet</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Modules Tab (quick overview) */}
        <TabsContent value="modules" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a track above and click the modules icon to manage its modules.
          </p>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateResource}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ecosystem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources && resources.length > 0 ? (
                  resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {resource.type || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{resource.ecosystem}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resource.is_published ? "default" : "secondary"}>
                          {resource.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditResource(resource)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteResourceItem(resource)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No resources found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Track Dialog */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTrack ? "Edit Track" : "Create Track"}</DialogTitle>
            <DialogDescription>
              {editTrack ? "Update track details" : "Add a new learning track"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={trackForm.title}
                onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                placeholder="Track title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={trackForm.description}
                onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ecosystem</Label>
                <Select
                  value={trackForm.ecosystem}
                  onValueChange={(v) => setTrackForm({ ...trackForm, ecosystem: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ECOSYSTEMS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={trackForm.difficulty}
                  onValueChange={(v) => setTrackForm({ ...trackForm, difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Icon URL</Label>
              <Input
                value={trackForm.iconUrl}
                onChange={(e) => setTrackForm({ ...trackForm, iconUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={trackForm.order}
                  onChange={(e) =>
                    setTrackForm({ ...trackForm, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={trackForm.isPublished}
                  onCheckedChange={(v) => setTrackForm({ ...trackForm, isPublished: v })}
                />
                <Label>Published</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTrackDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editTrack ? updateTrackMutation.mutate() : createTrackMutation.mutate()
                }
                disabled={!trackForm.title}
              >
                {editTrack ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editModule ? "Edit Module" : "Create Module"}</DialogTitle>
            <DialogDescription>
              {editModule ? "Update module details" : "Add a new module"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editModule && (
              <div>
                <Label>Track</Label>
                <Select
                  value={moduleForm.trackId}
                  onValueChange={(v) => setModuleForm({ ...moduleForm, trackId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a track" />
                  </SelectTrigger>
                  <SelectContent>
                    {(tracks || []).map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editModule && (
              <div>
                <Label>Track</Label>
                <Input
                  value={
                    (tracks || []).find(
                      (t) => t.id === ((editModule?.track_id as string) || moduleForm.trackId),
                    )?.title || moduleForm.trackId
                  }
                  disabled
                />
              </div>
            )}
            <div>
              <Label>Title *</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="Module title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Content (Markdown)</Label>
              <Textarea
                value={moduleForm.content}
                onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                rows={6}
                placeholder="Module content..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={moduleForm.order}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={moduleForm.isPublished}
                  onCheckedChange={(v) => setModuleForm({ ...moduleForm, isPublished: v })}
                />
                <Label>Published</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editModule ? updateModuleMutation.mutate() : createModuleMutation.mutate()
                }
                disabled={!moduleForm.title || !moduleForm.trackId}
              >
                {editModule ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
            <DialogDescription>
              {editResource ? "Update resource details" : "Add a learning resource"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                placeholder="Resource title"
              />
            </div>
            <div>
              <Label>URL *</Label>
              <Input
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Input
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  placeholder="e.g. Article, Video"
                />
              </div>
              <div>
                <Label>Ecosystem</Label>
                <Select
                  value={resourceForm.ecosystem}
                  onValueChange={(v) => setResourceForm({ ...resourceForm, ecosystem: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ECOSYSTEMS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={resourceForm.isPublished}
                onCheckedChange={(v) => setResourceForm({ ...resourceForm, isPublished: v })}
              />
              <Label>Published</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResourceDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editResource ? updateResourceMutation.mutate() : createResourceMutation.mutate()
                }
                disabled={!resourceForm.title || !resourceForm.url}
              >
                {editResource ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirmation */}
      <AlertDialog open={!!deleteResourceItem} onOpenChange={() => setDeleteResourceItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteResourceItem?.title as string}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteResourceMutation.mutate()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Track Confirmation */}
      <AlertDialog open={!!deleteTrackItem} onOpenChange={() => setDeleteTrackItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTrackItem?.title as string}&quot;? This
              will also delete all modules in this track.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTrackMutation.mutate()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Module Confirmation */}
      <AlertDialog open={!!deleteModuleItem} onOpenChange={() => setDeleteModuleItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteModuleItem?.title as string}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteModuleMutation.mutate()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
