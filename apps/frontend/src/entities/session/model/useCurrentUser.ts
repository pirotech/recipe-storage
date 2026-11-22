import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../api/sessionApi";
import { useIsAuthenticated } from "./store";

export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
