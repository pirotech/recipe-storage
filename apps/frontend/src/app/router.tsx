import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RecipePage } from "@/pages/recipe";
import { VerifyPage } from "@/pages/verify";
import { RecipeEditPage } from "@/pages/recipeEdit";
import { AppLayout } from "./AppLayout";
import { GuestOnly, RequireAuth } from "./guards";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes/:id" element={<RecipePage />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
