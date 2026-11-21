import { UserMenu } from '@/features/auth'

export function HomePage() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Рецепты</h1>
        <UserMenu />
      </header>
      <main className="p-4 text-muted-foreground">Здесь появятся ваши рецепты.</main>
    </div>
  )
}
