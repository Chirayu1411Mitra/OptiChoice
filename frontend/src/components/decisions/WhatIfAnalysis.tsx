import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeightEditor } from "@/components/criteria/WeightEditor";
import { decisionService, type EvaluateRequest, type EvaluateResponse } from "@/services/decisionService";
import type { Criterion } from "@/types/decision";

function rebalance(items: Criterion[], changedId: string, requestedWeight: number): Criterion[] {
  const targetWeight = Math.max(0, Math.min(100, Math.round(requestedWeight)));
  const others = items.filter((item) => item.id !== changedId);
  if (others.length === 0) return items.map((item) => ({ ...item, weight: 100 }));

  const remaining = 100 - targetWeight;
  const oldTotal = others.reduce((sum, item) => sum + item.weight, 0);
  const shares = others.map((item, index) => {
    const raw = oldTotal > 0 ? (item.weight / oldTotal) * remaining : remaining / others.length;
    return { id: item.id, index, raw, weight: Math.floor(raw) };
  });
  let leftover = remaining - shares.reduce((sum, share) => sum + share.weight, 0);
  const byRemainder = [...shares].sort((a, b) => (b.raw - b.weight) - (a.raw - a.weight) || a.index - b.index);
  for (let i = 0; i < leftover; i += 1) {
    const share = byRemainder[i];
    if (share) share.weight += 1;
  }
  leftover = 0;
  const weightById = new Map(shares.map((share) => [share.id, share.weight]));

  return items.map((item) => ({
    ...item,
    weight: item.id === changedId ? targetWeight : (weightById.get(item.id) ?? item.weight),
  }));
}

function RankMovement({ from, to }: { from: number; to: number }) {
  if (from === to) return <span className="text-xs text-muted-foreground">No rank change</span>;
  const movedUp = to < from;
  const Icon = movedUp ? ArrowUp : ArrowDown;
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${movedUp ? "text-emerald-700" : "text-amber-700"}`}><Icon className="h-3.5 w-3.5" />{movedUp ? `Up ${from - to}` : `Down ${to - from}`}</span>;
}

function RankingCompare({ baseline, scenario }: { baseline: EvaluateResponse["ranking"]; scenario: EvaluateResponse["ranking"] }) {
  const scenarioWinner = scenario[0];
  const originalWinner = baseline[0];
  const winnerChanged = scenarioWinner?.alternativeId !== originalWinner?.alternativeId;

  return (
    <div>
      <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${winnerChanged ? "bg-amber-50 text-amber-900" : "bg-primary-soft/70 text-primary"}`}>
        {winnerChanged ? <><span className="font-semibold">The leading option changes.</span> {scenarioWinner?.alternativeName} moves ahead when you adjust these priorities.</> : <><span className="font-semibold">The same option stays on top.</span> Your current adjustment doesn’t change the leader.</>}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_5.25rem_5.25rem] gap-2 border-b bg-background px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1fr)_6rem_6rem]">
          <span>Option</span><span className="text-right">Original</span><span className="text-right">What if</span>
        </div>
        <ul className="divide-y">
          {baseline.map((item) => {
            const next = scenario.find((candidate) => candidate.alternativeId === item.alternativeId);
            if (!next) return null;
            return (
              <li key={item.alternativeId} className="grid grid-cols-[minmax(0,1fr)_5.25rem_5.25rem] items-center gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_6rem_6rem]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.alternativeName}</p>
                  <RankMovement from={item.rank} to={next.rank} />
                </div>
                <div className="text-right"><p className="tabular text-sm font-medium">{item.score.toFixed(2)}</p><div className="ml-auto mt-1 h-1 w-14 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full bg-muted-foreground/45" style={{ width: `${item.score}%` }} /></div></div>
                <div className="text-right"><p className={`tabular text-sm font-semibold ${next.rank === 1 ? "text-primary" : ""}`}>{next.score.toFixed(2)}</p><div className="ml-auto mt-1 h-1 w-14 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full bg-primary" style={{ width: `${next.score}%` }} /></div></div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-muted-foreground/45" /> Original</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-primary" /> What if</span><span>Scores are out of 100</span></div>
    </div>
  );
}

export function WhatIfAnalysis({ input, original }: { input: EvaluateRequest; original: EvaluateResponse }) {
  const [criteria, setCriteria] = useState<Criterion[]>(input.criteria);
  const scenario = decisionService.evaluateWithCriteria(input, criteria);

  return (
    <section className="mt-6 rounded-2xl border bg-background p-4 sm:p-6" aria-labelledby="what-if-heading">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Sparkles className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="what-if-heading" className="font-semibold tracking-tight">What if your priorities changed?</h3>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCriteria(input.criteria)} className="h-8 text-xs"><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          </div>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Adjust a priority. The other weights rebalance automatically to keep the total at 100%.</p>
        </div>
      </div>
      <div className="space-y-5">
        <WeightEditor
          items={criteria}
          onChange={(id, value) => setCriteria((current) => rebalance(current, id, value))}
          onSplitEvenly={() => {
            const count = criteria.length;
            if (!count) return;
            const base = Math.floor(100 / count);
            const remainder = 100 - base * count;
            setCriteria((current) => current.map((criterion, index) => ({ ...criterion, weight: base + (index < remainder ? 1 : 0) })));
          }}
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight className="h-3.5 w-3.5" /> Ranking recalculates instantly using the same entered values.</div>
        <RankingCompare baseline={original.ranking} scenario={scenario.ranking} />
      </div>
    </section>
  );
}
