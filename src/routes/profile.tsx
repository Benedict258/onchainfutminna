import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  component: ProfileLayout,
});

function ProfileLayout() {
  const location = useLocation();
  const isDevlog = location.pathname.startsWith("/profile/devlog");

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          <Link
            to="/profile"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              !isDevlog
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            My Profile
          </Link>
          <Link
            to="/profile/devlog"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              isDevlog
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            My DEVLOG
          </Link>
        </div>
        <Outlet />
      </div>
    </AuthGuard>
  );
}
