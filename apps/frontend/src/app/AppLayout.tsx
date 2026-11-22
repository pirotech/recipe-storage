import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { UserMenu } from '@/features/auth'

export function AppLayout() {
  const { pathname } = useLocation()

  // BrowserRouter не сбрасывает скролл при навигации: без этого рецепт откроется
  // прокрученным до уровня, на котором вы были в списке
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          Рецепты
        </Link>
        <UserMenu />
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
