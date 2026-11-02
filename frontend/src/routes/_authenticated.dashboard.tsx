import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OptiChoice" },
      { name: "description", content: "Your recent decisions and progress at a glance." },
      { property: "og:title", content: "Dashboard — OptiChoice" },
      { property: "og:description", content: "Your recent decisions and progress at a glance." },
    ],
  }),
  component: Dashboard,
});
