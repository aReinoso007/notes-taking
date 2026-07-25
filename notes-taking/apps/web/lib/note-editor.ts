/** True when a draft field change should create a note row. */
export function shouldCreateOnChange(
  previousTitle: string,
  previousContent: string,
  nextTitle: string,
  nextContent: string,
): boolean {
  const wasEmpty = previousTitle.trim() === "" && previousContent.trim() === "";
  const hasContent = nextTitle.trim() !== "" || nextContent.trim() !== "";
  return wasEmpty && hasContent;
}

export type NoteSavePayload = {
  title: string;
  content: string;
  category: number | null;
};

export function buildNotePayload(
  title: string,
  content: string,
  categoryId: number | null,
): NoteSavePayload {
  return {
    title,
    content,
    category: categoryId,
  };
}

export function notesListHref(categoryId?: number | null): string {
  if (categoryId === undefined || categoryId === null) return "/notes";
  return `/notes?category=${categoryId}`;
}
