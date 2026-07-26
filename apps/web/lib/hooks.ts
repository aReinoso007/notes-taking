"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "./api-client";
import type { Note } from "./types";

export const queryKeys = {
  me: ["me"] as const,
  categories: ["categories"] as const,
  notes: (category?: number | "null", q?: string) =>
    ["notes", category ?? "all", q?.trim() || ""] as const,
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

export function useNotes(category?: number | "null", q?: string) {
  const trimmed = q?.trim() || undefined;
  return useQuery({
    queryKey: queryKeys.notes(category, trimmed),
    queryFn: () =>
      api.listNotes({
        ...(category !== undefined ? { category } : {}),
        ...(trimmed ? { q: trimmed } : {}),
      }),
    // Keep the previous grid on screen while the next category/search loads —
    // avoids a full-page "Loading notes…" flash / layout jump.
    placeholderData: keepPreviousData,
  });
}

export function useNote(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.note(id),
    queryFn: () => api.getNote(id),
    enabled,
  });
}

function invalidateNoteLists(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ["notes"] });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title?: string;
      content?: string;
      category?: number | null;
    }) => api.createNote(payload),
    onSuccess: (note) => {
      queryClient.setQueryData(queryKeys.note(note.id), note);
      void invalidateNoteLists(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number;
      title?: string;
      content?: string;
      category?: number | null;
    }) => api.updateNote(id, payload),
    onSuccess: (note) => {
      queryClient.setQueryData(queryKeys.note(note.id), note);
      void invalidateNoteLists(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteNote(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.note(id) });
      void invalidateNoteLists(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; color?: string }) =>
      api.createCategory(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export type { Note };
