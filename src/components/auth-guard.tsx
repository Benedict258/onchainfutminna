import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.navigate({ to: "/auth" });
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) return null;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export function AdminGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.navigate({ to: "/auth" });
    } else if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      router.navigate({ to: "/" });
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN"))
    return null;

  return <>{children}</>;
}
