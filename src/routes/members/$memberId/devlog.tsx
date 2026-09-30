import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { ArrowLeft, Flame } from "lucide-react";
import { getMemberById } from "@/lib/api/members.server";
import { apiQuery } from "@/lib/api-client";

export const Route = createFileRoute("/members/$memberId/devlog")({
  head: () => ({
    meta: [
      { title: "Member DEVLOG | BlockchainClub FUTMinna" },
      { name: "description", content: "View member's weekly development log." },
    ],
  }),
  component: MemberDevlogPage,
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

function MemberDevlogPage() {
  const params = Route.useParams();
  const memberId = params.memberId;
  const fetchMember = useServerFn(getMemberById);

  const {
    data: member,
    isLoading: memberLoading,
    error: memberError,
  } = useQuery({
    queryKey: ["member", memberId],
    queryFn: () => fetchMember({ data: { id: memberId } }),
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["devlog_entries", memberId, "published"],
    queryFn: async () => {
      const result = await apiQuery("devlog_entries", {
        filters: { user_id: memberId, is_published: true },
        order: { column: "week_number", ascending: false },
      });
      return (result.data || []) as DevlogEntry[];
    },
    enabled: !!memberId,
  });

  if (memberLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (memberError || !member) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Member not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/leaderboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leaderboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link to="/members/$memberId" params={{ memberId }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Link>
      </Button>

      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback className="text-xl">
            {member.full_name
              ?.split(" ")
              .map((p: string) => p[0])
              .join("") || "M"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-headline-lg tracking-tight">{member.full_name}</h1>
          <p className="text-muted-foreground">DEVLOG</p>
        </div>
      </div>

      {entriesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">This member hasn't started their DEVLOG yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-border bg-card">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    Week {entry.week_number}
                  </Badge>
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <MarkdownContent content={entry.content} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
