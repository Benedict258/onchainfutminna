import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiQuery, apiInsert, apiUpdate, apiDelete } from '@/lib/api-client';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/opportunities')({
  component: AdminOpportunities,
});

type OppType = 'HACKATHON' | 'GRANT' | 'BOUNTY' | 'JOB' | 'INTERNSHIP' | 'PROGRAM' | 'AMBASSADOR';
type OppStatus = 'OPEN' | 'CLOSING_SOON' | 'CLOSED';
type Ecosystem = 'EVM' | 'SUI_MOVE' | 'APTOS_MOVE' | 'SOLANA_RUST' | 'GENERAL';

const OPPORTUNITY_TYPES: OppType[] = ['HACKATHON', 'GRANT', 'BOUNTY', 'JOB', 'INTERNSHIP', 'PROGRAM', 'AMBASSADOR'];
const STATUSES: OppStatus[] = ['OPEN', 'CLOSING_SOON', 'CLOSED'];
const ECOSYSTEMS: Ecosystem[] = ['EVM', 'SUI_MOVE', 'APTOS_MOVE', 'SOLANA_RUST', 'GENERAL'];

interface OpportunityForm {
  title: string;
  organizer: string;
  type: string;
  ecosystem: string;
  description: string;
  prize: string;
  applyUrl: string;
  deadline: string;
  status: string;
  imageUrl: string;
  isPublished: boolean;
}

const defaultForm: OpportunityForm = {
  title: '',
  organizer: '',
  type: 'HACKATHON',
  ecosystem: 'GENERAL',
  description: '',
  prize: '',
  applyUrl: '',
  deadline: '',
  status: 'OPEN',
  imageUrl: '',
  isPublished: false,
};

function AdminOpportunities() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [deleteItem, setDeleteItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<OpportunityForm>(defaultForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "opportunity-images");
      const res = await fetch("/api/projects/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");
      setForm(prev => ({ ...prev, imageUrl: result.url }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-opportunities', typeFilter, statusFilter],
    queryFn: async () => {
      const filters: Record<string, any> = {};
      if (typeFilter) filters.type = typeFilter;
      if (statusFilter) filters.status = statusFilter;
      const res = await apiQuery('opportunities', {
        select: '*',
        filters,
        order: { column: 'deadline', ascending: true },
        range: [0, 49],
        count: 'exact',
      });
      return { opportunities: res.data || [], total: res.count || 0, page: 1, limit: 50, totalPages: Math.ceil((res.count || 0) / 50) };
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiInsert('opportunities', {
        title: form.title,
        organizer: form.organizer || undefined,
        type: form.type as OppType,
        ecosystem: form.ecosystem as Ecosystem,
        description: form.description || undefined,
        prize: form.prize || undefined,
        apply_url: form.applyUrl || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        status: form.status as OppStatus,
        image_url: form.imageUrl || undefined,
        is_published: form.isPublished,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      setDialogOpen(false);
      setForm(defaultForm);
      toast.success('Opportunity created');
    },
    onError: () => toast.error('Failed to create opportunity'),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiUpdate('opportunities', {
        title: form.title,
        organizer: form.organizer || undefined,
        type: form.type as OppType,
        ecosystem: form.ecosystem as Ecosystem,
        description: form.description || undefined,
        prize: form.prize || undefined,
        apply_url: form.applyUrl || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        status: form.status as OppStatus,
        image_url: form.imageUrl || undefined,
        is_published: form.isPublished,
      }, { id: editItem?.id as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      setDialogOpen(false);
      setEditItem(null);
      setForm(defaultForm);
      toast.success('Opportunity updated');
    },
    onError: () => toast.error('Failed to update opportunity'),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiDelete('opportunities', { id: deleteItem?.id as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      setDeleteItem(null);
      toast.success('Opportunity deleted');
    },
    onError: () => toast.error('Failed to delete opportunity'),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item);
    setForm({
      title: item.title as string,
      organizer: (item.organizer as string) || '',
      type: item.type as string,
      ecosystem: item.ecosystem as string,
      description: (item.description as string) || '',
      prize: (item.prize as string) || '',
      applyUrl: (item.apply_url as string) || '',
      deadline: item.deadline
        ? new Date(item.deadline as string).toISOString().slice(0, 16)
        : '',
      status: item.status as string,
      imageUrl: (item.image_url as string) || '',
      isPublished: (item.is_published as boolean) || false,
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-green-500/20 text-green-400">Open</Badge>;
      case 'CLOSING_SOON':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Closing Soon</Badge>;
      case 'CLOSED':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Opportunities</h1>
          <p className="text-muted-foreground">Manage opportunities for members</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Opportunity
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {OPPORTUNITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.opportunities && data.opportunities.length > 0 ? (
              data.opportunities.map((opp) => (
                <TableRow key={opp.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {opp.title}
                      {opp.apply_url && (
                        <a
                          href={opp.apply_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {opp.organizer || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{opp.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(opp.status as string)}</TableCell>
                  <TableCell>
                    {opp.image_url ? (
                      <img src={opp.image_url as string} alt="" className="h-8 w-8 rounded object-cover border border-border" />
                    ) : (
                      <span className="text-muted-foreground text-xs"></span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {opp.deadline
                      ? new Date(opp.deadline).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(opp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteItem(opp)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No opportunities found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Opportunity' : 'Create Opportunity'}</DialogTitle>
            <DialogDescription>
              {editItem ? 'Update opportunity details' : 'Add a new opportunity'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Opportunity title"
              />
            </div>
            <div>
              <Label>Organizer</Label>
              <Input
                value={form.organizer}
                onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                placeholder="Organization name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPPORTUNITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ecosystem</Label>
                <Select
                  value={form.ecosystem}
                  onValueChange={(v) => setForm({ ...form, ecosystem: v })}
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
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prize</Label>
                <Input
                  value={form.prize}
                  onChange={(e) => setForm({ ...form, prize: e.target.value })}
                  placeholder="$5000"
                />
              </div>
              <div>
                <Label>Apply URL</Label>
                <Input
                  value={form.applyUrl}
                  onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
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
            </div>
            <div>
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://... or upload below"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" disabled={uploadingImage} onClick={() => fileInputRef.current?.click()}>
                  {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="mt-2 h-20 w-full object-cover rounded-md border border-border" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
              />
              <Label>Published</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => (editItem ? updateMutation.mutate() : createMutation.mutate())}
                disabled={!form.title}
              >
                {editItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.title as string}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


