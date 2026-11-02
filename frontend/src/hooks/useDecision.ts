import { useCallback, useEffect, useRef, useState } from "react";
import { decisionService } from "@/services/decisionService";
import type { Alternative, Criterion, CriterionType } from "@/types/decision";
import type { ProductSpecifications } from "@/services/decisionService";

export interface DecisionDraft {
  id?: string;
  scoringMode: "rating" | "relative";
  currentStep: number;
  maxReached: number;
  title: string;
  description: string;
  alternatives: Alternative[];
  criteria: Criterion[];
  /** ratings[alternativeId][criterionId] — raw input values, never scored here. */
  ratings: Record<string, Record<string, number | "">>;
}

const KEY = "optichoice.draft";
const uid = () => Math.random().toString(36).slice(2, 9);

export const emptyDraft: DecisionDraft = { scoringMode: "relative", title: "", description: "", alternatives: [], criteria: [], ratings: {}, currentStep: 0, maxReached: 0 };

export const exampleDraft: DecisionDraft = {
  scoringMode: "relative",
  currentStep: 0,
  maxReached: 0,
  title: "Which job offer should I accept?",
  description: "I’m comparing pay, flexibility, growth, and commute before choosing.",
  alternatives: [
    { id: "a1", name: "Northstar Software" },
    { id: "a2", name: "Greenfield Analytics" },
    { id: "a3", name: "Harbor Labs" },
  ],
  criteria: [
    { id: "c1", name: "Salary", type: "benefit", unit: "₹ lakh/year", weight: 35 },
    { id: "c2", name: "Remote days", type: "benefit", unit: "days/week", weight: 25 },
    { id: "c3", name: "Growth", type: "benefit", unit: "out of 10", weight: 25 },
    { id: "c4", name: "Commute", type: "cost", unit: "minutes", weight: 15 },
  ],
  ratings: {
    a1: { c1: 18, c2: 3, c3: 8, c4: 35 },
    a2: { c1: 20, c2: 2, c3: 7, c4: 50 },
    a3: { c1: 16, c2: 5, c3: 9, c4: 25 },
  },
};

export type DraftSyncStatus = "idle" | "saving" | "saved" | "error";

export function saveDraft(d: DecisionDraft) {
  sessionStorage.setItem(KEY, JSON.stringify(d));
}

export function clearDraftIfMatching(id: string) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as { id?: string } | null;
    if (saved?.id === id) sessionStorage.removeItem(KEY);
  } catch {
    sessionStorage.removeItem(KEY);
  }
}

export function useDecision() {
  const [draft, setDraft] = useState<DecisionDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<DraftSyncStatus>("idle");
  const createRequest = useRef<Promise<{ id: string }> | null>(null);
  const syncSequence = useRef(0);
  const syncEnabled = useRef(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<DecisionDraft>;
        setDraft({ ...emptyDraft, ...saved, scoringMode: saved.scoringMode ?? "rating", currentStep: saved.currentStep ?? 0, maxReached: saved.maxReached ?? saved.currentStep ?? 0 });
      }
    } catch {
      /* ignore corrupt draft */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveDraft(draft);
  }, [draft, ready]);

  useEffect(() => {
    if (!syncEnabled.current || !ready || !draft.title.trim()) return;
    const sequence = ++syncSequence.current;
    const timer = window.setTimeout(async () => {
      if (!syncEnabled.current || syncSequence.current !== sequence) return;
      setSyncStatus("saving");
      try {
        let draftId = draft.id;
        if (!draftId) {
          createRequest.current ??= decisionService.createDraft(draft).then(({ id }) => ({ id }));
          const savedId = (await createRequest.current).id;
          draftId = savedId;
          createRequest.current = null;
          setDraft((current) => current.id ? current : { ...current, id: savedId });
        }
        await decisionService.updateDraft(draftId, draft);
        if (syncSequence.current === sequence) setSyncStatus("saved");
      } catch {
        createRequest.current = null;
        if (syncSequence.current === sequence) setSyncStatus("error");
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, ready]);

  const update = useCallback((patch: Partial<DecisionDraft>) => setDraft((d) => ({ ...d, ...patch })), []);

  const addAlternative = (name: string) =>
    setDraft((d) => ({ ...d, alternatives: [...d.alternatives, { id: uid(), name }] }));
  const addProductAlternative = (name: string, productInfo: NonNullable<Alternative["productInfo"]>) =>
    setDraft((d) => ({ ...d, alternatives: [...d.alternatives, { id: uid(), name, productInfo }] }));
  const renameAlternative = (id: string, name: string) =>
    setDraft((d) => ({ ...d, alternatives: d.alternatives.map((a) => (a.id === id ? { ...a, name } : a)) }));
  const removeAlternative = (id: string) =>
    setDraft((d) => {
      const { [id]: _, ...ratings } = d.ratings;
      return { ...d, alternatives: d.alternatives.filter((a) => a.id !== id), ratings };
    });
  const updateProductSpecifications = (id: string, specs: ProductSpecifications) =>
    setDraft((d) => ({
      ...d,
      alternatives: d.alternatives.map((alternative) => {
        if (alternative.id !== id || !alternative.productInfo) return alternative;
        const previous = alternative.productInfo.specs;
        return {
          ...alternative,
          productInfo: {
            ...alternative.productInfo,
            specs: {
              ...specs,
              batteryHours: specs.batteryHours ?? previous?.batteryHours ?? null,
              batteryLabel: specs.batteryLabel ?? previous?.batteryLabel ?? null,
              batterySourceUrl: specs.batterySourceUrl ?? previous?.batterySourceUrl ?? null,
              weightKg: specs.weightKg ?? previous?.weightKg ?? null,
              weightLabel: specs.weightLabel ?? previous?.weightLabel ?? null,
              weightSourceUrl: specs.weightSourceUrl ?? previous?.weightSourceUrl ?? null,
              performanceScore: specs.performanceScore ?? previous?.performanceScore ?? null,
              performanceLabel: specs.performanceLabel ?? previous?.performanceLabel ?? null,
              performanceSourceUrl: specs.performanceSourceUrl ?? previous?.performanceSourceUrl ?? null,
            },
          },
        };
      }),
    }));

  const addCriterion = (name: string, type: CriterionType, unit: string) =>
    setDraft((d) => ({ ...d, criteria: [...d.criteria, { id: uid(), name, type, unit, weight: 0 }] }));
  const updateCriterion = (id: string, patch: Partial<Criterion>) =>
    setDraft((d) => ({ ...d, criteria: d.criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const removeCriterion = (id: string) =>
    setDraft((d) => ({
      ...d,
      criteria: d.criteria.filter((c) => c.id !== id),
      ratings: Object.fromEntries(
        Object.entries(d.ratings).map(([a, r]) => {
          const { [id]: _, ...rest } = r;
          return [a, rest];
        }),
      ),
    }));

  const setRating = (altId: string, critId: string, value: number | "") =>
    setDraft((d) => ({ ...d, ratings: { ...d.ratings, [altId]: { ...d.ratings[altId], [critId]: value } } }));

  const completeDraft = useCallback(() => {
    syncEnabled.current = false;
    syncSequence.current += 1;
    setSyncStatus("idle");
  }, []);

  return {
    draft, ready, syncStatus, update, setDraft, completeDraft,
    addAlternative, addProductAlternative, renameAlternative, removeAlternative, updateProductSpecifications,
    addCriterion, updateCriterion, removeCriterion, setRating,
  };
}

export type DecisionApi = ReturnType<typeof useDecision>;
