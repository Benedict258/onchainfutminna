import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, Loader2, CheckCircle2, Clock, Lock, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  FormDescription,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth-store";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators/auth";
import { getBadgeConfig } from "@/lib/badges";
import { apiQueryAll, apiUpdate, apiLogCommunityActivity } from "@/lib/api-client";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: "My Profile | BlockchainClub FUTMinna" },
      { name: "description", content: "View and edit your Blockchain Club FUTMinna profile." },
    ],
  }),
  component: ProfilePage,
});

const SKILLS = [
  "Solidity",
  "Move",
  "Rust",
  "JavaScript",
  "Python",
  "Frontend Dev",
  "UI/UX Design",
  "Content Writing",
  "Marketing",
  "Community Management",
  "Research",
  "Other",
] as const;

const LEVELS = ["100", "200", "300", "400", "500", "600"] as const;

const EXPERIENCE_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

function ProfilePage() {
  const { user, setUser, accessToken } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSuggestions, setReviewSuggestions] = useState("");
  const [reviewPositives, setReviewPositives] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const profile = user?.profile;

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: profile?.fullName || "",
      username: profile?.username || "",
      phone: profile?.phone || "",
      nickname: profile?.nickname || "",
      bio: profile?.bio || "",
      department: profile?.department || "",
      level: (profile?.level as any) || undefined,
      experienceLevel: (profile?.experienceLevel as any) || undefined,
      skills: (profile?.skills as any) || [],
      funFact: profile?.funFact || "",
      xLink: profile?.xLink || "",
      githubLink: profile?.githubLink || "",
      portfolioLink: profile?.portfolioLink || "",
      avatarUrl: profile?.avatarUrl || "",
    },
  });

  function getInitials(name?: string) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");

      const profileRes = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ avatarUrl: result.url }),
      });
      const profileResult = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileResult.error || "Failed to update avatar");

      if (user) {
        setUser({
          ...user,
          profile: { ...user.profile, ...profileResult.user.profile } as any,
        });
      }

      toast.success("Avatar updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: ProfileUpdateInput) {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");

      if (user) {
        setUser({
          ...user,
          profile: { ...user.profile, ...result.user.profile } as any,
        });
      }

      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  const badges = profile?.badges || [];

  const { data: gateChecksData } = useQuery({
    queryKey: ["profile-gate-checks", user.id],
    queryFn: async () => {
      const rows = await apiQueryAll("gate_checks", {
        filters: { user_id: user.id },
        order: { column: "gate_number", ascending: true },
      });
      return (rows || []) as {
        id: string;
        gate_number: number;
        status: string;
        checked_at: string | null;
      }[];
    },
  });

  const gateChecks = gateChecksData || [];
  const gateStatuses: Record<number, { status: string; checkedAt: string | null }> = {
    1: { status: "not_started", checkedAt: null },
    2: { status: "not_started", checkedAt: null },
    3: { status: "not_started", checkedAt: null },
  };
  for (const gc of gateChecks) {
    gateStatuses[gc.gate_number] = { status: gc.status, checkedAt: gc.checked_at };
  }

  const { data: assignedReviews } = useQuery({
    queryKey: ["profile-reviews-assigned", user.id],
    queryFn: async () => {
      const rows = await apiQueryAll("peer_reviews", {
        filters: { reviewer_id: user.id, status: "pending" },
        order: { column: "created_at", ascending: false },
      });
      return (rows || []) as {
        id: string;
        submission_url: string;
        reviewee_id: string;
        reviewer_id: string;
        status: string;
        feedback: string;
        suggestions: string;
        positives: string;
        created_at: string;
      }[];
    },
  });

  const { data: submittedReviews } = useQuery({
    queryKey: ["profile-reviews-submitted", user.id],
    queryFn: async () => {
      const rows = await apiQueryAll("peer_reviews", {
        filters: { reviewee_id: user.id },
        order: { column: "created_at", ascending: false },
      });
      return (rows || []) as {
        id: string;
        submission_url: string;
        reviewer_id: string;
        reviewee_id: string;
        status: string;
        feedback: string;
        suggestions: string;
        positives: string;
        created_at: string;
      }[];
    },
  });

  const { data: reviewProfiles } = useQuery({
    queryKey: ["profile-review-profiles"],
    queryFn: async () => {
      const rows = await apiQueryAll("profiles", {
        select: "user_id,full_name,avatar_url",
      });
      return (rows || []) as { user_id: string; full_name: string; avatar_url: string }[];
    },
  });

  const reviewProfileMap = new Map<string, { full_name: string; avatar_url: string }>();
  if (reviewProfiles) {
    for (const p of reviewProfiles) {
      reviewProfileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
    }
  }

  async function handleSubmitReview() {
    if (!reviewingId || !reviewFeedback.trim()) return;
    setSubmittingReview(true);
    try {
      await apiUpdate(
        "peer_reviews",
        {
          feedback: reviewFeedback.trim(),
          suggestions: reviewSuggestions.trim(),
          positives: reviewPositives.trim(),
          status: "completed",
          points_awarded: true,
        },
        { id: reviewingId },
      );

      await apiLogCommunityActivity("review", "Completed a peer review", 5);

      setReviewModalOpen(false);
      setReviewingId(null);
      setReviewFeedback("");
      setReviewSuggestions("");
      setReviewPositives("");
      toast.success("Review submitted! +5 community points");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  function openReviewModal(
    reviewId: string,
    existingFeedback: string,
    existingSuggestions: string,
    existingPositives: string,
  ) {
    setReviewingId(reviewId);
    setReviewFeedback(existingFeedback || "");
    setReviewSuggestions(existingSuggestions || "");
    setReviewPositives(existingPositives || "");
    setReviewModalOpen(true);
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4 relative group">
          <Avatar className="h-24 w-24">
            {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile?.fullName} />}
            <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
              {getInitials(profile?.fullName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <CardTitle className="text-2xl font-bold">{profile?.fullName || "Member"}</CardTitle>
        {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
        {profile?.nickname && (
          <p className="text-sm text-muted-foreground">&ldquo;{profile.nickname}&rdquo;</p>
        )}
        <CardDescription>{user.email}</CardDescription>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {profile?.phone && <Badge variant="secondary">{profile.phone}</Badge>}
          {profile?.department && <Badge variant="secondary">{profile.department}</Badge>}
          {profile?.level && <Badge variant="outline">Level {profile.level}</Badge>}
          {profile?.experienceLevel && <Badge variant="outline">{profile.experienceLevel}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            {badges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => {
                    const config = getBadgeConfig(b.name);
                    const Icon = config?.icon;
                    return (
                      <div
                        key={b.name}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config?.bgColor || "bg-muted"} ${config?.color || "text-muted-foreground"}`}
                        title={b.description}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {b.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending Reviews</h3>
              <div className="space-y-2">
                {assignedReviews && assignedReviews.length > 0 ? (
                  assignedReviews.map((review) => {
                    const reviewee = reviewProfileMap.get(review.reviewee_id);
                    return (
                      <button
                        key={review.id}
                        className="w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer text-left"
                        onClick={() =>
                          openReviewModal(
                            review.id,
                            review.feedback,
                            review.suggestions,
                            review.positives,
                          )
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-yellow-500 shrink-0" />
                          <span className="truncate">
                            Review submission by {reviewee?.full_name || "Unknown"}
                          </span>
                        </div>
                        <Badge className="shrink-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Needs Review
                        </Badge>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No pending reviews assigned to you.
                  </p>
                )}
                {submittedReviews &&
                  submittedReviews.filter((r) => r.status !== "completed").length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Awaiting Review</p>
                      {submittedReviews
                        .filter((r) => r.status !== "completed")
                        .map((review) => {
                          const reviewer = reviewProfileMap.get(review.reviewer_id);
                          return (
                            <div
                              key={review.id}
                              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">
                                  Under review by {reviewer?.full_name || "Unknown"}
                                </span>
                              </div>
                              <Badge variant="outline" className="shrink-0">
                                Pending
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  )}
                {submittedReviews && submittedReviews.some((r) => r.status === "completed") && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Completed Reviews</p>
                    {submittedReviews
                      .filter((r) => r.status === "completed")
                      .map((review) => {
                        const reviewer = reviewProfileMap.get(review.reviewer_id);
                        return (
                          <div
                            key={review.id}
                            className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MessageSquare className="h-4 w-4 text-green-500 shrink-0" />
                              <span className="truncate">
                                Reviewed by {reviewer?.full_name || "Unknown"}
                              </span>
                            </div>
                            <Badge className="shrink-0 bg-green-500/20 text-green-400 border-green-500/30">
                              Completed
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Gate Check Status</h3>
              <div className="space-y-2">
                {[1, 2, 3].map((gateNum) => {
                  const gs = gateStatuses[gateNum];
                  const isPassed = gs.status === "passed";
                  const isPending = gs.status === "pending";
                  const isLocked = gs.status === "not_started" || gs.status === "failed";
                  return (
                    <div
                      key={gateNum}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        isPassed
                          ? "bg-green-500/10 border-green-500/20"
                          : isPending
                            ? "bg-yellow-500/10 border-yellow-500/20"
                            : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : isPending ? (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground/60" />
                        )}
                        <span className="font-medium">Gate {gateNum}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            isPassed
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : isPending
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {isPassed
                            ? "Passed"
                            : isPending
                              ? "Pending"
                              : isLocked
                                ? "Locked"
                                : "Not Started"}
                        </Badge>
                        {gs.checkedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(gs.checkedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {profile?.bio && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                <p className="text-sm">{profile.bio}</p>
              </div>
            )}
            {profile?.funFact && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Fun Fact</h3>
                <p className="text-sm">{profile.funFact}</p>
              </div>
            )}
            {profile?.skills && profile.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {profile?.xLink && (
                <a
                  href={profile.xLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  X / Twitter
                </a>
              )}
              {profile?.githubLink && (
                <a
                  href={profile.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  GitHub
                </a>
              )}
              {profile?.portfolioLink && (
                <a
                  href={profile.portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Portfolio
                </a>
              )}
            </div>
            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Profile
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="yourusername" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+2348012345678" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="What should we call you?" {...field} />
                    </FormControl>
                    <FormDescription>A short nickname (max 30 characters).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about yourself..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            Level {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPERIENCE_LEVELS.map((exp) => (
                          <SelectItem key={exp.value} value={exp.value}>
                            {exp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {SKILLS.map((skill) => (
                        <FormField
                          key={skill}
                          control={form.control}
                          name="skills"
                          render={({ field }) => {
                            const checked = field.value?.includes(skill as never);
                            return (
                              <label
                                key={skill}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(isChecked) => {
                                    const current = field.value || [];
                                    if (isChecked) {
                                      field.onChange([...current, skill]);
                                    } else {
                                      field.onChange(current.filter((s) => s !== skill));
                                    }
                                  }}
                                />
                                {skill}
                              </label>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="funFact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fun Fact</FormLabel>
                    <FormControl>
                      <Input placeholder="Tell us something fun about yourself" {...field} />
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
                    <FormLabel>X / Twitter Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://x.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio / Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yoursite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>

      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Submit Peer Review</DialogTitle>
            <DialogDescription>Provide constructive feedback on this submission.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Your detailed feedback on the submission..."
                rows={4}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggestions">Suggestions</Label>
              <Textarea
                id="suggestions"
                placeholder="Suggestions for improvement..."
                rows={3}
                value={reviewSuggestions}
                onChange={(e) => setReviewSuggestions(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positives">Positives</Label>
              <Textarea
                id="positives"
                placeholder="What was done well..."
                rows={3}
                value={reviewPositives}
                onChange={(e) => setReviewPositives(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewModalOpen(false);
                setReviewingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!reviewFeedback.trim() || submittingReview}
              onClick={handleSubmitReview}
            >
              {submittingReview ? "Submitting..." : "Submit Review (+5 pts)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
