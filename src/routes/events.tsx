import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Send, Clock, Lightbulb, Tag } from "lucide-react";
import { getEvents } from "@/lib/api/events.server";

type EventFilter = "all" | "upcoming" | "past";

const TYPE_LABELS: Record<string, string> = {
  WORKSHOP: "Workshop",
  HACKATHON: "Hackathon",
  TALK: "Talk",
  BOOTCAMP: "Bootcamp",
  SOCIAL: "Social",
  OTHER: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  WORKSHOP: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  HACKATHON: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  TALK: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  BOOTCAMP: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  SOCIAL: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  OTHER: "bg-muted text-muted-foreground border-border",
};

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events  Workshops, Hackathons & Talks | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Upcoming and past events from Blockchain Club FUTMinna: workshops, hackathons, talks, and bootcamps.",
      },
      { property: "og:title", content: "BlockchainClub FUTMinna Events" },
      {
        property: "og:description",
        content: "Workshops, hackathons, talks, and bootcamps.",
      },
    ],
  }),
  component: EventsPage,
});

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

function EventsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EventsPage() {
  const matchRoute = useMatchRoute();
  const isIndex = !matchRoute({ to: "/events/$eventId" }) && !matchRoute({ to: "/events/request" });

  const [filter, setFilter] = useState<EventFilter>("all");

  const fetchEvents = useServerFn(getEvents);

  const { data, isLoading } = useQuery({
    queryKey: ["events", filter],
    queryFn: () =>
      fetchEvents({
        data: {
          page: 1,
          limit: 50,
          filter: filter === "all" ? "all" : filter,
        },
      }),
    suspense: true,
  });

  const events = data?.events ?? [];
  const featuredEvents = events.filter((e: any) => e.is_featured);
  const regularEvents = events.filter((e: any) => !e.is_featured);

  if (!isIndex) {
    return <Outlet />;
  }

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            EVENTS
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Workshops, Hackathons &<br />
            <span className="text-primary">More</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Join hands-on sessions that push the boundaries of decentralized technology. From
            beginner workshops to competitive hackathons.
          </p>
        </div>
      </section>

      {/* FILTER TABS */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as EventFilter)}>
            <TabsList className="bg-background/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* EVENTS GRID */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
        {isLoading ? (
          <EventsSkeleton />
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg text-muted-foreground">No events found.</p>
            <p className="mt-2 text-sm text-muted-foreground/60">
              Check back soon for upcoming events!
            </p>
          </div>
        ) : (
          <>
            {/* FEATURED EVENT */}
            {featuredEvents.length > 0 && filter !== "past" && (
              <div className="mb-10">
                <h2 className="text-headline-md mb-5">Featured Event</h2>
                {featuredEvents.slice(0, 1).map((event) => (
                  <article
                    key={event.id}
                    className="group relative rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-video md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        {event.cover_image ? (
                          <img
                            src={event.cover_image}
                            alt={event.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Calendar className="h-16 w-16 text-primary/30" />
                        )}
                      </div>
                      <div className="p-5 md:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={TYPE_COLORS[event.type] || TYPE_COLORS.OTHER}
                          >
                            {TYPE_LABELS[event.type] || event.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            Featured
                          </Badge>
                        </div>
                        <h3 className="mt-4 text-headline-lg">{event.title}</h3>
                        {event.description && (
                          <p className="mt-3 text-muted-foreground leading-relaxed">
                            {event.description.length > 150
                              ? event.description.slice(0, 150) + "..."
                              : event.description}
                          </p>
                        )}
                        <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(event.start_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {formatTime(event.start_date)}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                          {event.is_virtual && (
                            <span className="flex items-center gap-1.5">
                              <Tag className="h-4 w-4" />
                              Virtual
                            </span>
                          )}
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {event.event_rsvps?.length || 0} RSVPs
                          </span>
                          <Button asChild size="sm" className="ml-auto">
                            <Link to="/events/$eventId" params={{ eventId: event.id }}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* ALL EVENTS */}
            <h2 className="text-headline-md mb-5">
              {filter === "upcoming"
                ? "Upcoming Events"
                : filter === "past"
                  ? "Past Events"
                  : "All Events"}
            </h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(filter === "past" ? events : regularEvents).map((event) => (
                <article
                  key={event.id}
                  className="group rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="bg-gradient-to-br from-surface-high to-surface-low flex items-center justify-center">
                    {event.cover_image ? (
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Calendar className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${TYPE_COLORS[event.type] || TYPE_COLORS.OTHER}`}
                      >
                        {TYPE_LABELS[event.type] || event.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event.start_date)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-headline-sm">{event.title}</h3>
                    {event.description && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.event_rsvps?.length || 0}
                        </span>
                      </div>
                      {filter === "upcoming" && (
                        <Button asChild variant="outline" size="sm" className="text-xs">
                          <Link to="/events/$eventId" params={{ eventId: event.id }}>
                            RSVP
                          </Link>
                        </Button>
                      )}
                      {filter === "past" && (
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                          <Link to="/events/$eventId" params={{ eventId: event.id }}>
                            Recap
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16 text-center">
          <div className="mx-auto max-w-xl">
            <Lightbulb className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-6 text-headline-lg">Have an Event Idea?</h2>
            <p className="mt-3 text-muted-foreground">
              Propose a workshop, talk, or hackathon. We'll help you bring it to life.
            </p>
            <Button asChild size="lg" className="mt-8 font-semibold tracking-wide">
              <Link to="/events/request">
                Submit Event Request <Send className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
