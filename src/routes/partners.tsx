import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Handshake,
  ArrowRight,
  ExternalLink,
  Globe,
  Mail,
  Building,
  Users,
  Heart,
} from "lucide-react";
import { getPartners } from "@/lib/api/partners.server";

const CATEGORY_LABELS: Record<string, string> = {
  ECOSYSTEM: "Ecosystem Partners",
  COMMUNITY: "Community Partners",
  SPONSOR: "Sponsors",
};

const CATEGORY_ICONS: Record<string, typeof Building> = {
  ECOSYSTEM: Globe,
  COMMUNITY: Users,
  SPONSOR: Heart,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  ECOSYSTEM:
    "The protocols and foundations that power our learning tracks and provide ecosystem support.",
  COMMUNITY:
    "Organizations and communities that collaborate with us on events, content, and outreach.",
  SPONSOR:
    "Companies and entities that financially support our mission and events.",
};

function PartnersSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-6 space-y-4"
        >
          <Skeleton className="h-14 w-14 rounded-lg" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Ecosystem and community partners of Blockchain Club FUTMinna.",
      },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const fetchPartners = useServerFn(getPartners);

  const { data: ecosystemPartners, isLoading: ecoLoading } = useQuery({
    queryKey: ["partners", "ECOSYSTEM"],
    queryFn: () => fetchPartners({ data: { category: "ECOSYSTEM" } }),
  });

  const { data: communityPartners, isLoading: comLoading } = useQuery({
    queryKey: ["partners", "COMMUNITY"],
    queryFn: () => fetchPartners({ data: { category: "COMMUNITY" } }),
  });

  const { data: sponsors, isLoading: sponsorLoading } = useQuery({
    queryKey: ["partners", "SPONSOR"],
    queryFn: () => fetchPartners({ data: { category: "SPONSOR" } }),
  });

  const categories = [
    { key: "ECOSYSTEM", data: ecosystemPartners, loading: ecoLoading },
    { key: "COMMUNITY", data: communityPartners, loading: comLoading },
    { key: "SPONSOR", data: sponsors, loading: sponsorLoading },
  ];

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            PARTNERS
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Building <span className="text-primary">Together</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            The foundations, communities, and organizations that collaborate with
            us to drive Web3 adoption from campus to the world.
          </p>
        </div>
      </section>

      {/* PARTNER CATEGORIES */}
      {categories.map(({ key, data: partners, loading }) => {
        const Icon = CATEGORY_ICONS[key] || Building;
        const partnerList = partners ?? [];

        return (
          <section
            key={key}
            className="border-b border-border last:border-b-0"
          >
            <div className="mx-auto max-w-[1400px] px-6 py-16">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="text-headline-lg">{CATEGORY_LABELS[key]}</h2>
              </div>
              <p className="text-muted-foreground mb-8">
                {CATEGORY_DESCRIPTIONS[key]}
              </p>

              {loading ? (
                <PartnersSkeleton />
              ) : partnerList.length === 0 ? (
                <div className="text-center py-12 rounded-lg border border-dashed border-border">
                  <Building className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No partners in this category yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {partnerList.map((partner) => (
                    <div
                      key={partner.id}
                      className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-high text-lg font-bold text-primary">
                          {partner.logoUrl ? (
                            <img
                              src={partner.logoUrl}
                              alt={partner.name}
                              className="h-10 w-10 object-contain"
                            />
                          ) : (
                            partner.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {partner.name}
                          </p>
                          {partner.website && (
                            <a
                              href={partner.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              Visit <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      {partner.description && (
                        <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {partner.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="border-t border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16 text-center">
          <div className="relative overflow-hidden rounded-xl border border-border bg-background p-10 md:p-14">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <Handshake className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-6 text-headline-lg">PARTNER WITH US</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              We&apos;re always looking for partners who share our vision of
              building Africa&apos;s next generation of Web3 talent. Let&apos;s
              create impact together.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="font-semibold tracking-wide"
              >
                <a href="mailto:partners@bcfutminna.org">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Us
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="font-semibold tracking-wide"
              >
                <Link to="/about">Learn More About BlockchainClub FUTMinna</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              partners@bcfutminna.org
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


