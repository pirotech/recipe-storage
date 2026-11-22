import { api, apiRequest, ApiError } from "@/shared/api";

type IngredientDto = {
  raw: string;
  name: string | null;
  amount: number | null;
  unit: string | null;
};
type StepDto = { text: string; image_url: string | null };
type RecipeDto = {
  id: string;
  source_url: string;
  title: string;
  image_url: string | null;
  servings: string | null;
  total_time_minutes: number | null;
  ingredients: IngredientDto[];
  steps: StepDto[];
  created_at: string;
};

export type Ingredient = IngredientDto;
export type Step = { text: string; imageUrl: string | null };
export type Recipe = {
  id: string;
  sourceUrl: string;
  title: string;
  imageUrl: string | null;
  servings: string | null;
  totalTimeMinutes: number | null;
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: string;
};

const toRecipe = (dto: RecipeDto): Recipe => ({
  id: dto.id,
  sourceUrl: dto.source_url,
  title: dto.title,
  imageUrl: dto.image_url,
  servings: dto.servings,
  totalTimeMinutes: dto.total_time_minutes,
  ingredients: dto.ingredients,
  steps: dto.steps.map((s) => ({ text: s.text, imageUrl: s.image_url })),
  createdAt: dto.created_at,
});

export async function fetchRecipes(): Promise<Recipe[]> {
  return (await api<RecipeDto[]>("/recipes")).map(toRecipe);
}

export async function createRecipe(
  url: string,
): Promise<{ recipe: Recipe; created: boolean }> {
  const { data, status } = await apiRequest<RecipeDto>("/recipes", {
    method: "POST",
    body: { url },
  });
  // 201 — новый рецепт, 200 — такая ссылка уже была в коллекции
  return { recipe: toRecipe(data), created: status === 201 };
}

export async function fetchRecipe(id: string): Promise<Recipe> {
  return toRecipe(await api<RecipeDto>(`/recipes/${encodeURIComponent(id)}`));
}

export async function deleteRecipe(id: string): Promise<void> {
  try {
    await api<void>(`/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (e) {
    // DELETE идемпотентен: если рецепта уже нет (удалили в другой вкладке), цель достигнута
    if (e instanceof ApiError && e.status === 404) return;
    throw e;
  }
}

export type RecipeUpdate = {
  title: string;
  imageUrl: string | null;
  servings: string | null;
  totalTimeMinutes: number | null;
  ingredients: Ingredient[];
  steps: Step[];
};

export async function updateRecipe(
  id: string,
  update: RecipeUpdate,
): Promise<Recipe> {
  const dto = await api<RecipeDto>(`/recipes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      title: update.title,
      image_url: update.imageUrl,
      servings: update.servings,
      total_time_minutes: update.totalTimeMinutes,
      ingredients: update.ingredients,
      steps: update.steps.map((s) => ({ text: s.text, image_url: s.imageUrl })),
    },
  });
  return toRecipe(dto);
}
