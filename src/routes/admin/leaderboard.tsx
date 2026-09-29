import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiQueryAll, apiAdjustPoints } from '@/lib/api-client';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Star, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/leaderboard')({
  component: AdminLeaderboard,
});

interface PointsForm {
  userId: string;
  eventPoints: string;
  learnPoints: string;
  buildPoints: string;
  communityPoints: string;
  reason: string;
}

const defaultForm: PointsForm = {
  userId: '',
  eventPoints: '',
  learnPoints: '',
  buildPoints: '',
  communityPoints: '',
  reason: '',
};

function AdminLeaderboard() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<PointsForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-leaderboard'],
    queryFn: async () => {
      const entries = await apiQueryAll('leaderboard_entries', {
        select: '*,users(id,email,profiles(full_name,nickname,avatar_url,department,level))',
        order: { column: 'total_points', ascending: false },
        limit: 50,
      });
      return entries.map((entry: any, index: number) => ({ rank: index + 1, ...entry }));
    },
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      apiAdjustPoints({
        userId: form.userId,
        eventPoints: form.eventPoints ? parseInt(form.eventPoints) : undefined,
        learnPoints: form.learnPoints ? parseInt(form.learnPoints) : undefined,
        buildPoints: form.buildPoints ? parseInt(form.buildPoints) : undefined,
        communityPoints: form.communityPoints ? parseInt(form.communityPoints) : undefined,
        reason: form.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leaderboard'] });
      setAdjustDialogOpen(false);
      setSelectedEntry(null);
      setForm(defaultForm);
      toast.success('Points adjusted');
    },
    onError: () => toast.error('Failed to adjust points'),
  });

  const openAdjust = (entry: Record<string, unknown>) => {
    setSelectedEntry(entry);
    setForm({
      userId: (entry.user as Record<string, unknown>)?.id as string,
      eventPoints: (entry.event_points as number)?.toString() || '',
      learnPoints: (entry.learn_points as number)?.toString() || '',
      buildPoints: (entry.build_points as number)?.toString() || '',
      communityPoints: (entry.community_points as number)?.toString() || '',
      reason: '',
    });
    setAdjustDialogOpen(true);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-orange-500" />;
    return <span className="text-sm text-muted-foreground w-4 text-center">{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg">Leaderboard</h1>
        <p className="text-muted-foreground">Manage member points and rankings</p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Total Points</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Learn</TableHead>
              <TableHead>Build</TableHead>
              <TableHead>Community</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((entry) => {
                const users = entry.users as Record<string, unknown> | undefined;
                const profiles = users?.profiles as Record<string, unknown> | undefined;
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{getRankIcon(entry.rank)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                          {profiles?.full_name
                            ? (profiles.full_name as string)
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                            : '?'}
                        </div>
                        <div>
                          <p className="font-medium">
                            {(profiles?.full_name as string) || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {users?.email as string}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 text-primary font-bold">
                        {entry.total_points}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.event_points}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.learn_points}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.build_points}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.community_points}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openAdjust(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No leaderboard entries found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Adjust Points Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
            <DialogDescription>
              Adjust points for {(selectedEntry?.user as Record<string, unknown>)?.email as string || 'user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Points</Label>
                <Input
                  type="number"
                  value={form.eventPoints}
                  onChange={(e) => setForm({ ...form, eventPoints: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Learn Points</Label>
                <Input
                  type="number"
                  value={form.learnPoints}
                  onChange={(e) => setForm({ ...form, learnPoints: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Build Points</Label>
                <Input
                  type="number"
                  value={form.buildPoints}
                  onChange={(e) => setForm({ ...form, buildPoints: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Community Points</Label>
                <Input
                  type="number"
                  value={form.communityPoints}
                  onChange={(e) => setForm({ ...form, communityPoints: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={2}
                placeholder="Reason for adjustment..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => adjustMutation.mutate()}
                disabled={!form.reason}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


