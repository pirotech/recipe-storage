import { useCurrentUser } from '@/entities/session'
import { Button } from '@/shared/ui/button'
import { useLogout } from '../model/useLogout'

export function UserMenu() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{user?.email}</span>
      <Button variant="outline" size="sm" disabled={logout.isPending} onClick={() => logout.mutate()}>
        Выйти
      </Button>
    </div>
  )
}
