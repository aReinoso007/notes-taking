/** Parse `?category=` from the notes index URL. */
export function parseCategoryFilter(
  value: string | null,
): number | undefined {
  if (value === null || value === "" || value === "all") return undefined;
  const id = Number(value);
  return Number.isFinite(id) ? id : undefined;
}

/** Parse `?q=` search from the notes index URL. */
export function parseSearchQuery(value: string | null): string {
  if (value === null) return "";
  return value.trim();
}

export type NotesListPathOptions = {
  categoryId?: number;
  q?: string;
};

/** Build `/notes` with optional category + search query params. */
export function notesListPath({
  categoryId,
  q,
}: NotesListPathOptions = {}): string {
  const params = new URLSearchParams();
  if (categoryId !== undefined) {
    params.set("category", String(categoryId));
  }
  const trimmed = q?.trim() ?? "";
  if (trimmed) {
    params.set("q", trimmed);
  }
  const qs = params.toString();
  return qs ? `/notes?${qs}` : "/notes";
}

/** @deprecated Prefer notesListPath — kept for existing call sites. */
export function notesPathForCategory(categoryId?: number, q?: string): string {
  return notesListPath({ categoryId, q });
}
