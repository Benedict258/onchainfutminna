import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  Users,
  Layers,
  Calendar,
  Search,
  Github,
  Shield,
  Code2,
  Globe,
  Palette,
  Megaphone,
  Award,
  Trophy,
  ArrowRight,
  User2,
} from "lucide-react";
import { apiQueryAll } from "@/lib/api-client";

const TRACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Security": Shield,
  "Protocol": Code2,
  "Full-Stack": Globe,
  "Full Stack": Globe,
  "Design": Palette,
  "Marketing": Megaphone,
};

const TRACK_COLORS: Record<string, string> = {
  "Security": "bg-red-500/10 text-red-400 border-red-500/20",
  "Protocol": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Full-Stack": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Full Stack": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Design": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Marketing": "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const TIER_COLORS: Record<number, string> = {
  1: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  2: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  3: "bg-primary/10 text-primary border-primary/20",
};

interface Certification {
  id: string;
  user_id: string;
  tier: number;
  track?: string;
  cohort_year?: number;
  awarded_at?: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  nickname?: string;
  department?: string;
  github_link?: string;
  portfolio_link?: string;
}

interface AlumniEntry {
  userId: string;
  profile: Profile | null;
  tiers: number[];
  tracks: string[];
  cohortYear: number | null;
  currentRole: string | null;
}

export const Route = createFileRoute("/alumni")({
  head: () => ({
    meta: [
      {
        title: "Alumni Directory  BlockchainClub FUTMinna",
      },
      {
        name: "description",
        content:
          "Graduated members of the BlockchainClub FUTMinna pipeline. Tier 3 certificate holders who have completed the full programme.",
      },
      {
        property: "og:title",
        content: "Alumni  Where Builders Become Legends | BlockchainClub FUTMinna",
      },
      {
        property: "og:description",
        content: "Celebrating graduates of the BlockchainClub FUTMinna programme.",
      },
    ],
  }),
  component: AlumniPage,
});

function AlumniSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-5 w-8 rounded-full" />
              <Skeleton className="h-5 w-8 rounded-full" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function StatsBar({ entries }: { entries: AlumniEntry[] }) {
  const trackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      for (const track of entry.tracks) {
        counts[track] = (counts[track] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const cohortCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const entry of entries) {
      if (entry.cohortYear) {
        counts[entry.cohortYear] = (counts[entry.cohortYear] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [entries]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Total Alumni</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Layers className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{trackCounts.length}</p>
            <p className="text-xs text-muted-foreground">By Track</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Calendar className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{cohortCounts.length}</p>
            <p className="text-xs text-muted-foreground">By Cohort Year</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <Trophy className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {entries.filter((e) => e.tiers.includes(3)).length}
            </p>
            <p className="text-xs text-muted-foreground">Tier 3 Certified</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSection({
  tracks,
  cohortYears,
  selectedTrack,
  setSelectedTrack,
  selectedCohort,
  setSelectedCohort,
  searchQuery,
  setSearchQuery,
}: {
  tracks: string[];
  cohortYears: number[];
  selectedTrack: string;
  setSelectedTrack: (v: string) => void;
  selectedCohort: string;
  setSelectedCohort: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={selectedTrack} onValueChange={setSelectedTrack}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by track" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tracks</SelectItem>
          {tracks.map((track) => (
            <SelectItem key={track} value={track}>
              {track}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedCohort} onValueChange={setSelectedCohort}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by cohort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cohorts</SelectItem>
          {cohortYears.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TierBadge({ tier }: { tier: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        TIER_COLORS[tier] || "bg-muted text-muted-foreground border-border"
      }`}
    >
      <Award className="h-3 w-3" />
      Tier {tier}
    </span>
  );
}

function AlumniCard({ entry }: { entry: AlumniEntry }) {
  const profile = entry.profile;
  const name = profile?.nickname || profile?.full_name || "Anonymous";
  const initials = name
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="border-border bg-card hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Link to="/members/$memberId" params={{ memberId: entry.userId }}>
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to="/members/$memberId"
              params={{ memberId: entry.userId }}
              className="hover:text-primary transition-colors"
            >
              <CardTitle className="text-base truncate">{name}</CardTitle>
            </Link>
            {profile?.department && (
              <CardDescription className="text-xs truncate">{profile.department}</CardDescription>
            )}
            {entry.currentRole && (
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {entry.currentRole}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <div className="flex flex-wrap gap-2">
          {entry.tracks.map((track) => {
            const Icon = TRACK_ICONS[track] || Code2;
            return (
              <Badge
                key={track}
                variant="outline"
                className={`text-[10px] ${TRACK_COLORS[track] || "bg-muted text-muted-foreground border-border"}`}
              >
                <Icon className="mr-1 h-3 w-3" />
                {track}
              </Badge>
            );
          })}
          {entry.cohortYear && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Calendar className="mr-1 h-3 w-3" />
              {entry.cohortYear}
            </Badge>
          )}
        </div>

        {entry.tiers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tiers.sort().map((tier) => (
              <TierBadge key={tier} tier={tier} />
            ))}
          </div>
        )}
        {entry.tiers.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60">No certificates yet</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        {profile?.github_link && (
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <a href={profile.github_link} target="_blank" rel="noopener noreferrer">
              <Github className="mr-1.5 h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        )}
        <Button asChild size="sm" className="h-8 text-xs flex-1">
          <Link to="/members/$memberId" params={{ memberId: entry.userId }}>
            <User2 className="mr-1.5 h-3.5 w-3.5" />
            View Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function AlumniPage() {
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedCohort, setSelectedCohort] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: certifications, isLoading: certsLoading } = useQuery({
    queryKey: ["alumni-certifications"],
    queryFn: async () => {
      try {
        return await apiQueryAll("certifications", {
          order: { column: "awarded_at", ascending: false },
        });
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const userIds = useMemo(() => {
    if (!certifications?.length) return [];
    const ids = new Set<string>();
    for (const cert of certifications) {
      if (cert.user_id) ids.add(cert.user_id);
    }
    return Array.from(ids);
  }, [certifications]);

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["alumni-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      try {
        return await apiQueryAll("profiles", {
          filters: undefined,
        });
      } catch {
        return [];
      }
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = certsLoading || (userIds.length > 0 && profilesLoading);

  const entries: AlumniEntry[] = useMemo(() => {
    if (!certifications?.length) return [];

    const grouped = new Map<string, { tiers: Set<number>; tracks: Set<string>; cohortYear: number | null }>();
    for (const cert of certifications) {
      const uid = cert.user_id;
      if (!grouped.has(uid)) {
        grouped.set(uid, { tiers: new Set(), tracks: new Set(), cohortYear: cert.cohort_year || null });
      }
      const g = grouped.get(uid)!;
      if (cert.tier) g.tiers.add(cert.tier);
      if (cert.track) g.tracks.add(cert.track);
      if (cert.cohort_year) g.cohortYear = cert.cohort_year;
    }

    const profileMap = new Map<string, Profile>();
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.user_id, p);
      }
    }

    return Array.from(grouped.entries())
      .map(([userId, data]) => ({
        userId,
        profile: profileMap.get(userId) || null,
        tiers: Array.from(data.tiers).sort(),
        tracks: Array.from(data.tracks),
        cohortYear: data.cohortYear,
        currentRole: null,
      }))
      .sort((a, b) => {
        const aHasTier3 = a.tiers.includes(3);
        const bHasTier3 = b.tiers.includes(3);
        if (aHasTier3 && !bHasTier3) return -1;
        if (!aHasTier3 && bHasTier3) return 1;
        return (b.cohortYear || 0) - (a.cohortYear || 0);
      });
  }, [certifications, profiles]);

  const allTracks = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) {
      for (const t of e.tracks) s.add(t);
    }
    return Array.from(s).sort();
  }, [entries]);

  const allCohortYears = useMemo(() => {
    const s = new Set<number>();
    for (const e of entries) {
      if (e.cohortYear) s.add(e.cohortYear);
    }
    return Array.from(s).sort((a, b) => b - a);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (selectedTrack !== "all" && !e.tracks.includes(selectedTrack)) return false;
      if (selectedCohort !== "all" && String(e.cohortYear) !== selectedCohort) return false;
      if (searchQuery) {
        const name = (e.profile?.full_name || "").toLowerCase();
        const nick = (e.profile?.nickname || "").toLowerCase();
        const q = searchQuery.toLowerCase();
        if (!name.includes(q) && !nick.includes(q)) return false;
      }
      return true;
    });
  }, [entries, selectedTrack, selectedCohort, searchQuery]);

  const showPlaceholderNote = !isLoading && entries.length === 0;

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            ALUMNI DIRECTORY
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Alumni &mdash; Where<br />
            <span className="text-primary">Builders Become Legends</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Graduated members of the BlockchainClub FUTMinna pipeline. Tier 3 certificate holders
            who have completed the full programme.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <StatsBar entries={entries} />
        </div>
      </section>

      {/* FILTERS */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <FilterSection
            tracks={allTracks}
            cohortYears={allCohortYears}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            selectedCohort={selectedCohort}
            setSelectedCohort={setSelectedCohort}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
      </section>

      {/* ALUMNI GRID */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        {isLoading ? (
          <AlumniSkeleton />
        ) : showPlaceholderNote ? (
          <div className="text-center py-16">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg text-muted-foreground">
              No alumni yet. The first cohort is still in progress.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/60">
              Alumni directory will populate as students complete the programme.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg text-muted-foreground">
              No alumni match your filters.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/60">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((entry) => (
              <AlumniCard key={entry.userId} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-headline-lg">JOIN THE PIPELINE</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Complete learning tracks, earn tiered certifications, and become part of the
            BlockchainClub FUTMinna alumni network.
          </p>
          <Button asChild size="lg" className="mt-8 font-semibold tracking-wide">
            <Link to="/join">
              Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}


