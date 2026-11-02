import { createFileRoute } from "@tanstack/react-router";
import CreateDecision from "@/pages/CreateDecision";

export const Route = createFileRoute("/_authenticated/decisions/new")({
  head: () => ({
    meta: [
      { title: "New decision — OptiChoice" },
      { name: "description", content: "Start a new structured decision." },
      { property: "og:title", content: "New decision — OptiChoice" },
      { property: "og:description", content: "Start a new structured decision." },
    ],
  }),
  component: CreateDecision,
});
