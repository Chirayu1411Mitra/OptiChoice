import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/pages/Profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — OptiChoice" },
      { name: "description", content: "Manage your OptiChoice account." },
      { property: "og:title", content: "Profile — OptiChoice" },
      { property: "og:description", content: "Manage your OptiChoice account." },
    ],
  }),
  component: Profile,
});
