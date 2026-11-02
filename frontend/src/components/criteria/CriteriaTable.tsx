import { useState, type FormEvent } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import type { Criterion, CriterionType } from "@/types/decision";

function TypeToggle({ value, onChange, label }: { value: CriterionType; onChange: (t: CriterionType) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={`${label} type`} className="inline-flex shrink-0 rounded-md border bg-background p-0.5 text-xs">
      {(["benefit", "cost"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${value === t ? "bg-primary-soft font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t === "benefit" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {t === "benefit" ? "Benefit" : "Cost"}
        </button>
      ))}
    </div>
  );
}

interface Props {
  items: Criterion[];
  scoringMode: "rating" | "relative";
  onAdd: (name: string, type: CriterionType, unit: string) => void;
  onUpdate: (id: string, patch: Partial<Criterion>) => void;
  onRemove: (id: string) => void;
}

export function CriteriaTable({ items, scoringMode, onAdd, onUpdate, onRemove }: Props) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState<CriterionType>("benefit");
  const duplicate = items.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || duplicate) return;
    onAdd(name.trim(), type, unit.trim());
    setName("");
    setUnit("");
    setType("benefit");
  }

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="divide-y rounded-lg border bg-card">
          {items.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <Input
                aria-label="Criterion name"
                value={c.name}
                onChange={(e) => onUpdate(c.id, { name: e.target.value })}
                className="h-8 min-w-0 flex-1 border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-input"
              />
              {scoringMode === "relative" && <Input
                aria-label={`${c.name} unit`}
                placeholder="Unit"
                value={c.unit ?? ""}
                maxLength={24}
                onChange={(e) => onUpdate(c.id, { unit: e.target.value })}
                className="h-8 w-24"
              />}
              <TypeToggle label={c.name} value={c.type} onChange={(t) => onUpdate(c.id, { type: t })} />
              <ConfirmDelete label={c.name} onConfirm={() => onRemove(c.id)} />
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <Input className="min-w-0 flex-1" placeholder="e.g. Battery life" value={name} onChange={(e) => setName(e.target.value)} aria-label="New criterion name" />
        {scoringMode === "relative" && <Input className="w-24" placeholder="Unit" value={unit} maxLength={24} onChange={(e) => setUnit(e.target.value)} aria-label="New criterion unit" />}
        <TypeToggle label="New criterion" value={type} onChange={setType} />
        <Button type="submit" variant="outline" disabled={!name.trim() || duplicate}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        {scoringMode === "relative"
          ? <>Choose whether higher or lower values are better. Add a unit (such as ₹, hours, or kg) to make entries clear.</>
          : <>This saved draft uses the earlier 0–100 rating method. Higher ratings always mean better; for Price, higher means more affordable.</>}
      </p>
    </div>
  );
}
