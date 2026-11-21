import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecipe, recipeKeys } from "@/entities/recipe";

export function useAddRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    // Возвращаем промис: мутация считается «в процессе», пока список не перезагрузится,
    // и кнопка не разблокируется раньше, чем в списке появится новый рецепт.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: recipeKeys.list() }),
  });
}
