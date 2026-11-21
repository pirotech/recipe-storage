import { useQuery } from "@tanstack/react-query";
import { fetchRecipes } from "../api/recipeApi";

// Фабрика ключей: все ключи рецептов начинаются с ['recipes'], поэтому
// invalidateQueries({ queryKey: recipeKeys.all }) обновит и список, и детали.
// Ключи в одном месте исключают опечатки в строках по всему проекту.
export const recipeKeys = {
  all: ["recipes"] as const,
  list: () => [...recipeKeys.all, "list"] as const,
  detail: (id: string) => [...recipeKeys.all, "detail", id] as const, // пригодится на странице рецепта
};

export const useRecipes = () =>
  useQuery({ queryKey: recipeKeys.list(), queryFn: fetchRecipes });
