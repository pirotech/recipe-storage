import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'
import { VerifyPage } from '@/pages/verify'
import { GuestOnly, RequireAuth } from './guards'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Вне guard'ов: ссылка из письма должна работать при любом состоянии сессии */}
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
