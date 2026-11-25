import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeKeys, updateRecipeNotes, type Recipe } from "@/entities/recipe";

export function useUpdateNotes(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes: string | null) => updateRecipeNotes(id, notes),
    onSuccess: (recipe) => {
      queryClient.setQueryData(recipeKeys.detail(id), recipe);
      queryClient.setQueryData<Recipe[]>(recipeKeys.list(), (old) =>
        old?.map((r) => (r.id === id ? recipe : r)),
      );
    },
  });
}
