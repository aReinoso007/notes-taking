"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "./api-client";

export const queryKeys = {
  me: ["me"] as const,
  categories: ["categories"] as const,
  notes: (category?: number | "null") => ["notes", category ?? "all"] as const,
  note: (id: number) => ["note", id] as const,
};

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
    enabled,
    retry: false,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.listCategories(),
  });
}

export function useNotes(category?: number | "null") {
  return useQuery({
    queryKey: queryKeys.notes(category),
    queryFn: () => api.listNotes(category !== undefined ? { category } : undefined),
  });
}

export function useNote(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.note(id),
    queryFn: () => api.getNote(id),
    enabled,
  });
}
