/** Parse `?category=` from the notes index URL. */
export function parseCategoryFilter(
  value: string | null,
): number | undefined {
  if (value === null || value === "" || value === "all") return undefined;
  const id = Number(value);
  return Number.isFinite(id) ? id : undefined;
}

export function notesPathForCategory(categoryId?: number): string {
  if (categoryId === undefined) return "/notes";
  return `/notes?category=${categoryId}`;
}
