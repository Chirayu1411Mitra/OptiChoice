import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { NavLinks } from "./Sidebar";

export function Header({ title, actions }: { title: string; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
        <button
          className="-ml-1 rounded p-1.5 hover:bg-accent md:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-medium text-muted-foreground">{title}</h1>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 border-r bg-sidebar p-4 fade-in-up">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-sidebar-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
