import { createFileRoute, Outlet } from "@tanstack/react-router";

// Pass-through layout for /auth/*: sign-in lives in ./index.tsx, and verify,
// forgot-password and reset-password render here as their own pages.
export const Route = createFileRoute("/auth")({
  component: Outlet,
});
