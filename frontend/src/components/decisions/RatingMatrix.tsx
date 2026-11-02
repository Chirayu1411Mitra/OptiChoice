import { ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { Alternative, Criterion } from "@/types/decision";

export const isValidValue = (v: unknown, scoringMode: "rating" | "relative") =>
  typeof v === "number" && Number.isFinite(v) && (scoringMode === "relative" || (v >= 0 && v <= 100));

interface Props {
  alternatives: Alternative[];
  criteria: Criterion[];
  ratings: Record<string, Record<string, number | "">>;
  scoringMode: "rating" | "relative";
  onChange?: (altId: string, critId: string, v: number | "") => void;
  onRefreshProduct?: (alternative: Alternative, detail: "battery" | "weight" | "performance") => Promise<boolean>;
}

/** Editable alternatives × criteria grid. */
export function RatingMatrix({ alternatives, criteria, ratings, scoringMode, onChange, onRefreshProduct }: Props) {
  const readOnly = !onChange;
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<Record<string, string>>({});

  async function refreshProduct(alternative: Alternative, detail: "battery" | "weight" | "performance") {
    if (!onRefreshProduct || refreshingId) return;
    setRefreshingId(alternative.id);
    setRefreshMessage((current) => ({ ...current, [alternative.id]: "" }));
    try {
      const found = await onRefreshProduct(alternative, detail);
      setRefreshMessage((current) => ({ ...current, [alternative.id]: found ? "Details refreshed." : "No new details found. You can keep trying or enter this value manually." }));
    } catch {
      setRefreshMessage((current) => ({ ...current, [alternative.id]: "Lookup failed. Try again in a moment." }));
    } finally {
      setRefreshingId(null);
    }
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] table-fixed text-sm">
        <colgroup>
          <col className="w-56" />
          {criteria.map((criterion) => <col key={criterion.id} className="w-40" />)}
        </colgroup>
        <thead>
          <tr className="border-b bg-muted/50">
            <th scope="col" className="sticky left-0 z-10 bg-muted px-4 py-2.5 text-left font-medium">Option</th>
            {criteria.map((c) => (
              <th key={c.id} scope="col" className="px-3 py-2.5 text-right font-medium">
                {c.name}
                <span className="mt-0.5 block text-[10px] font-normal tracking-wide text-muted-foreground">{scoringMode === "rating" ? c.type : c.type === "benefit" ? "Higher is better" : "Lower is better"}</span>
                {scoringMode === "relative" && c.unit && <span className="block text-[10px] font-normal text-muted-foreground">Unit: {c.unit}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {alternatives.map((a) => (
            <tr key={a.id}>
              <th scope="row" title={a.name} className="sticky left-0 z-[1] overflow-hidden bg-card px-4 py-2 text-left font-medium">
                <span className="block truncate">{a.name}</span>
              </th>
              {criteria.map((c) => {
                const v = ratings[a.id]?.[c.id] ?? "";
                const invalid = v !== "" && !isValidValue(v, scoringMode);
                const isPrice = /price|cost/i.test(c.name);
                const isBattery = /battery/i.test(c.name);
                const isWeight = /weight/i.test(c.name);
                const isPerformance = /performance|benchmark/i.test(c.name);
                const foundPrice = a.productInfo?.price !== null && a.productInfo?.price !== undefined;
                const foundBattery = a.productInfo?.specs?.batteryHours !== null && a.productInfo?.specs?.batteryHours !== undefined;
                const foundWeight = a.productInfo?.specs?.weightKg !== null && a.productInfo?.specs?.weightKg !== undefined;
                const foundPerformance = a.productInfo?.specs?.performanceScore !== null && a.productInfo?.specs?.performanceScore !== undefined;
                const lookupMissing = scoringMode === "relative" && a.productInfo && (
                  (isPrice && !foundPrice) || (isBattery && !foundBattery) || (isWeight && !foundWeight) || (isPerformance && !foundPerformance) || (!isPrice && !isBattery && !isWeight && !isPerformance)
                );
                return (
                  <td key={c.id} className="px-3 py-1.5 text-right">
                    {readOnly ? (
                      <span className="tabular">{v === "" ? "–" : `${v}${scoringMode === "relative" && c.unit ? ` ${c.unit}` : ""}`}</span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          {...(scoringMode === "rating" ? { min: 0, max: 100 } : { step: "any" })}
                          aria-label={`${a.name} — ${c.name}`}
                          aria-invalid={invalid}
                          value={v}
                          placeholder={scoringMode === "rating" ? "0–100" : "Value"}
                          onChange={(e) => onChange(a.id, c.id, e.target.value === "" ? "" : Number(e.target.value))}
                          className={`h-8 w-20 rounded-md border bg-background px-2 text-right tabular placeholder:text-muted-foreground/50 ${invalid ? "border-destructive text-destructive" : ""}`}
                        />
                        {scoringMode === "relative" && foundPrice && isPrice && (
                          <button type="button" onClick={() => onChange(a.id, c.id, a.productInfo!.price!)} className="max-w-32 truncate text-[10px] text-primary hover:underline" title={`Use listing price ${a.productInfo!.priceLabel ?? a.productInfo!.price}`}>
                            Use found price {a.productInfo!.priceLabel ?? a.productInfo!.price}
                          </button>
                        )}
                        {scoringMode === "relative" && foundBattery && isBattery && (
                          <span className="max-w-36 truncate text-[10px] text-primary">
                            <button type="button" onClick={() => onChange(a.id, c.id, a.productInfo!.specs!.batteryHours!)} className="hover:underline" title={`Use found battery runtime: ${a.productInfo!.specs!.batteryLabel ?? `${a.productInfo!.specs!.batteryHours} hours`}`}>
                              Use found {a.productInfo!.specs!.batteryHours} hours
                            </button>
                            {a.productInfo!.specs!.batterySourceUrl && <a className="ml-1 underline" href={a.productInfo!.specs!.batterySourceUrl} target="_blank" rel="noreferrer">Source</a>}
                          </span>
                        )}
                        {scoringMode === "relative" && foundWeight && isWeight && (
                          <span className="max-w-36 truncate text-[10px] text-primary">
                            <button type="button" onClick={() => onChange(a.id, c.id, a.productInfo!.specs!.weightKg!)} className="hover:underline" title={`Use found weight: ${a.productInfo!.specs!.weightLabel ?? `${a.productInfo!.specs!.weightKg} kg`}`}>
                              Use found {a.productInfo!.specs!.weightKg} kg
                            </button>
                            {a.productInfo!.specs!.weightSourceUrl && <a className="ml-1 underline" href={a.productInfo!.specs!.weightSourceUrl} target="_blank" rel="noreferrer">Source</a>}
                          </span>
                        )}
                        {scoringMode === "relative" && foundPerformance && isPerformance && (
                          <span className="max-w-40 truncate text-[10px] text-primary">
                            <button type="button" onClick={() => onChange(a.id, c.id, a.productInfo!.specs!.performanceScore!)} className="hover:underline" title={`Use ${a.productInfo!.specs!.performanceLabel ?? "found benchmark estimate"}`}>
                              Use Geekbench 6 score {a.productInfo!.specs!.performanceScore!.toLocaleString()}
                            </button>
                            {a.productInfo!.specs!.performanceSourceUrl && <a className="ml-1 underline" href={a.productInfo!.specs!.performanceSourceUrl} target="_blank" rel="noreferrer">Source</a>}
                          </span>
                        )}
                        {lookupMissing && (
                          <div className="flex max-w-40 flex-col items-end gap-1 text-[10px] leading-tight text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {isPrice || isBattery || isWeight || isPerformance ? "Not found online · enter manually" : "No automatic lookup for this detail"}
                              <a href={a.productInfo!.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Check listing for ${a.name}`} title="Check the product listing" className="shrink-0 hover:text-primary">
                                <ArrowUpRight className="h-3 w-3" />
                              </a>
                            </span>
                            {onRefreshProduct && a.productInfo!.productId && (isBattery || isWeight || isPerformance) && (
                              <button type="button" onClick={() => void refreshProduct(a, isBattery ? "battery" : isWeight ? "weight" : "performance")} disabled={!!refreshingId} className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-60">
                                {refreshingId === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                {refreshingId === a.id ? "Searching…" : "Try lookup again"}
                              </button>
                            )}
                            {refreshMessage[a.id] && <span role="status" className="max-w-40 text-right">{refreshMessage[a.id]}</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
