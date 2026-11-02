import { createFileRoute } from "@tanstack/react-router";
import History from "@/pages/History";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — OptiChoice" },
      { name: "description", content: "Browse, search and filter your past decisions." },
      { property: "og:title", content: "History — OptiChoice" },
      { property: "og:description", content: "Browse, search and filter your past decisions." },
    ],
  }),
  component: History,
});
