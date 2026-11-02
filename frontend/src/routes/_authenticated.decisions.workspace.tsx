import { createFileRoute } from "@tanstack/react-router";
import DecisionWorkspace from "@/pages/DecisionWorkspace";

export const Route = createFileRoute("/_authenticated/decisions/workspace")({
  head: () => ({
    meta: [
      { title: "Decision workspace — OptiChoice" },
      { name: "description", content: "Add options, criteria, weights and ratings step by step." },
      { property: "og:title", content: "Decision workspace — OptiChoice" },
      { property: "og:description", content: "Add options, criteria, weights and ratings step by step." },
    ],
  }),
  component: DecisionWorkspace,
});
