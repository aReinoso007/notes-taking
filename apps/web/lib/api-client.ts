import type {
  AuthUserResponse,
  Category,
  Note,
  PaginatedNotes,
  User,
} from "./types";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === "object" && body && "detail" in body
      ? String((body as { detail: unknown }).detail)
      : `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

export const api = {
  signup(email: string, password: string) {
    return request<AuthUserResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<AuthUserResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    return request<void>("/api/auth/logout", { method: "POST" });
  },

  me() {
    return request<AuthUserResponse>("/api/auth/me");
  },

  listCategories() {
    return request<Category[]>("/api/categories");
  },

  createCategory(payload: { name: string; color?: string }) {
    return request<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCategory(
    id: number,
    payload: { name?: string; color?: string },
  ) {
    return request<Category>(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteCategory(id: number) {
    return request<void>(`/api/categories/${id}`, { method: "DELETE" });
  },

  listNotes(params?: {
    category?: number | "null";
    q?: string;
    cursor?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.category !== undefined) {
      qs.set("category", String(params.category));
    }
    const trimmed = params?.q?.trim();
    if (trimmed) {
      qs.set("q", trimmed);
    }
    if (params?.cursor) {
      qs.set("cursor", params.cursor);
    }
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<PaginatedNotes>(`/api/notes${suffix}`);
  },

  createNote(payload: {
    title?: string;
    content?: string;
    category?: number | null;
  }) {
    return request<Note>("/api/notes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getNote(id: number) {
    return request<Note>(`/api/notes/${id}`);
  },

  updateNote(
    id: number,
    payload: { title?: string; content?: string; category?: number | null },
  ) {
    return request<Note>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteNote(id: number) {
    return request<void>(`/api/notes/${id}`, { method: "DELETE" });
  },
};

export type { User };
