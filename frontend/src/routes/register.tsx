import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — OptiChoice" },
      { name: "description", content: "Create a free OptiChoice account and start making structured decisions." },
      { property: "og:title", content: "Create account — OptiChoice" },
      { property: "og:description", content: "Start making structured, explainable decisions." },
    ],
  }),
  component: Register,
});
