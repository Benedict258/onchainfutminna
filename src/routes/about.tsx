import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TriangleAlert as AlertTriangle, Network, Layers, Eye, Rocket } from "lucide-react";
import chip from "@/assets/chip.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About  Architecting Web3 in Nigeria | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Blockchain Club FUTMinna is a community of builders, researchers, and pioneers dedicated to driving decentralized innovation from the heart of Minna.",
      },
      { property: "og:title", content: "About  Blockchain Club FUTMinna" },
      { property: "og:description", content: "Architecting the future of Web3 in Nigeria." },
    ],
  }),
  component: AboutPage,
});

const TEAM = [
  { name: "Ibrahim Musa", handle: "CyberSage", role: "Lead Core Developer" },
  { name: "Fatima Bello", handle: "ZkQueen", role: "Ecosystem Strategist" },
  { name: "Samuel Okon", handle: "ChainLinker", role: "Smart Contract Engineer" },
  { name: "Chidera Okafor", handle: "Y-Node", role: "Research Lead" },
  { name: "Victor Adamu", handle: "SolDev", role: "Frontend Architect" },
  { name: "Aisha Umar", handle: "DaoDiva", role: "Community Operations" },
];

function AboutPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            Blockchain Club FUTMinna
          </span>
          <h1 className="mt-8 text-display-lg">
            Architecting the Future of Web3 in
            <br />
            <span className="text-primary">Nigeria.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Blockchain Club FUTMinna is a community of builders, researchers, and pioneers dedicated
            to driving decentralized innovation from the heart of Minna.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-16 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-headline-lg">THE CHALLENGE</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Despite Africa's rapid crypto adoption, a critical gap remains in technical depth and
            local application building.
          </p>
          <ul className="mt-8 space-y-5">
            <li className="flex gap-4 items-start">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lack of specialized Web3 engineering curriculum in traditional academia.
              </p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                <Network className="h-4 w-4" />
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Disconnected talent pools working in isolation without collaborative structures.
              </p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                <Layers className="h-4 w-4" />
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Barriers to entry for developers navigating complex multi-chain ecosystems.
              </p>
            </li>
          </ul>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <img
            src={chip}
            alt="Microprocessor with blockchain etching"
            width={1024}
            height={1024}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      </section>

      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16 grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-8 hover:border-primary/40 transition-colors">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
              <Eye className="h-4 w-4" />
            </span>
            <h3 className="mt-5 text-headline-md">Our Vision</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              To establish FUTMinna as the premier hub for blockchain innovation in West Africa,
              producing world-class talent capable of building resilient decentralized systems.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-8 hover:border-primary/40 transition-colors">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
              <Rocket className="h-4 w-4" />
            </span>
            <h3 className="mt-5 text-headline-md">Our Mission</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              To bridge the knowledge gap through structured learning, hands-on development, and
              direct ecosystem partnerships, empowering students to build in public.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="text-center">
          <h2 className="text-headline-lg">OUR STORY</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              y: "2022",
              l: "THE GENESIS",
              t: "Founded by a small group of computer science students fascinated by Ethereum's programmable state machine.",
            },
            {
              y: "2023",
              l: "EXPANSION",
              t: "Secured university recognition and hosted the first University-wide Web3 Summit with 500+ attendees.",
            },
            {
              y: "2024",
              l: "BUILD PHASE",
              t: "Launching the BlockchainClub FUTMinna Lab  a physical space for students to experiment with ZK proofs and L2 scaling solutions.",
            },
          ].map((s) => (
            <div
              key={s.y}
              className="rounded-lg border border-border bg-card p-6 hover:border-primary/40 transition-colors"
            >
              <span className="font-mono text-3xl font-bold text-muted-foreground/40">{s.y}</span>
              <p className="mt-3 text-label-bold text-foreground">{s.l}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16">
          <h2 className="text-center text-headline-lg">WHAT MAKES US DIFFERENT</h2>
          <div className="mt-12 grid gap-px bg-border md:grid-cols-3 border border-border overflow-hidden rounded-lg">
            {[
              {
                t: "MULTI-ECOSYSTEM",
                d: "We are chain-agnostic. From Ethereum and Solana to Bitcoin Layers and Polkadot, we explore the tech where it shines brightest.",
              },
              {
                t: "BUILD-IN-PUBLIC",
                d: "Our code is open-source. We ship weekly updates, host GitHub workshops, and encourage radical transparency in development.",
              },
              {
                t: "AFRICAN CONTEXT",
                d: "We don't just build; we build for Africa. Solving local problems like remittance, identity, and supply chain through decentralized tech.",
              },
            ].map((c) => (
              <div key={c.t} className="bg-card p-7 hover:bg-surface-low transition-colors">
                <p className="text-label-bold text-outline">{c.t}</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <h2 className="text-headline-lg">THE LEAD BUILDERS</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="aspect-[4/5] bg-gradient-to-br from-surface-high to-surface-low flex items-center justify-center font-mono text-4xl font-bold text-muted-foreground/30">
                {m.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </div>
              <div className="p-5 border-t border-border">
                <p className="text-headline-md">{m.name}</p>
                <p className="font-mono text-sm text-primary">@{m.handle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low p-10 md:p-14 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <h2 className="text-headline-lg">
            READY TO JOIN THE
            <br />
            NEXT BLOCK?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Whether you're a beginner or an experienced dev, there's a place for you in our
            ecosystem.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-semibold tracking-wide">
              <Link to="/join">Apply for Membership</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold tracking-wide">
              <Link to="/learn">Explore Resources</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
