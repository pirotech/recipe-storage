import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRecipe, recipeKeys, type Recipe } from "@/entities/recipe";

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: recipeKeys.detail(id) });
      // Убираем рецепт из списка вручную, а не только invalidate: страница списка сейчас
      // не смонтирована, invalidate лишь пометил бы её устаревшей, и при возврате на главную
      // удалённый рецепт мигнул бы из старого кэша до фонового обновления.
      // Если список ещё не загружен (old === undefined), updater вернёт undefined, и ничего не произойдёт.
      queryClient.setQueryData<Recipe[]>(recipeKeys.list(), (old) =>
        old?.filter((r) => r.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: recipeKeys.list() }); // и сверяемся с сервером
    },
  });
}
