import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

/** Two-step inline delete: first click arms, second click confirms. */
export function ConfirmDelete({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return armed ? (
    <button type="button" onClick={onConfirm} className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/15">
      Confirm delete
    </button>
  ) : (
    <button type="button" onClick={() => setArmed(true)} aria-label={`Delete ${label}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
