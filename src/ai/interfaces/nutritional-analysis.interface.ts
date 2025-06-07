export interface FoodItem {
  name: string;
  portion: string;
  estimatedWeight: number;
  calories: number;
  macros: {
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  micronutrients?: {
    sodium: number;
    calcium: number;
    iron: number;
    vitaminC: number;
  };
}

export interface NutritionalAnalysis {
  foods: FoodItem[];
  totalCalories: number;
  totalMacros: {
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  macroPercentages: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  healthScore: number;
  mealType: 'desayuno' | 'almuerzo' | 'cena' | 'snack' | 'otro';
  portionSize: 'pequeña' | 'mediana' | 'grande' | 'extra grande';
  personalizedTips: string[];
  warnings: string[];
  recommendations: string[];
}

export interface UserProfile {
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  weight?: number;
  height?: number;
  activityLevel?: 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy_activo';
  goal?: 'perder_peso' | 'mantener_peso' | 'ganar_peso' | 'ganar_musculo' | 'salud_general';
  dietaryRestrictions?: string[];
  allergies?: string[];
  medicalConditions?: string[];
}
