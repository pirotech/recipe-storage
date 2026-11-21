import { useMutation } from "@tanstack/react-query";
import { requestMagicLink } from "@/entities/session";

export const useRequestMagicLink = () =>
  useMutation({ mutationFn: requestMagicLink });
