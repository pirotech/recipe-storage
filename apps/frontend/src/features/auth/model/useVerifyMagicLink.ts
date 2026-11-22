import { useMutation } from "@tanstack/react-query";
import { useSessionStore, verifyMagicLink } from "@/entities/session";

export function useVerifyMagicLink() {
  const setTokens = useSessionStore((s) => s.setTokens);
  return useMutation({
    mutationFn: verifyMagicLink,
    onSuccess: setTokens,
  });
}
