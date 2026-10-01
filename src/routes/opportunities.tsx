import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginPrompt } from "@/components/login-prompt";
import {
  Trophy,
  ArrowRight,
  ExternalLink,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  GraduationCap,
  Zap,
  Target,
  Gift,
} from "lucide-react";
import { getOpportunities } from "@/lib/api/opportunities.server";
import { useAuthStore } from "@/stores/auth-store";

type TypeFilter = "all" | "HACKATHON" | "GRANT" | "JOB" | "INTERNSHIP" | "PROGRAM";

const TYPE_LABELS: Record<string, string> = {
  HACKATHON: "Hackathon",
  GRANT: "Grant",
  BOUNTY: "Bounty",
  JOB: "Job",
  INTERNSHIP: "Internship",
  PROGRAM: "Program",
  AMBASSADOR: "Ambassador",
};

const TYPE_ICONS: Record<string, typeof Trophy> = {
  HACKATHON: Zap,
  GRANT: DollarSign,
  BOUNTY: Gift,
  JOB: Briefcase,
  INTERNSHIP: GraduationCap,
  PROGRAM: Target,
  AMBASSADOR: Trophy,
};

const TYPE_COLORS: Record<string, string> = {
  HACKATHON: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  GRANT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  BOUNTY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  JOB: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  INTERNSHIP: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  PROGRAM: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  AMBASSADOR: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

const ECOSYSTEM_LABELS: Record<string, string> = {
  EVM: "EVM",
  SUI_MOVE: "Sui",
  APTOS_MOVE: "Aptos",
  SOLANA_RUST: "Solana",
  GENERAL: "General",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: "Open",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  CLOSING_SOON: {
    label: "Closing Soon",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

function getDeadlineUrgency(deadline: Date | string | null) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", className: "text-red-400" };
  if (diffDays <= 7) return { label: `${diffDays}d left`, className: "text-red-400" };
  if (diffDays <= 30) return { label: `${diffDays}d left`, className: "text-amber-400" };
  return { label: `${diffDays}d left`, className: "text-emerald-400" };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function OpportunitiesSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      {
        title: "Opportunities  Hackathons, Grants & Jobs | BlockchainClub FUTMinna",
      },
      {
        name: "description",
        content:
          "Unlock the next phase of your Web3 journey. Global hackathons, exclusive grants, and ecosystem programs.",
      },
      {
        property: "og:title",
        content: "Onchain Opportunities  BlockchainClub FUTMinna",
      },
      {
        property: "og:description",
        content: "Hackathons, grants, jobs, and ecosystem programs.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const fetchOpportunities = useServerFn(getOpportunities);

  // Hooks must run on every render, so the sign-in check comes after them; the query
  // simply waits until the user is signed in.
  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", typeFilter],
    queryFn: () =>
      fetchOpportunities({
        data: {
          page: 1,
          limit: 50,
          type: typeFilter === "all" ? undefined : typeFilter,
        },
      }),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return <LoginPrompt />;

  const opportunities = data?.opportunities ?? [];

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            OPPORTUNITIES
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Hackathons, Grants &<br />
            <span className="text-primary">Jobs</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Unlock the next phase of your Web3 journey. From global hackathons to exclusive grants
            and ecosystem programs.
          </p>
        </div>
      </section>

      {/* FILTER TABS */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <TabsList className="bg-background/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="HACKATHON">Hackathons</TabsTrigger>
              <TabsTrigger value="GRANT">Grants</TabsTrigger>
              <TabsTrigger value="JOB">Jobs</TabsTrigger>
              <TabsTrigger value="PROGRAM">Programs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* OPPORTUNITIES GRID */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        {isLoading ? (
          <OpportunitiesSkeleton />
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg text-muted-foreground">No opportunities found.</p>
            <p className="mt-2 text-sm text-muted-foreground/60">
              Check back soon for new opportunities!
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp) => {
              const Icon = TYPE_ICONS[opp.type] || Trophy;
              const urgency = getDeadlineUrgency(opp.deadline);
              const statusConfig = STATUS_CONFIG[opp.status];

              return (
                <Card
                  key={opp.id}
                  className="group relative overflow-hidden border-border bg-card p-0 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-r" />
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${TYPE_COLORS[opp.type] || ""}`}
                        >
                          {TYPE_LABELS[opp.type] || opp.type}
                        </Badge>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusConfig?.className || ""}`}
                      >
                        {statusConfig?.label || opp.status}
                      </Badge>
                    </div>

                    <h3 className="mt-4 text-headline-md group-hover:text-primary transition-colors">
                      {opp.title}
                    </h3>

                    {opp.organizer && (
                      <p className="mt-1 text-xs text-muted-foreground">by {opp.organizer}</p>
                    )}

                    {opp.description && (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {opp.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {ECOSYSTEM_LABELS[opp.ecosystem] || opp.ecosystem}
                      </Badge>
                      {opp.prize && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        >
                          <DollarSign className="mr-0.5 h-3 w-3" />
                          {opp.prize}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {opp.deadline && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(opp.deadline)}
                          </span>
                        )}
                        {urgency && (
                          <span
                            className={`flex items-center gap-1 text-xs font-medium ${urgency.className}`}
                          >
                            <Clock className="h-3 w-3" />
                            {urgency.label}
                          </span>
                        )}
                      </div>
                      {opp.apply_url?.startsWith("/") ? (
                        // Pages on this site open in the same tab.
                        <Button asChild size="sm" className="text-xs">
                          <a href={opp.apply_url}>Apply</a>
                        </Button>
                      ) : opp.apply_url ? (
                        <Button asChild variant="outline" size="sm" className="text-xs">
                          <a href={opp.apply_url} target="_blank" rel="noopener noreferrer">
                            Apply <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs" disabled>
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16 text-center">
          <Trophy className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-headline-lg">DON&apos;T MISS OUT</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Stay updated on the latest hackathons, grants, and programs across all ecosystems.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-semibold tracking-wide">
              <Link to="/join">
                Join BlockchainClub FUTMinna <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
