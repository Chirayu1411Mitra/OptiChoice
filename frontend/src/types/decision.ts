export type CriterionType = "benefit" | "cost";
export type DecisionStatus = "draft" | "completed";

export interface Alternative {
  id: string;
  name: string;
  productInfo?: {
    source: string;
    sourceUrl: string;
    fetchedAt: string;
    price: number | null;
    priceLabel: string | null;
    productId?: string | null;
    specs?: {
      batteryHours: number | null;
      batteryLabel: string | null;
      batterySourceUrl: string | null;
      weightKg: number | null;
      weightLabel: string | null;
      weightSourceUrl: string | null;
      performanceScore: number | null;
      performanceLabel: string | null;
      performanceSourceUrl: string | null;
      fetchedAt: string;
    };
  };
}

export interface Criterion {
  id: string;
  name: string;
  /** Indicates whether larger raw values are more or less desirable. */
  type: CriterionType;
  /** Optional display unit such as ₹, hours, or kg. */
  unit: string;
  /** Importance as a percentage (0–100). All criterion weights must total 100. */
  weight: number;
}

export interface Rating {
  alternativeId: string;
  criterionId: string;
  value: number;
}

export interface RankingResult {
  alternativeId: string;
  alternativeName: string;
  rank: number;
  /** Score returned by the decision engine (0–100). */
  score: number;
}

export interface ScoreBreakdown {
  alternativeId: string;
  contributions: { criterionId: string; criterionName: string; value: number; inputValue?: number; normalizedValue?: number; unit?: string }[];
}

export interface WhatIfScenario {
  id: string;
  label: string;
  weights: Record<string, number>;
  ranking: RankingResult[];
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  status: DecisionStatus;
  scoringMode?: "rating" | "relative";
  createdAt: string;
  updatedAt: string;
  alternatives: Alternative[];
  criteria: Criterion[];
  ratings: Rating[];
  /** Present only after the backend has evaluated the decision. */
  ranking?: RankingResult[];
}

