import { Check } from "lucide-react";

export function StepIndicator({ steps, current, maxReached, onSelect }: { steps: string[]; current: number; maxReached: number; onSelect: (i: number) => void }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">STEP {current + 1} OF {steps.length}</p>
          <p className="mt-1 text-sm font-semibold">{steps[current]}</p>
        </div>
        <p className="text-xs text-muted-foreground">Your progress saves as you go</p>
      </div>
      <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Progress">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const enabled = i <= maxReached;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-1">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(i)}
                aria-label={`Step ${i + 1}: ${label}`}
                aria-current={active ? "step" : undefined}
                className={`flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed sm:px-2.5 sm:text-sm ${active ? "font-semibold text-foreground" : enabled ? "text-muted-foreground hover:bg-accent hover:text-foreground" : "text-muted-foreground/50"}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary-soft text-primary" : "border bg-background"}`}>
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden truncate lg:inline">{label}</span>
              </button>
              {i < steps.length - 1 && <span className={`h-1 min-w-1 flex-1 rounded-full ${done ? "bg-primary/50" : "bg-border"}`} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
