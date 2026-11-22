import { useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useVerifyMagicLink } from '@/features/auth'
import { buttonVariants } from '@/shared/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function VerifyPage() {
  const navigate = useNavigate()
  const { mutate, isSuccess, error } = useVerifyMagicLink()
  const started = useRef(false)

  useEffect(() => {
    // StrictMode в dev запускает эффект дважды, а ссылка одноразовая:
    // без этой защиты второй вызов получил бы «ссылка недействительна».
    if (started.current) return
    started.current = true

    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    // Сразу убираем токен из адресной строки и истории
    window.history.replaceState(null, '', window.location.pathname)

    if (!token) navigate('/login', { replace: true })
    else mutate(token)
  }, [mutate, navigate])

  if (isSuccess) return <Navigate to="/" replace />

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{error ? 'Не удалось войти' : 'Входим…'}</CardTitle>
          {error && <CardDescription>{error.message}</CardDescription>}
        </CardHeader>
        {error && (
          <div className="px-6">
            <Link to="/login" className={buttonVariants({ className: 'w-full' })}>
              Запросить новую ссылку
            </Link>
          </div>
        )}
      </Card>
    </main>
  )
}
