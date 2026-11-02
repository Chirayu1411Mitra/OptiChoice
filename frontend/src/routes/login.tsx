import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — OptiChoice" },
      { name: "description", content: "Log in to OptiChoice to continue your decisions." },
      { property: "og:title", content: "Log in — OptiChoice" },
      { property: "og:description", content: "Log in to OptiChoice to continue your decisions." },
    ],
  }),
  component: Login,
});
