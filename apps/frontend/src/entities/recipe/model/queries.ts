import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRecipe, fetchRecipes, type Recipe } from "../api/recipeApi";

// Фабрика ключей: все ключи рецептов начинаются с ['recipes'], поэтому
// invalidateQueries({ queryKey: recipeKeys.all }) обновит и список, и детали.
// Ключи в одном месте исключают опечатки в строках по всему проекту.
export const recipeKeys = {
  all: ["recipes"] as const,
  list: () => [...recipeKeys.all, "list"] as const,
  detail: (id: string) => [...recipeKeys.all, "detail", id] as const,
};

export const useRecipes = () =>
  useQuery({ queryKey: recipeKeys.list(), queryFn: fetchRecipes });

export function useRecipe(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipe(id),
    // Берём рецепт из уже загруженного списка, и страница открывается без спиннера
    initialData: () =>
      queryClient
        .getQueryData<Recipe[]>(recipeKeys.list())
        ?.find((r) => r.id === id),
    // Говорим Query, когда эти данные были получены: так он правильно решит,
    // устарели ли они, и обновит их в фоне
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(recipeKeys.list())?.dataUpdatedAt,
  });
}
