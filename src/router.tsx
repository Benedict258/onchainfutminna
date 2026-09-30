import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isAuthPage, rememberReturnTo } from "@/lib/auth-redirect";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Any in-app navigation to sign in / sign up remembers where the user came from.
  if (typeof window !== "undefined") {
    router.subscribe("onBeforeNavigate", ({ fromLocation, toLocation }) => {
      if (isAuthPage(toLocation.pathname) && fromLocation) rememberReturnTo(fromLocation.href);
    });
  }

  return router;
};
