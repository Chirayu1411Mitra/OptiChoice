import type { ReactNode } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-3 sm:p-5">
      <div className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[1.75rem] border bg-card shadow-sm sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1fr_.9fr]">
        <aside className="relative hidden overflow-hidden bg-[oklch(0.30_0.065_183)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="auth-orb auth-orb-a" /><div className="auth-orb auth-orb-b" />
          <div className="relative z-10">
            <Logo inverse />
            <p className="mt-1 pl-9 text-[10px] font-medium uppercase tracking-[.14em] text-teal-50/65">Decision studio</p>
          </div>
          <div className="relative z-10 max-w-lg py-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-teal-50"><Sparkles className="h-3.5 w-3.5" /> Clarity for the choices that matter</span>
            <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Make space for a more thoughtful choice.</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-teal-50/75">Bring your options and priorities together. See the trade-offs, then decide with confidence.</p>
            <div className="mt-8 grid max-w-sm gap-3 text-sm text-teal-50/90">
              {["Compare options side by side", "Prioritize what matters to you", "Understand why an option leads"].map((item) => <p key={item} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/10"><Check className="h-3.5 w-3.5" /></span>{item}</p>)}
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-teal-50/55">Define <ArrowRight className="h-3 w-3" /> Prioritize <ArrowRight className="h-3 w-3" /> Compare <ArrowRight className="h-3 w-3" /> Decide</div>
        </aside>
        <main className="flex min-h-[calc(100vh-1.5rem)] flex-col items-center justify-center px-5 py-10 sm:min-h-[calc(100vh-2.5rem)] sm:px-10 lg:px-14">
          <div className="w-full max-w-[25rem] fade-in-up">
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo />
            </div>
            <div className="mb-8 lg:hidden">
              <span className="eyebrow">A CLEARER WAY TO CHOOSE</span>
            </div>
            <div className="mb-7">
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>
            <div className="rounded-2xl border bg-background/65 p-5 shadow-sm sm:p-7">{children}</div>
            {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
          </div>
        </main>
      </div>
    </div>
  );
}

export function Field({ id, label, error, children, aside }: { id: string; label: string; error?: string | undefined; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {aside}
      </div>
      {children}
      {error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
