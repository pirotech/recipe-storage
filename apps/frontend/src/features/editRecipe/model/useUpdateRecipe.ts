import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  recipeKeys,
  updateRecipe,
  type Recipe,
  type RecipeUpdate,
} from "@/entities/recipe";

export function useUpdateRecipe(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: RecipeUpdate) => updateRecipe(id, update),
    onSuccess: (recipe) => {
      // PATCH вернул рецепт целиком, это актуальные данные с сервера. Пишем их в кэш,
      // а не перезапрашиваем: страница рецепта и список обновятся без лишних запросов.
      queryClient.setQueryData(recipeKeys.detail(id), recipe);
      queryClient.setQueryData<Recipe[]>(recipeKeys.list(), (old) =>
        old?.map((r) => (r.id === id ? recipe : r)),
      );
    },
  });
}
