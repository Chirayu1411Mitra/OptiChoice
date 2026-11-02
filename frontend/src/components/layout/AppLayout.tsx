import { useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { LoadingState } from "@/components/ui/states";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  if (!ready || !user) return <LoadingState />;

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>;
}
