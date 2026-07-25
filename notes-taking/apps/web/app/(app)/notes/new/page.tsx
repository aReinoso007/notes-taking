"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { NoteEditor } from "@/components/notes/NoteEditor";
import { parseCategoryFilter } from "@/lib/notes-filter";

function NewNotePageInner() {
  const searchParams = useSearchParams();
  const categoryId = parseCategoryFilter(searchParams.get("category"));

  return (
    <NoteEditor
      mode="new"
      initialCategoryId={categoryId ?? null}
      returnCategoryId={categoryId ?? null}
    />
  );
}

export default function NewNotePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading…</div>}>
      <NewNotePageInner />
    </Suspense>
  );
}
