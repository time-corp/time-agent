import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
  type User,
} from "../hooks/useUsers";

type UserForm = {
  username: string;
  email: string;
  password: string;
  fullname: string;
};

const emptyForm: UserForm = {
  username: "",
  email: "",
  password: "",
  fullname: "",
};

const sectionStyle: CSSProperties = {
  border: "1px solid #d7dce5",
  borderRadius: 12,
  padding: 16,
  background: "#f8fafc",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#e2e8f0",
  color: "#0f172a",
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#0f172a",
  color: "#fff",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#dc2626",
  color: "#fff",
};

const formatDate = (value?: string | number | Date) => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

export function UsersCrudTest() {
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const usersQuery = useUsersQuery();
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const users = usersQuery.data ?? [];
  const loading = usersQuery.isLoading;
  const submitting =
    createUserMutation.isPending ||
    updateUserMutation.isPending ||
    deleteUserMutation.isPending;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      if (editingId) {
        await updateUserMutation.mutateAsync({
          id: editingId,
          payload: {
            username: form.username,
            email: form.email,
            fullname: form.fullname,
            ...(form.password ? { password: form.password } : {}),
          },
        });
      } else {
        await createUserMutation.mutateAsync(form);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      password: "",
    });
    setError(null);
  };

  const handleDelete = async (id: string) => {
    setError(null);

    try {
      await deleteUserMutation.mutateAsync(id);

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <section style={sectionStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 22 }}>Users CRUD Test</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            Dung `fetch` de test tao, sua, xoa va reload danh sach users.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void usersQuery.refetch()}
          disabled={loading || submitting}
          style={secondaryButtonStyle}
        >
          {loading ? "Dang load..." : "Reload"}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <input
            style={inputStyle}
            placeholder="Username"
            value={form.username}
            onChange={(event) =>
              setForm((current) => ({ ...current, username: event.target.value }))
            }
            required
          />
          <input
            style={inputStyle}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            required
          />
          <input
            style={inputStyle}
            placeholder={editingId ? "Password moi (co the bo trong)" : "Password"}
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required={!editingId}
          />
          <input
            style={inputStyle}
            placeholder="Full name"
            value={form.fullname}
            onChange={(event) =>
              setForm((current) => ({ ...current, fullname: event.target.value }))
            }
            required
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting
              ? "Dang xu ly..."
              : editingId
                ? "Cap nhat user"
                : "Tao user"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              style={secondaryButtonStyle}
            >
              Huy sua
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      ) : null}

      {usersQuery.isError && !error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {usersQuery.error instanceof Error
            ? usersQuery.error.message
            : "Failed to load users"}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {users.map((user) => (
          <article
            key={user.id}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: 16 }}>
                  {user.fullname}
                </strong>
                <div style={{ color: "#334155", marginTop: 4 }}>
                  @{user.username} • {user.email}
                </div>
                <div style={{ color: "#64748b", marginTop: 6, fontSize: 13 }}>
                  Created: {formatDate(user.createdAt)} | Updated:{" "}
                  {formatDate(user.updatedAt)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleEdit(user)}
                  disabled={submitting}
                  style={secondaryButtonStyle}
                >
                  Sua
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(user.id)}
                  disabled={submitting}
                  style={dangerButtonStyle}
                >
                  Xoa
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && users.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px dashed #cbd5e1",
              borderRadius: 10,
              padding: 16,
              color: "#64748b",
            }}
          >
            Chua co user nao.
          </div>
        ) : null}
      </div>
    </section>
  );
}
