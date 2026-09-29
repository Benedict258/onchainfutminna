import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen, Code as Code2, Users, Briefcase, ShieldCheck, Cpu, Download } from "lucide-react";
import researchLab from "@/assets/research-lab.jpg";
import eventHackathon from "@/assets/event-hackathon.jpg";
import slide1 from "@/assets/slide1.jpg";
import slide2 from "@/assets/slide2.jpg";
import { getProjects } from "@/lib/api/projects.server";
import { getBlogPosts } from "@/lib/api/blog.server";
import { getEvents } from "@/lib/api/events.server";
import { PageShell } from "@/components/layout/page-shell";

const heroImages = [
  { src: slide1, alt: "Blockchain Club FUTMinna" },
  { src: slide2, alt: "Blockchain Club FUTMinna" },
];

function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isHovered, next]);

  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/10" }}>
        {heroImages.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === current ? 1 : 0 }}
          />
        ))}
      </div>
      <div className="bg-surface-low px-5 py-3 flex items-center justify-center gap-2">
        {heroImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blockchain Club FUTMinna — Home for Web3 Builders" },
      { name: "description", content: "FUTMinna's premier hub for blockchain innovation, decentralized development, and academic excellence in West Africa." },
      { property: "og:title", content: "Blockchain Club FUTMinna" },
      { property: "og:description", content: "Home for Web3 builders. Empowering the next wave of protocol engineers." },
    ],
  }),
  component: Home,
});

