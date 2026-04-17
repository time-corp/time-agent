import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateUserInput, UpdateUserInput, User } from "@time/shared";

export type { User } from "@time/shared";

const USERS_API_BASE = "/api/v1/users";

const usersQueryKey = ["users"] as const;

type ApiSuccess<T> = { success: true; traceId: string; data: T };
type ApiError = { success: false; traceId: string; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiError;

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as ApiError;
    return data.error?.message ?? `Request failed: ${response.status}`;
  } catch {
    return `Request failed: ${response.status}`;
  }
};

const request = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as ApiResponse<T>;
  return (json as ApiSuccess<T>).data;
};

export const useUsersQuery = () =>
  useQuery({
    queryKey: usersQueryKey,
    queryFn: () => request<User[]>(USERS_API_BASE),
  });

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserInput) =>
      request<User>(USERS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserInput }) =>
      request<User>(`${USERS_API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      request<void>(`${USERS_API_BASE}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
};

export const useGetUserQuery = (id: string) =>
  useQuery({
    queryKey: [...usersQueryKey, id],
    queryFn: () => request<User>(`${USERS_API_BASE}/${id}`),
    enabled: Boolean(id),
  });

export const useDeleteUsersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => request<void>(`${USERS_API_BASE}/${id}`, { method: "DELETE" }))
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
};
