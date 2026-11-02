import { createFileRoute } from "@tanstack/react-router";
import VerifyEmail from "@/pages/VerifyEmail";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search["token"] === "string" ? search["token"] : "" }),
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { token } = Route.useSearch();
  return <VerifyEmail token={token} />;
}
