import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-low mt-16">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/lightlogo.png"
                alt="BlockchainClub FUTMinna"
                className="h-30 w-auto dark:hidden"
              />
              <img
                src="/darklogo.png"
                alt="BlockchainClub FUTMinna"
                className="h-30 w-auto hidden dark:block"
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The authoritative hub for decentralized technology research and education at Federal
              University of Technology, Minna.
            </p>
          </div>

          <FooterCol
            title="Community"
            links={[
              { label: "X / Twitter", href: "https://x.com" },
              { label: "Telegram", href: "#" },
              { label: "WhatsApp", href: "#" },
              { label: "Discord", href: "#" },
            ]}
          />
          <FooterCol
            title="Resources"
            links={[
              { label: "GitHub", href: "https://github.com" },
              { label: "Documentation", href: "#" },
              { label: "Brand Assets", href: "#" },
              { label: "Blog", href: "/blog" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of Service", href: "#" },
              { label: "Partners", href: "/partners" },
              { label: "About", href: "/about" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border pt-6">
          <span className="text-xs text-muted-foreground">
            © 2026 Blockchain Club FUTMinna. All rights reserved.
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase text-outline">
            Decentralize · Build · Inhabit
          </span>
        </div>
      </div>

      {/* Subtle gradient bottom line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-label-bold text-outline mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith("/") ? (
              <Link
                to={l.href}
                className="text-sm text-on-surface-variant transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ) : (
              <a
                href={l.href}
                className="text-sm text-on-surface-variant transition-colors hover:text-primary"
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
