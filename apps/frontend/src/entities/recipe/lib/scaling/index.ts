import type { Recipe } from "../../api/recipeApi";
import { canScale, parseIngredient } from "./ingredient";

export { canScale, parseIngredient, scaleIngredient } from "./ingredient";
export type { ParsedIngredient } from "./ingredient";
export { scaleServings } from "./servings";

/** Нужен ли у рецепта выбор количества. */
export function canScaleRecipe(recipe: Recipe): boolean {
  return canScale(recipe.ingredients.map((i) => parseIngredient(i.raw)));
}
