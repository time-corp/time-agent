import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthSession, GatewayLoginInput } from "@time/shared";
import { request } from "./api-client";

const AUTH_API_BASE = "/api/v1/auth";
const authSessionQueryKey = ["auth", "session"] as const;

export const useSessionQuery = () =>
  useQuery({
    queryKey: authSessionQueryKey,
    queryFn: () => request<AuthSession>(`${AUTH_API_BASE}/session`),
    retry: false,
  });

export const useGatewayLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GatewayLoginInput) =>
      request<AuthSession>(`${AUTH_API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      request<AuthSession>(`${AUTH_API_BASE}/logout`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
};
