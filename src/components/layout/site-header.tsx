import { Link, useRouter } from "@tanstack/react-router";
import { Moon, Sun, Menu, X, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { apiLogout } from "@/lib/api-client";

const NAV = [
  { to: "/", label: "Explore" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
] as const;

const LEARN_CATEGORIES = [
  { to: "/learn", label: "Development" },
  { to: "/learn/design", label: "Design" },
  { to: "/learn/marketing", label: "Marketing" },
  { to: "/learn/community-management", label: "Community Management" },
  { to: "/learn/content-creation", label: "Content Creation" },
  { to: "/learn/research", label: "Research" },
] as const;

function useTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("bcf-theme", next ? "dark" : "light");
    } catch {}
    setIsDark(next);
  };
  return { isDark, toggle };
}

export function SiteHeader() {
  const { isDark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, accessToken, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  function getInitials(name?: string) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleLogout() {
    if (accessToken) {
      try {
        await apiLogout(accessToken);
      } catch {}
    }
    storeLogout();
    router.navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6">
        {/* Logo  flush left in dark mode */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/lightlogo.png"
            alt="BlockchainClub FUTMinna"
            className="h-8 md:h-10 w-auto dark:hidden"
          />
          <img
            src="/darklogo.png"
            alt="BlockchainClub FUTMinna"
            className="h-8 md:h-10 w-auto hidden dark:block"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="relative px-3 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-foreground rounded-md hover:bg-surface-high"
              activeProps={{
                className:
                  "relative px-3 py-1.5 text-sm font-medium text-primary rounded-md bg-surface-high",
              }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative px-3 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-foreground rounded-md hover:bg-surface-high inline-flex items-center gap-1">
                Learn
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 5L6 8L9 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              {LEARN_CATEGORIES.map((cat) => (
                <DropdownMenuItem key={cat.to} asChild>
                  <Link to={cat.to} className="cursor-pointer">
                    {cat.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-on-surface-variant transition-colors hover:text-foreground hover:bg-surface-high"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {mounted && isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    {user.profile?.avatarUrl && (
                      <AvatarImage src={user.profile.avatarUrl} alt={user.profile?.fullName} />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {getInitials(user.profile?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    {user.profile?.avatarUrl && (
                      <AvatarImage src={user.profile.avatarUrl} alt={user.profile?.fullName} />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {getInitials(user.profile?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user.profile?.fullName || "Member"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden sm:inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-on-surface-variant transition-colors hover:text-foreground hover:bg-surface-high"
              >
                Sign In
              </Link>
              <Link
                to="/join"
                className="hidden sm:inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:opacity-80"
              >
                Join the Club
              </Link>
            </>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-on-surface-variant lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div className="lg:hidden border-t border-border bg-surface">
          <nav className="mx-auto flex max-w-[1400px] flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-foreground hover:bg-surface-high"
                activeProps={{
                  className:
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary bg-surface-high",
                }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-1">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Learn
              </p>
              {LEARN_CATEGORIES.map((cat) => (
                <Link
                  key={cat.to}
                  to={cat.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-foreground hover:bg-surface-high"
                  activeProps={{
                    className:
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary bg-surface-high",
                  }}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="mt-2 flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  to="/join"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Join the Club
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
