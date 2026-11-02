import { Slider } from "@/components/ui/slider";
import type { Criterion } from "@/types/decision";

/** Collects importance percentages. Only validates the total — no scoring. */
export function WeightEditor({ items, onChange, onSplitEvenly }: { items: Criterion[]; onChange: (id: string, w: number) => void; onSplitEvenly: () => void }) {
  const total = items.reduce((s, c) => s + c.weight, 0);
  const ok = total === 100;
  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-lg border bg-card">
        {items.map((c) => (
          <li key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[10rem_1fr_5rem]">
            <label htmlFor={`w-${c.id}`} className="truncate text-sm font-medium">{c.name}</label>
            <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
              <Slider value={[c.weight]} max={100} step={1} onValueChange={([v]) => onChange(c.id, v ?? 0)} aria-label={`${c.name} weight`} />
            </div>
            <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 sm:col-start-auto sm:row-start-auto">
              <input
                id={`w-${c.id}`}
                type="number"
                min={0}
                max={100}
                value={c.weight}
                onChange={(e) => onChange(c.id, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="h-8 w-14 rounded-md border bg-background px-2 text-right text-sm tabular"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </li>
        ))}
      </ul>
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`} role="status">
        <span>
          Total: <span className="font-semibold tabular">{total}%</span>
          {!ok && <span> — weights must add up to exactly 100% ({total < 100 ? `${100 - total}% left` : `${total - 100}% over`}).</span>}
        </span>
        <button type="button" onClick={onSplitEvenly} className="text-xs font-medium underline underline-offset-2">Split evenly</button>
      </div>
    </div>
  );
}
