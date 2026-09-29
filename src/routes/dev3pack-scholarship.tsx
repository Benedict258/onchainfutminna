import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dev3pack-scholarship")({
  beforeLoad: () => {
    throw redirect({
      to: "/scholarships/dev3pack-rust",
    });
  },
});


