import { AddRecipeForm } from '@/features/addRecipe'
import { UserMenu } from '@/features/auth'
import { RecipeList } from '@/widgets/recipeList'

export function HomePage() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Рецепты</h1>
        <UserMenu />
      </header>
      <main className="mx-auto max-w-5xl space-y-6 p-4">
        <AddRecipeForm />
        <RecipeList />
      </main>
    </div>
  )
}
