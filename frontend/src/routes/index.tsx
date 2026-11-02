import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/states";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OptiChoice — Decide with clarity" },
      { name: "description", content: "OptiChoice helps you compare options, weigh priorities and understand the best choice." },
      { property: "og:title", content: "OptiChoice — Decide with clarity" },
      { property: "og:description", content: "Compare options, weigh priorities and understand the best choice." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready) navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [ready, user, navigate]);
  return <LoadingState />;
}
