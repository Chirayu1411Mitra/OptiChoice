import { z } from "zod";

// Older product lookups stored one generic `sourceUrl` for specifications.
// Normalize those saved records so listing drafts doesn't fail on legacy data.
const productSpecificationsSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const specs = { ...(value as Record<string, unknown>) };
  delete specs.sourceUrl;
  specs.batterySourceUrl ??= null;
  specs.weightSourceUrl ??= null;
  specs.performanceScore ??= null;
  specs.performanceLabel ??= null;
  specs.performanceSourceUrl ??= null;
  return specs;
}, z.object({
  batteryHours: z.number().positive().nullable(),
  batteryLabel: z.string().max(200).nullable(),
  batterySourceUrl: z.url().nullable(),
  weightKg: z.number().positive().nullable(),
  weightLabel: z.string().max(200).nullable(),
  weightSourceUrl: z.url().nullable(),
  performanceScore: z.number().positive().nullable(),
  performanceLabel: z.string().max(200).nullable(),
  performanceSourceUrl: z.url().nullable(),
  fetchedAt: z.iso.datetime(),
}));

export const draftSchema = z.object({
  scoringMode: z.enum(["rating", "relative"]).default("rating"),
  currentStep: z.number().int().min(0).max(5).default(0),
  maxReached: z.number().int().min(0).max(5).default(0),
  title: z.string().trim().min(1, "Give your decision a title.").max(120),
  description: z.string().max(500),
  alternatives: z.array(z.object({
    id: z.string().min(1),
    name: z.string().max(120),
    productInfo: z.object({
      source: z.string().max(120),
      sourceUrl: z.url(),
      fetchedAt: z.iso.datetime(),
      price: z.number().finite().nonnegative().nullable(),
      priceLabel: z.string().max(80).nullable(),
      productId: z.string().max(180).nullable().optional(),
      specs: productSpecificationsSchema.optional(),
    }).optional(),
  })),
  criteria: z.array(z.object({
    id: z.string().min(1),
    name: z.string().max(120),
    type: z.enum(["benefit", "cost"]),
    unit: z.string().trim().max(24).default(""),
    weight: z.number().finite().min(0).max(100),
  })),
  ratings: z.record(z.string(), z.record(z.string(), z.union([
    z.number().finite(),
    z.literal(""),
  ]))),
});

export type DraftBody = z.infer<typeof draftSchema>;