function Home() {
  const fetchProjects = useServerFn(getProjects);
  const fetchPosts = useServerFn(getBlogPosts);
  const fetchEvents = useServerFn(getEvents);

  const { data: projectsData } = useQuery({
    queryKey: ["home-projects"],
    queryFn: () => fetchProjects({ data: { page: 1, limit: 3, featured: true } }),
    suspense: true,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["home-events"],
    queryFn: () => fetchEvents({ data: { page: 1, limit: 3, filter: "upcoming" } }),
    suspense: true,
  });

  const { data: postsData } = useQuery({
    queryKey: ["home-posts"],
    queryFn: () => fetchPosts({ data: { page: 1, limit: 3 } }),
  });

  const events = eventsData?.events ?? [];
  const projects = projectsData?.projects ?? [];
  const posts = postsData?.posts ?? [];

  return (
    <div className="bg-background">
      <PageShell>
        {/* HERO */}
        <section className="border-b border-border">
           <div className="py-12 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            Blockchain Club FUTMinna
          </span>
          <h1 className="mt-6 text-display-lg md:text-[64px] md:leading-[68px] tracking-tight">
            FUTMinna's Home for<br />
            <span className="text-primary">Web3 Builders</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            The premier hub for blockchain innovation, decentralized development, and academic excellence in West Africa. Empowering the next wave of protocol engineers.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="https://chat.whatsapp.com/IZBSVUSyxayE0nTqO71HRt" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="font-semibold tracking-wide" asChild>
                <span>Join the Community</span>
              </Button>
            </a>
            <Button asChild size="lg" variant="outline" className="font-semibold tracking-wide">
              <Link to="/learn">Explore Learn</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ROOTED IN RESEARCH */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16 grid gap-12 lg:grid-cols-2 lg:items-center">
        <ImageCarousel />
        <div>
          <h2 className="text-headline-lg">ROOTED IN RESEARCH,<br />DRIVEN BY CODE</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Blockchain Club FUTMinna is more than just a community; it's an incubator for the next generation of decentralized finance and Web3 infrastructure builders.
          </p>
          <ul className="mt-8 space-y-5">
            <li className="flex gap-4 items-start">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-sm">Academic Integrity</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Rigorous research-driven approach to protocol analysis and development.</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                <Cpu className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-sm">Builder-First Culture</p>
                <p className="mt-0.5 text-sm text-muted-foreground">We value shipping code and deploying smart contracts over empty speculation.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* CORE PILLARS */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
          <div className="text-center">
            <h2 className="text-headline-lg">CORE PILLARS</h2>
            <p className="mt-3 text-muted-foreground">How we accelerate the Web3 adoption curve within the university ecosystem.</p>
          </div>
          <div className="mt-10 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4 border border-border overflow-hidden rounded-lg">
            {[
              { i: BookOpen, t: "Education", d: "Deep dive technical workshops from Solidity foundations to advanced ZK math." },
              { i: Code2, t: "Hackathons", d: "Quarterly intensive build sessions with mainnet ecosystem grant prizes." },
              { i: Users, t: "Community", d: "Networking with global builders and local peers in an inclusive, high-output environment." },
              { i: Briefcase, t: "Industry Exposure", d: "Direct pipelines to internships, job opportunities, and venture capital funding." },
            ].map((p) => (
              <div key={p.t} className="bg-card p-7 hover:bg-surface-low transition-colors group">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-high text-primary group-hover:border-primary/30 transition-colors">
                  <p.i className="h-4 w-4" />
                </span>
                <p className="mt-5 text-label-bold text-foreground">{p.t}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING DEPLOYMENTS */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
        <h2 className="text-headline-lg">UPCOMING<br />DEPLOYMENTS</h2>
        {events.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {events.slice(0, 3).map((event: any) => (
              <Link
                key={event.id}
                to="/events/$eventId"
                params={{ eventId: event.id }}
                className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                  {event.cover_image ? (
                    <img
                      src={event.cover_image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl text-primary/30">📅</span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-label-bold text-outline">
                    {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <h3 className="mt-2 text-headline-md group-hover:text-primary transition-colors">{event.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{event.description || ""}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* PAST EVENTS */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
        <div className="space-y-4">
          <h3 className="text-headline-lg">PAST EVENTS</h3>
          <div className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="aspect-[4/3] md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                <img
                  src="/vibe-coding.jpg"
                  alt="AI Vibe-Coding Workshop"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <Badge variant="secondary" className="text-xs mb-2">WORKSHOP</Badge>
                  <h3 className="text-headline-md">AI Vibe-Coding Workshop</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    An online session on vibe-coding with AI, featuring Noah AI. Held on 11th July 2026.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="aspect-[4/3] md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                <img
                  src="/onboard.png"
                  alt="Blockchain Club Onboarding"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <Badge variant="secondary" className="text-xs mb-2">ONBOARDING</Badge>
                  <h3 className="text-headline-md">Blockchain Onboarding Session</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Welcome session for new members — covered club structure, roadmap, and getting started with Web3 development.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="/ONCHAIN FUTMINNA.pdf" download className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-high px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-low transition-colors">
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </a>
                  <a href="/blockchain Onboarding.pptx" download className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-high px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-low transition-colors">
                    <Download className="h-3.5 w-3.5" /> Download PPTX
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHIPPED PROTOCOLS */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
          <h2 className="text-headline-lg">SHIPPED PROTOCOLS</h2>
          <p className="mt-2 text-muted-foreground">High-impact projects developed by our student body.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {projects.slice(0, 3).map((project: any, i: number) => (
              <Link
                key={project.id}
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className={`group relative block rounded-lg border border-border bg-card ${i === 0 ? 'p-6' : 'p-5'} transition-all hover:border-primary/50 hover:shadow-sm overflow-hidden`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-r" />
                <span className="text-label-bold text-primary bg-primary/8 border border-primary/20 rounded px-2 py-0.5">{project.ecosystem || 'PROJECT'}</span>
                <p className={`${i === 0 ? 'mt-4 text-headline-md' : 'mt-3 text-headline-md'}`}>{project.name}</p>
                <p className={`${i === 0 ? 'mt-2 text-sm' : 'mt-1 text-sm'} text-muted-foreground leading-relaxed`}>{project.headline || project.description}</p>
                {i === 0 && (
                  <div className="mt-8 flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Project <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Link>
            ))}
            <Link
              to="/projects"
              className="flex items-center justify-center rounded-lg border border-dashed border-border bg-transparent p-5 text-label-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              SUBMIT YOUR PROJECT →
            </Link>
          </div>
        </div>
      </section>

      {/* COMMUNITY LINKS */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 md:py-16">
        <h2 className="text-headline-lg text-center">CONNECT WITH US</h2>
        <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <a
            href="https://x.com/Onchainfutminna"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-border bg-card p-6 hover:border-primary/30 transition-all hover:shadow-sm hover:-translate-y-0.5 text-center"
          >
            <svg className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <p className="mt-3 text-label-bold text-foreground group-hover:text-primary transition-colors">X / Twitter</p>
            <p className="mt-1 text-xs text-muted-foreground">Follow us for updates.</p>
          </a>
          <a
            href="https://t.me/bcfutminna"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-border bg-card p-6 hover:border-primary/30 transition-all hover:shadow-sm hover:-translate-y-0.5 text-center"
          >
            <svg className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.41-.88.03-.24.37-.49 1.02-.74 3.97-1.73 6.62-2.87 7.95-3.42 3.78-1.57 4.57-1.85 5.08-1.86.11 0 .37.03.54.16.14.11.18.26.2.38.02.12.04.38.02.59z"/>
            </svg>
            <p className="mt-3 text-label-bold text-foreground group-hover:text-primary transition-colors">Telegram</p>
            <p className="mt-1 text-xs text-muted-foreground">Join our Telegram group.</p>
          </a>
          <a
            href="https://chat.whatsapp.com/IZBSVUSyxayE0nTqO71HRt"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-border bg-card p-6 hover:border-primary/30 transition-all hover:shadow-sm hover:-translate-y-0.5 text-center"
          >
            <svg className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            <p className="mt-3 text-label-bold text-foreground group-hover:text-primary transition-colors">WhatsApp</p>
            <p className="mt-1 text-xs text-muted-foreground">Join the community chat.</p>
          </a>
          <a
            href="https://discord.gg/blockchainclub"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-border bg-card p-6 hover:border-primary/30 transition-all hover:shadow-sm hover:-translate-y-0.5 text-center"
          >
            <svg className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <p className="mt-3 text-label-bold text-foreground group-hover:text-primary transition-colors">Discord</p>
            <p className="mt-1 text-xs text-muted-foreground">Join discussions & get help.</p>
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-16">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low p-6 md:p-12 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <h2 className="text-headline-lg">READY TO BUILD THE<br />PERMITTED FUTURE?</h2>
          <p className="mt-4 text-muted-foreground">Join 500+ builders at the forefront of the decentralized revolution.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-semibold tracking-wide">
              <Link to="/auth">Enter the Discord</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold tracking-wide">
              <Link to="/join">Apply for Fellowship</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
    </div>
  );
}
