import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery } from "@/lib/api-client";
import { ArrowLeft, Upload, X, ChevronsUpDown } from "lucide-react";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  headline: z.string().min(1, "Headline is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  teamName: z.string().optional(),
  githubUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  xLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ecosystem: z.enum(["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"]),
});

type ProjectInput = z.infer<typeof projectSchema>;

interface ClubMember {
  id: string;
  userId: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
}

async function uploadFile(file: File, bucket: string, accessToken: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);

  const res = await fetch("/api/projects/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Upload failed");
  return result.url;
}

export const Route = createFileRoute("/projects/submit")({
  head: () => ({
    meta: [
      { title: "Submit Project | BlockchainClub FUTMinna" },
      { name: "description", content: "Submit your project to Blockchain Club FUTMinna." },
    ],
  }),
  component: SubmitProjectPage,
});

function SubmitProjectPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<ClubMember[]>([]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { data: clubMembers = [] } = useQuery({
    queryKey: ["club-members"],
    queryFn: async () => {
      const res = await apiQuery("profiles", {
        select: "id,user_id,full_name,avatar_url,username",
        order: { column: "username", ascending: true },
        range: [0, 500],
      });
      return ((res.data || []) as any[]).map((p) => ({
        id: p.id,
        userId: p.user_id,
        fullName: p.full_name,
        username: p.username || null,
        avatarUrl: p.avatar_url,
      }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: typeof window !== "undefined",
  });

  const filteredMembers = (() => {
    if (!memberSearch) return clubMembers;
    const search = memberSearch.toLowerCase();
    const scored = clubMembers
      .filter(
        (m: ClubMember) =>
          m.username?.toLowerCase().includes(search) || m.fullName?.toLowerCase().includes(search),
      )
      .map((m: ClubMember) => {
        const username = (m.username || "").toLowerCase();
        const fullName = (m.fullName || "").toLowerCase();
        let score = 0;
        if (username === search) score = 100;
        else if (username.startsWith(search)) score = 80;
        else if (username.includes(search)) score = 60;
        if (fullName === search) score += 30;
        else if (fullName.startsWith(search)) score += 20;
        else if (fullName.includes(search)) score += 10;
        return { member: m, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ member }) => member);
    return scored;
  })();

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      headline: "",
      description: "",
      teamName: "",
      githubUrl: "",
      xLink: "",
      websiteUrl: "",
      ecosystem: "GENERAL",
    },
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function removeBanner() {
    setBannerFile(null);
    setBannerPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  function toggleMember(member: ClubMember) {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.id === member.id);
      if (exists) return prev.filter((m) => m.id !== member.id);
      return [...prev, member];
    });
  }

  function removeMember(id: string) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function onSubmit(values: ProjectInput) {
    if (!accessToken) {
      toast.error("Please sign in to submit a project");
      return;
    }

    setIsLoading(true);
    try {
      let logoUrl = "";
      let bannerUrl = "";

      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "project-logos", accessToken);
      }
      if (bannerFile) {
        bannerUrl = await uploadFile(bannerFile, "project-banners", accessToken);
      }

      const res = await fetch("/api/projects/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: values.name,
          headline: values.headline,
          description: values.description,
          teamName: values.teamName || null,
          githubUrl: values.githubUrl || null,
          xLink: values.xLink || null,
          demoUrl: values.websiteUrl || null,
          websiteUrl: values.websiteUrl || null,
          ecosystem: values.ecosystem,
          logoUrl: logoUrl || null,
          bannerUrl: bannerUrl || null,
          memberIds: selectedMembers.map((m) => m.userId),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit project");
      }

      setSubmitted(true);
      toast.success("Project submitted for review!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit project");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">Please sign in to submit a project.</p>
            <Button asChild className="w-full">
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-headline-sm">Project Submitted!</h2>
            <p className="text-muted-foreground">
              Your project has been submitted for review. An admin will review it shortly.
            </p>
            <Button asChild className="w-full">
              <Link to="/projects">View Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Submit Project</CardTitle>
          <CardDescription>
            Share your project with the BlockchainClub FUTMinna community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="ghost" className="mb-4 -ml-2">
            <Link to="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Link>
          </Button>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline *</FormLabel>
                    <FormControl>
                      <Input placeholder="A short tagline for your project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your project... what problem does it solve?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your team or organization name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Logo (optional)</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-20 w-20 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    className="h-20 w-20 flex-col gap-1"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px]">Upload</span>
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Banner (optional)</Label>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                {bannerPreview ? (
                  <div className="relative">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-32 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute top-2 right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full h-32 flex-col gap-2 border-dashed"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">Upload Banner Image</span>
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name="ecosystem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ecosystem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ecosystem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EVM">EVM</SelectItem>
                        <SelectItem value="SUI_MOVE">Sui</SelectItem>
                        <SelectItem value="APTOS_MOVE">Aptos</SelectItem>
                        <SelectItem value="SOLANA_RUST">Solana</SelectItem>
                        <SelectItem value="GENERAL">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Link (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username/repo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="xLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X/Twitter Link (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://x.com/handle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website / Demo URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-project.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Team Members (optional)</Label>
                <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedMembers.length > 0
                        ? `${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""} selected`
                        : "Search club members..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by username or name..."
                        value={memberSearch}
                        onValueChange={setMemberSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No members found by that username.</CommandEmpty>
                        <CommandGroup>
                          {filteredMembers.map((member: ClubMember) => {
                            const isSelected = selectedMembers.some((m) => m.id === member.id);
                            return (
                              <CommandItem
                                key={member.id}
                                value={member.username || member.fullName}
                                onSelect={() => toggleMember(member)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="mr-2 pointer-events-none"
                                />
                                <span>@{member.username || member.fullName}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedMembers.map((member) => (
                      <Badge
                        key={member.id}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        onClick={() => removeMember(member.id)}
                      >
                        {member.username ? `@${member.username}` : member.fullName}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Project"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
