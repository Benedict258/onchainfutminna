import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoginPrompt } from "@/components/login-prompt";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trophy,
  Users,
  User,
  UserPlus,
  MoreVertical,
  ExternalLink,
  Github,
  Globe,
  Send,
  Code,
  Palette,
  Presentation,
  Crown,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  apiQueryAll,
  apiQuerySingle,
  apiInsert,
  apiUpdate,
  apiDelete,
} from "@/lib/api-client";

export const Route = createFileRoute("/hackathons/$teamId")({
  head: () => ({
    meta: [
      { title: "Team Details | BlockchainClub FUTMinna" },
      { name: "description", content: "Hackathon team details and management." },
    ],
  }),
  component: TeamDetailPage,
});

const TEAM_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  forming: { label: "Forming", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  building: { label: "Building", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  submitted: { label: "Submitted", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  won: { label: "Won", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

const ROLES = [
  { value: "captain", label: "Captain", icon: Crown },
  { value: "developer", label: "Developer", icon: Code },
  { value: "designer", label: "Designer", icon: Palette },
  { value: "presenter", label: "Presenter", icon: Presentation },
] as const;

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  captain: { label: "Captain", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  developer: { label: "Developer", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  designer: { label: "Designer", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  presenter: { label: "Presenter", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

function TeamDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 rounded-xl md:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

function TeamDetailPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  if (!isAuthenticated) return <LoginPrompt />;

  return <TeamDetailContent userId={user!.id} />;
}

function TeamDetailContent({ userId }: { userId: string }) {
  const params = Route.useParams();
  const teamId = params.teamId;
  const queryClient = useQueryClient();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [repoLink, setRepoLink] = useState("");
  const [demoLink, setDemoLink] = useState("");

  const { data: team, isLoading } = useQuery({
    queryKey: ["hackathon-team", teamId],
    queryFn: async () => {
      const t = await apiQuerySingle("hackathon_teams", {
        filters: { id: teamId },
      });
      if (!t) return null;

      const [hackathon, members] = await Promise.all([
        apiQuerySingle("opportunities", { filters: { id: t.hackathon_id } }),
        apiQueryAll("hackathon_team_members", {
          filters: { team_id: teamId },
        }),
      ]);

      return {
        ...t,
        hackathon: hackathon || null,
        members: members || [],
      } as TeamDetail;
    },
  });

  const isCaptain = team?.captain_id === userId;
  const statusConfig = team ? (TEAM_STATUS_CONFIG[team.status] || TEAM_STATUS_CONFIG.forming) : null;

  function getInitials(name?: string) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleInvite() {
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      const users = await apiQueryAll("profiles", {
        filters: { username: inviteUsername.trim() },
        single: true,
      });
      const targetUser = Array.isArray(users) ? users[0] : users;
      if (!targetUser) {
        toast.error("User not found.");
        setInviting(false);
        return;
      }

      const existingMembers = await apiQueryAll("hackathon_team_members", {
        filters: { team_id: teamId, user_id: targetUser.id },
      });
      if (existingMembers && existingMembers.length > 0) {
        toast.error("User is already a member of this team.");
        setInviting(false);
        return;
      }

      await apiInsert("hackathon_team_members", {
        team_id: teamId,
        user_id: targetUser.id,
        role: "developer",
      });
      toast.success(`Invited ${targetUser.username || targetUser.full_name || "member"}!`);
      queryClient.invalidateQueries({ queryKey: ["hackathon-team", teamId] });
      setShowInvite(false);
      setInviteUsername("");
    } catch (e: any) {
      toast.error(e.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      await apiUpdate("hackathon_team_members", { role: newRole }, { id: memberId });
      toast.success("Role updated.");
      queryClient.invalidateQueries({ queryKey: ["hackathon-team", teamId] });
    } catch (e: any) {
      toast.error(e.message || "Failed to change role");
    } finally {
      setChangingRole(null);
    }
  }

  async function handleKick(memberId: string, memberUserId: string, memberRole: string) {
    if (memberRole === "captain") {
      toast.error("Cannot kick the captain.");
      return;
    }
    try {
      await apiDelete("hackathon_team_members", { id: memberId });
      toast.success("Member removed.");
      queryClient.invalidateQueries({ queryKey: ["hackathon-team", teamId] });
    } catch (e: any) {
      toast.error(e.message || "Failed to remove member");
    }
  }

  async function handleSubmitProject() {
    setSubmitting(true);
    try {
      await apiUpdate("hackathon_teams", { status: "submitted" }, { id: teamId });
      toast.success("Project submitted! Good luck in the hackathon!");
      queryClient.invalidateQueries({ queryKey: ["hackathon-team", teamId] });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit project");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveProject() {
    try {
      await apiUpdate(
        "hackathon_teams",
        { repo_link: repoLink || null, demo_link: demoLink || null },
        { id: teamId }
      );
      toast.success("Project links updated.");
      queryClient.invalidateQueries({ queryKey: ["hackathon-team", teamId] });
      setEditingProject(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update project info");
    }
  }

  if (isLoading) return <TeamDetailSkeleton />;

  if (!team) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-lg text-muted-foreground">Team not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/hackathons">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Teams
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link to="/hackathons">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Hackathons
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-display-sm md:text-3xl tracking-tight">{team.name}</h1>
        {statusConfig && (
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        )}
      </div>

      {team.hackathon && (
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 text-primary" />
          <span>{team.hackathon.title}</span>
          {team.hackathon.prize && (
            <span className="text-emerald-400">({team.hackathon.prize} prize pool)</span>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-headline-sm flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({team.members?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.members?.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.developer;
                const isMemberCaptain = member.role === "captain";
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-low p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {getInitials(member.full_name || member.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.full_name || member.username || member.user_id}
                          {member.user_id === userId && (
                            <span className="text-muted-foreground text-xs ml-1">(you)</span>
                          )}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] mt-0.5 ${roleConfig.className}`}
                        >
                          {isMemberCaptain && <Crown className="mr-0.5 h-3 w-3" />}
                          {roleConfig.label}
                        </Badge>
                      </div>
                    </div>

                    {isCaptain && member.user_id !== userId && (
                      <div className="flex items-center gap-1">
                        <Select
                          value={member.role}
                          onValueChange={(role) => handleChangeRole(member.id, role)}
                        >
                          <SelectTrigger className="h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.filter((r) => r.value !== "captain").map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleKick(member.id, member.user_id, member.role)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {isCaptain && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setShowInvite(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-headline-sm">Project Info</CardTitle>
              {isCaptain && !editingProject && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setRepoLink(team.repo_link || "");
                  setDemoLink(team.demo_link || "");
                  setEditingProject(true);
                }}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {team.project_description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{team.project_description}</p>
                </div>
              )}

              {editingProject ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Repository Link</label>
                    <Input
                      placeholder="https://github.com/username/repo"
                      value={repoLink}
                      onChange={(e) => setRepoLink(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Demo Link</label>
                    <Input
                      placeholder="https://your-demo.vercel.app"
                      value={demoLink}
                      onChange={(e) => setDemoLink(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProject}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingProject(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {team.repo_link ? (
                    <a
                      href={team.repo_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      Repository
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">No repository linked yet.</p>
                  )}
                  {team.demo_link ? (
                    <div>
                      <a
                        href={team.demo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Demo
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No demo linked yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {team.status === "won" && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-5 text-center">
                <Trophy className="mx-auto h-10 w-10 text-yellow-400" />
                <h3 className="mt-3 text-lg font-bold text-yellow-400">Winner!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This team won the hackathon!
                </p>
              </CardContent>
            </Card>
          )}

          {isCaptain && team.status !== "submitted" && team.status !== "won" && (
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <h3 className="text-headline-sm mb-3">Submission</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ready to submit? Make sure your repo and demo links are updated.
                </p>
                <Button
                  className="w-full"
                  onClick={handleSubmitProject}
                  disabled={submitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Project"}
                </Button>
              </CardContent>
            </Card>
          )}

          {team.status === "submitted" && (
            <Card className="border-border bg-card">
              <CardContent className="p-5 text-center">
                <Send className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-emerald-400">Project Submitted</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Good luck in the hackathon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Search for a member by their username to add them to the team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="Enter username..."
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteUsername.trim()}>
              {inviting ? "Inviting..." : "Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TeamDetail {
  id: string;
  name: string;
  hackathon_id: string;
  captain_id: string;
  project_description?: string;
  repo_link?: string;
  demo_link?: string;
  status: string;
  hackathon: any;
  members: TeamMemberDetail[];
}

interface TeamMemberDetail {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
}


