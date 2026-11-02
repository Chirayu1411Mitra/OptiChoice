import { z } from "zod";

export const evaluationRequestSchema = z.object({
  scoringMode: z.enum(["rating", "relative"]).default("rating"),
  draftId: z.uuid().optional(),
  title: z.string().trim().min(1, "Give your decision a title.").max(120),
  description: z.string().max(500),
  alternatives: z.array(z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    productInfo: z.object({
      source: z.string().max(120),
      sourceUrl: z.url(),
      fetchedAt: z.iso.datetime(),
      price: z.number().finite().nonnegative().nullable(),
      priceLabel: z.string().max(80).nullable(),
      productId: z.string().max(180).nullable().optional(),
      specs: z.object({
        batteryHours: z.number().positive().nullable(),
        batteryLabel: z.string().max(200).nullable(),
        batterySourceUrl: z.url().nullable(),
        weightKg: z.number().positive().nullable(),
        weightLabel: z.string().max(200).nullable(),
        weightSourceUrl: z.url().nullable(),
        performanceScore: z.number().positive().nullable().default(null),
        performanceLabel: z.string().max(200).nullable().default(null),
        performanceSourceUrl: z.url().nullable().default(null),
        fetchedAt: z.iso.datetime(),
      }).optional(),
    }).optional(),
  })).min(2, "Add at least two alternatives."),
  criteria: z.array(z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    type: z.enum(["benefit", "cost"]),
    unit: z.string().trim().max(24).default(""),
    weight: z.number().finite().min(0).max(100),
  })).min(1, "Add at least one criterion."),
  ratings: z.array(z.object({
    alternativeId: z.string().min(1),
    criterionId: z.string().min(1),
    value: z.number().finite(),
  })),
});

export type EvaluationRequestBody = z.infer<typeof evaluationRequestSchema>;
