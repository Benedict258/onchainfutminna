import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery, apiInsert, apiDelete } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, Target, Send, LogOut, UserPlus, Crown, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/squads/$squadId")({
  component: SquadDetailPage,
});

const TRACK_COLORS: Record<string, string> = {
  EVM: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
  SUI_MOVE: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
  APTOS_MOVE: "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30",
  SOLANA_RUST: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
  GENERAL: "bg-muted text-muted-foreground hover:bg-muted/80",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SquadDetailPage() {
  const { squadId } = Route.useParams();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [invitingUser, setInvitingUser] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: squad, isLoading: squadLoading } = useQuery({
    queryKey: ["squad", squadId],
    queryFn: async () => {
      const rows = await apiQuery("squads", {
        select: "id,name,description,track,goal,creator_id,created_at",
        filters: { id: squadId },
        single: true,
      });
      return (rows.data || null) as Record<string, unknown> | null;
    },
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["squad-members", squadId],
    queryFn: async () => {
      const res = await apiQuery("squad_members", {
        select: "id,user_id,role,joined_at",
        filters: { squad_id: squadId },
        order: { column: "joined_at", ascending: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: memberProfiles } = useQuery({
    queryKey: ["squad-member-profiles", squadId],
    queryFn: async () => {
      const res = await apiQuery("profiles", {
        select: "user_id,full_name,avatar_url,department",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!members && members.length > 0,
  });

  const { data: messages, isLoading: msgsLoading } = useQuery({
    queryKey: ["squad-messages", squadId],
    queryFn: async () => {
      const res = await apiQuery("squad_messages", {
        select: "id,squad_id,sender_id,text,created_at",
        filters: { squad_id: squadId },
        order: { column: "created_at", ascending: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    refetchInterval: 5000,
  });

  const { data: allModules } = useQuery({
    queryKey: ["modules-all"],
    queryFn: async () => {
      const res = await apiQuery("modules", {
        select: "id,title,track_id",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: allProgress } = useQuery({
    queryKey: ["squad-progress", squadId],
    queryFn: async () => {
      if (!members || members.length === 0) return [];
      const res = await apiQuery("user_module_progress", {
        select: "user_id,module_id",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!members && members.length > 0,
  });

  const { data: inviteResults } = useQuery({
    queryKey: ["invite-search", inviteSearch],
    queryFn: async () => {
      if (!inviteSearch || inviteSearch.length < 2) return [];
      const res = await apiQuery("profiles", {
        select: "user_id,full_name,avatar_url,username",
        filters: { username: inviteSearch },
        limit: 5,
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: inviteSearch.length >= 2,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const profileMap = new Map<string, Record<string, unknown>>();
  if (memberProfiles) {
    for (const p of memberProfiles) {
      profileMap.set(p.user_id as string, p);
    }
  }

  const isMember = members?.some((m) => m.user_id === user?.id) ?? false;
  const isCreator = squad?.creator_id === user?.id;
  const memberIds = new Set(members?.map((m) => m.user_id as string) || []);

  const progressByUser = new Map<string, Set<string>>();
  if (allProgress) {
    for (const p of allProgress) {
      const uid = p.user_id as string;
      if (!memberIds.has(uid)) continue;
      if (!progressByUser.has(uid)) progressByUser.set(uid, new Set());
      progressByUser.get(uid)!.add(p.module_id as string);
    }
  }

  const totalModules = (allModules || []).length;

  const sendMessage = async () => {
    if (!messageText.trim() || !user) return;
    setSending(true);
    try {
      await apiInsert("squad_messages", {
        squad_id: squadId,
        sender_id: user.id,
        text: messageText.trim(),
        created_at: new Date().toISOString(),
      });
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["squad-messages", squadId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setLeaving(true);
    try {
      const memberRow = members?.find((m) => m.user_id === user.id);
      if (memberRow) {
        await apiDelete("squad_members", { id: memberRow.id as string });
      }
      queryClient.invalidateQueries({ queryKey: ["squad-members", squadId] });
      queryClient.invalidateQueries({ queryKey: ["squad-members-all"] });
      toast.success("Left the squad");
      setLeaveConfirmOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to leave squad");
    } finally {
      setLeaving(false);
    }
  };

  const handleInvite = async (inviteeId: string) => {
    setInvitingUser(inviteeId);
    try {
      await apiInsert("squad_members", {
        squad_id: squadId,
        user_id: inviteeId,
        role: "member",
        joined_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["squad-members", squadId] });
      queryClient.invalidateQueries({ queryKey: ["squad-members-all"] });
      toast.success("Member invited!");
      setInviteOpen(false);
      setInviteSearch("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setInvitingUser(null);
    }
  };

  if (squadLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Squad not found</p>
        <Button variant="link" onClick={() => navigate({ to: "/squads" })}>
          Back to squads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-headline-lg">{(squad.name as string) || "Squad"}</h1>
            <Badge className={TRACK_COLORS[squad.track as string] || TRACK_COLORS.GENERAL}>
              {(squad.track as string)?.replace("_", " ") || "General"}
            </Badge>
            {profileMap.get(squad.creator_id as string) && (
              <Badge variant="outline" className="gap-1">
                <Crown className="h-3 w-3" />
                Created by {profileMap.get(squad.creator_id as string)?.full_name as string}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{(squad.description as string) || ""}</p>
        </div>
        {isAuthenticated && isMember && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </Button>
            {!isCreator && (
              <Button variant="destructive" onClick={() => setLeaveConfirmOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </Button>
            )}
          </div>
        )}
        {isAuthenticated && !isMember && (
          <Button onClick={() => handleInvite(user!.id)}>Join Squad</Button>
        )}
      </div>

      {(squad.goal as string) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Squad Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{squad.goal as string}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({members?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {members?.map((m) => {
                    const prof = profileMap.get(m.user_id as string);
                    const name = (prof?.full_name as string) || "Unknown";
                    const avatarUrl = (prof?.avatar_url as string) || "";
                    const role = m.role as string;
                    const isCurrentUser = m.user_id === user?.id;

                    return (
                      <div
                        key={m.id as string}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        <Avatar className="h-9 w-9">
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                          <AvatarFallback>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {name}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-1">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Shared Progress</CardTitle>
              <CardDescription>Module completion across squad members</CardDescription>
            </CardHeader>
            <CardContent>
              {!members || members.length === 0 || totalModules === 0 ? (
                <p className="text-sm text-muted-foreground">No progress data yet.</p>
              ) : (
                <div className="space-y-3">
                  {members?.map((m) => {
                    const uid = m.user_id as string;
                    const prof = profileMap.get(uid);
                    const name = (prof?.full_name as string) || "Unknown";
                    const done = progressByUser.get(uid)?.size || 0;
                    const pct = totalModules > 0 ? Math.round((done / totalModules) * 100) : 0;

                    return (
                      <div key={m.id as string} className="flex items-center gap-3">
                        <span className="text-sm w-24 truncate">{name}</span>
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {done}/{totalModules}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="flex flex-col h-[500px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Squad Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pb-2">
              {msgsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !messages || messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const senderProf = profileMap.get(msg.sender_id as string);
                  const senderName = (senderProf?.full_name as string) || "Unknown";
                  const senderAvatar = (senderProf?.avatar_url as string) || "";
                  const isOwn = msg.sender_id === user?.id;

                  return (
                    <div
                      key={msg.id as string}
                      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        {senderAvatar && <AvatarImage src={senderAvatar} alt={senderName} />}
                        <AvatarFallback className="text-[10px]">
                          {getInitials(senderName)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg px-3 py-1.5 text-sm max-w-[80%] ${
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">
                            {senderName}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.text as string}</p>
                        <p className="text-[10px] opacity-60 mt-0.5 text-right">
                          {new Date((msg.created_at as string) || "").toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </CardContent>
            {isAuthenticated && isMember && (
              <div className="p-3 pt-0 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="h-9"
                />
                <Button
                  size="icon"
                  disabled={!messageText.trim() || sending}
                  onClick={sendMessage}
                  className="h-9 w-9 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            {!isAuthenticated && (
              <div className="p-3 pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate({ to: "/auth" })}
                >
                  Login to chat
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Search by username to invite someone to this squad.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search username..."
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {inviteResults && inviteResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {inviteResults.map((p) => {
                  const profileId = p.user_id as string;
                  const alreadyMember = memberIds.has(profileId);
                  return (
                    <div
                      key={profileId}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {(p.avatar_url as string) && (
                            <AvatarImage src={p.avatar_url as string} alt={p.full_name as string} />
                          )}
                          <AvatarFallback>
                            {getInitials((p.full_name as string) || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{p.full_name as string}</p>
                          <p className="text-xs text-muted-foreground">@{p.username as string}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyMember ? "secondary" : "default"}
                        disabled={alreadyMember || invitingUser === profileId}
                        onClick={() => handleInvite(profileId)}
                      >
                        {alreadyMember ? (
                          "Already in squad"
                        ) : invitingUser === profileId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Invite"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {inviteSearch.length >= 2 && (!inviteResults || inviteResults.length === 0) && (
              <p className="text-sm text-muted-foreground text-center">No users found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Squad</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave {(squad.name as string) || "this squad"}? You can
              rejoin later if invited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={leaving} onClick={handleLeave}>
              {leaving ? "Leaving..." : "Leave Squad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
