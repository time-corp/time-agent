import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const USERS_API_BASE = "/api/v1/users";

export type User = {
  id: string;
  username: string;
  email: string;
  fullname: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
};

type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  fullname: string;
};

type UpdateUserPayload = {
  username: string;
  email: string;
  fullname: string;
  password?: string;
};

const usersQueryKey = ["users"] as const;

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error ?? data.message ?? `Request failed: ${response.status}`;
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

  return (await response.json()) as T;
};

export const useUsersQuery = () =>
  useQuery({
    queryKey: usersQueryKey,
    queryFn: () => request<User[]>(USERS_API_BASE),
  });

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
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
