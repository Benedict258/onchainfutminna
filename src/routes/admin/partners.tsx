import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQueryAll, apiInsert, apiUpdate, apiDelete } from "@/lib/api-client";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/partners")({
  component: AdminPartners,
});

type PartnerCategory = "ECOSYSTEM" | "COMMUNITY" | "SPONSOR";

const CATEGORIES: PartnerCategory[] = ["ECOSYSTEM", "COMMUNITY", "SPONSOR"];

interface PartnerForm {
  name: string;
  logoUrl: string;
  website: string;
  description: string;
  category: string;
  order: number;
  isActive: boolean;
}

const defaultForm: PartnerForm = {
  name: "",
  logoUrl: "",
  website: "",
  description: "",
  category: "COMMUNITY",
  order: 0,
  isActive: true,
};

function AdminPartners() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [deleteItem, setDeleteItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<PartnerForm>(defaultForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formErrors = {
    name: touched.name && !form.name ? "Name is required" : "",
  };
  const isFormValid = !!form.name;

  const {
    data: allPartners,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: () =>
      apiQueryAll("partners", {
        select: "*",
        order: { column: "order", ascending: true },
      }),
  });

  const partners = categoryFilter
    ? allPartners?.filter((p) => p.category === categoryFilter)
    : allPartners;

  const createMutation = useMutation({
    mutationFn: () =>
      apiInsert("partners", {
        name: form.name,
        logo_url: form.logoUrl || undefined,
        website: form.website || undefined,
        description: form.description || undefined,
        category: form.category as PartnerCategory,
        order: form.order,
        is_active: form.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      setDialogOpen(false);
      setForm(defaultForm);
      toast.success("Partner created");
    },
    onError: () => toast.error("Failed to create partner"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiUpdate(
        "partners",
        {
          name: form.name,
          logo_url: form.logoUrl || undefined,
          website: form.website || undefined,
          description: form.description || undefined,
          category: form.category as PartnerCategory,
          order: form.order,
          is_active: form.isActive,
        },
        { id: editItem?.id as string },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      setDialogOpen(false);
      setEditItem(null);
      setForm(defaultForm);
      toast.success("Partner updated");
    },
    onError: () => toast.error("Failed to update partner"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (variables: { id: string; isActive: boolean }) =>
      apiUpdate(
        "partners",
        {
          is_active: variables.isActive,
        },
        { id: variables.id },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success("Partner status updated");
    },
    onError: () => toast.error("Failed to update partner"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete("partners", { id: deleteItem?.id as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      setDeleteItem(null);
      toast.success("Partner deleted");
    },
    onError: () => toast.error("Failed to delete partner"),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setTouched({});
    setDialogOpen(true);
  };

  const openEdit = (partner: Record<string, unknown>) => {
    setEditItem(partner);
    setForm({
      name: partner.name as string,
      logoUrl: (partner.logo_url as string) || "",
      website: (partner.website as string) || "",
      description: (partner.description as string) || "",
      category: partner.category as string,
      order: (partner.order as number) || 0,
      isActive: (partner.is_active as boolean) || false,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Partners</h1>
          <p className="text-muted-foreground">Manage club partners</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={categoryFilter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setCategoryFilter("")}
        >
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={categoryFilter === c ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load partners</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Could not fetch partners. Please try again.</span>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : partners && partners.length > 0 ? (
              partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url as string}
                          alt={partner.name}
                          className="h-8 w-8 rounded object-contain bg-muted"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                          {partner.name[0]}
                        </div>
                      )}
                      <div>
                        <p>{partner.name}</p>
                        {partner.website && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {partner.website}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.category}</Badge>
                  </TableCell>
                  <TableCell>{partner.order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={partner.is_active}
                      onCheckedChange={(v) =>
                        toggleActiveMutation.mutate({ id: partner.id, isActive: v })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(partner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteItem(partner)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No partners found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Partner" : "Add Partner"}</DialogTitle>
            <DialogDescription>
              {editItem ? "Update partner details" : "Add a new partner"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => setTouched({ ...touched, name: true })}
                placeholder="Partner name"
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => (editItem ? updateMutation.mutate() : createMutation.mutate())}
                disabled={!isFormValid}
              >
                {editItem ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.name as string}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
