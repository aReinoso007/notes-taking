"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { NoteEditor } from "@/components/notes/NoteEditor";
import { ApiError } from "@/lib/api-client";
import { useNote } from "@/lib/hooks";
import { parseCategoryFilter } from "@/lib/notes-filter";

function EditNotePageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnCategoryId = parseCategoryFilter(searchParams.get("category"));

  const id = Number(params.id);
  const validId = Number.isFinite(id);
  const noteQuery = useNote(id, validId);

  useEffect(() => {
    if (
      noteQuery.isError &&
      noteQuery.error instanceof ApiError &&
      noteQuery.error.status === 404
    ) {
      router.replace("/notes");
    }
  }, [noteQuery.isError, noteQuery.error, router]);

  if (!validId) {
    return <div style={{ padding: "2rem" }}>Note not found.</div>;
  }

  if (noteQuery.isLoading) {
    return <div style={{ padding: "2rem" }}>Loading note…</div>;
  }

  if (noteQuery.isError || !noteQuery.data) {
    return <div style={{ padding: "2rem" }}>Couldn’t load note.</div>;
  }

  return (
    <NoteEditor
      mode="edit"
      note={noteQuery.data}
      returnCategoryId={returnCategoryId ?? null}
    />
  );
}

export default function EditNotePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading…</div>}>
      <EditNotePageInner />
    </Suspense>
  );
}
