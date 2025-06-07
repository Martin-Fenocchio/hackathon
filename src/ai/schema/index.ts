import { z } from 'zod';

export const nutritionalAnalysisSchema = z.object({
  responseText: z.string(),
  nutritionalData: z.object({
    foods: z.array(
      z.object({
        name: z.string(),
        portion: z.string(),
        estimatedWeight: z.number(),
        calories: z.number(),
        macros: z.object({
          protein: z.number(),
          carbohydrates: z.number(),
          fat: z.number(),
        }),
        micronutrients: z.object({
          sodium: z.number(),
          calcium: z.number(),
          iron: z.number(),
          vitaminC: z.number(),
        }),
      }),
    ),
    totalCalories: z.number(),
    totalMacros: z.object({
      protein: z.number(),
      carbohydrates: z.number(),
      fat: z.number(),
    }),
  }),
});

export type NutritionalAnalysis = z.infer<typeof nutritionalAnalysisSchema>;
