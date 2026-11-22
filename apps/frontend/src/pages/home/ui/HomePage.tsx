import { AddRecipeForm } from '@/features/addRecipe'
import { RecipeList } from '@/widgets/recipeList'

export function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="sr-only">Мои рецепты</h1>
      <AddRecipeForm />
      <RecipeList />
    </div>
  )
}
