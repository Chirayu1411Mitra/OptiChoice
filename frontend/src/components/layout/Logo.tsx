import { Link } from "@tanstack/react-router";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${inverse ? "text-white" : "text-foreground"}`}>
      <span className={`grid h-8 w-8 place-items-center rounded-xl ${inverse ? "bg-white text-primary" : "bg-primary text-primary-foreground"}`}>
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
          <path d="M3 11.5 6.5 8l2.5 2.5L13 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">OptiChoice</span>
    </Link>
  );
}
