import { Link } from "@tanstack/react-router";
import { LayoutGrid, Plus, History, LogOut, Sparkles } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/decisions/new", label: "New decision", icon: Plus },
  { to: "/history", label: "History", icon: History },
] as const;

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {navItems.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-white/75 hover:text-sidebar-foreground"
          activeProps={{ className: "bg-white font-semibold text-sidebar-accent-foreground shadow-sm ring-1 ring-black/[.035]" }}
        >
          <Icon className="h-[17px] w-[17px] opacity-75 transition-transform group-hover:scale-105" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="hidden h-dvh w-[17rem] shrink-0 flex-col overflow-hidden border-r border-sidebar-border/80 bg-sidebar px-4 py-6 md:flex">
      <div className="shrink-0 px-2 pb-8">
        <Logo />
        <p className="mt-1 pl-9 text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground">Decision studio</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground/80">Workspace</p>
        <NavLinks />
        <div className="mt-8 rounded-2xl border border-primary/10 bg-primary-soft/70 p-4">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-primary shadow-sm"><Sparkles className="h-4 w-4" /></span>
          <p className="mt-3 text-sm font-semibold">Start with what matters</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">A few clear priorities can make any comparison easier.</p>
        </div>
      </div>
      <div className="mt-auto shrink-0 border-t pt-3">
        <div className="flex items-center gap-1.5">
          <Link to="/profile" aria-label="Open profile" className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/75">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              {user?.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user?.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          </Link>
          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
