import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AdminGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  FolderGit2,
  Briefcase,
  FileText,
  Handshake,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/learn", label: "Learn", icon: BookOpen },
  { to: "/admin/projects", label: "Projects", icon: FolderGit2 },
  { to: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/partners", label: "Partners", icon: Handshake },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-full flex-col bg-card border-r border-border w-[240px]">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="text-headline-md">Admin Panel</span>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/admin" }}
              activeProps={{
                className: "bg-primary/10 text-primary",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:text-foreground hover:bg-muted",
              }}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-border p-4">
        <div className="mb-2 text-xs text-muted-foreground">Signed in as</div>
        <div className="text-sm font-medium truncate">{user?.profile?.fullName || user?.email}</div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <SidebarContent />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] p-0">
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6 md:p-8 md:pl-8">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
