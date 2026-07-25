"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CategoryPicker } from "@/components/notes/CategoryPicker";
import { MarkdownBodyField } from "@/components/notes/MarkdownBodyField";
import { formatLastEdited } from "@/lib/dates";
import {
  buildNotePayload,
  notesListHref,
  replaceNoteUrl,
  shouldCreateOnChange,
} from "@/lib/note-editor";
import {
  useCategories,
  useCreateNote,
  useDeleteNote,
  useUpdateNote,
} from "@/lib/hooks";
import type { Note } from "@/lib/types";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";

import styles from "./NoteEditor.module.css";

const AUTOSAVE_MS = 500;

type NoteEditorProps = {
  mode: "new" | "edit";
  note?: Note;
  /** Category inherited from the notes list filter when creating. */
  initialCategoryId?: number | null;
  /** Category to restore in the list URL on close/delete. */
  returnCategoryId?: number | null;
};

export function NoteEditor({
  mode,
  note,
  initialCategoryId = null,
  returnCategoryId,
}: NoteEditorProps) {
  const router = useRouter();
  const categories = useCategories();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [noteId, setNoteId] = useState<number | null>(
    mode === "edit" && note ? note.id : null,
  );
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(
    note?.category?.id ?? initialCategoryId ?? null,
  );
  const [updatedAt, setUpdatedAt] = useState(
    note?.updated_at ?? new Date().toISOString(),
  );
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const categoryRef = useRef(categoryId);
  const noteIdRef = useRef(noteId);
  const creatingRef = useRef(false);

  titleRef.current = title;
  contentRef.current = content;
  categoryRef.current = categoryId;
  noteIdRef.current = noteId;

  const updateNote = useUpdateNote();
  const updateMutateRef = useRef(updateNote.mutateAsync);
  updateMutateRef.current = updateNote.mutateAsync;

  const sheetColor =
    categories.data?.find((c) => c.id === categoryId)?.color ??
    "var(--cat-none)";

  const listHref = notesListHref(
    returnCategoryId === undefined ? undefined : returnCategoryId,
  );

  const scheduleSave = useDebouncedCallback(async () => {
    const id = noteIdRef.current;
    if (id === null) return;
    try {
      const saved = await updateMutateRef.current({
        id,
        ...buildNotePayload(
          titleRef.current,
          contentRef.current,
          categoryRef.current,
        ),
      });
      setUpdatedAt(saved.updated_at);
      setSaveError(null);
    } catch {
      setSaveError("Couldn’t save changes");
    }
  }, AUTOSAVE_MS);

  useEffect(() => {
    return () => {
      scheduleSave.cancel();
    };
  }, [scheduleSave]);

  async function ensureCreated(
    nextTitle: string,
    nextContent: string,
    nextCategory: number | null,
  ) {
    if (noteIdRef.current !== null || creatingRef.current) return;

    creatingRef.current = true;
    setCreating(true);
    try {
      const created = await createNote.mutateAsync(
        buildNotePayload(nextTitle, nextContent, nextCategory),
      );
      setNoteId(created.id);
      noteIdRef.current = created.id;
      setUpdatedAt(created.updated_at);
      setSaveError(null);
      replaceNoteUrl(created.id);
      // Persist anything typed while the create request was in flight.
      scheduleSave();
    } catch {
      setSaveError("Couldn’t create note");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }

  async function onFieldsChange(nextTitle: string, nextContent: string) {
    const prevTitle = titleRef.current;
    const prevContent = contentRef.current;
    setTitle(nextTitle);
    setContent(nextContent);
    setUpdatedAt(new Date().toISOString());

    if (noteIdRef.current === null) {
      if (shouldCreateOnChange(prevTitle, prevContent, nextTitle, nextContent)) {
        await ensureCreated(nextTitle, nextContent, categoryRef.current);
      }
      return;
    }

    scheduleSave();
  }

  async function onCategoryChange(nextCategory: number | null) {
    setCategoryId(nextCategory);
    setUpdatedAt(new Date().toISOString());

    const id = noteIdRef.current;
    if (id === null) return;

    try {
      scheduleSave.cancel();
      const saved = await updateMutateRef.current({
        id,
        ...buildNotePayload(
          titleRef.current,
          contentRef.current,
          nextCategory,
        ),
      });
      setUpdatedAt(saved.updated_at);
      setSaveError(null);
    } catch {
      setSaveError("Couldn’t save changes");
    }
  }

  async function onConfirmDelete() {
    if (noteId === null) {
      router.push(listHref);
      return;
    }
    setDeleteError(null);
    try {
      await deleteNote.mutateAsync(noteId);
      router.push(listHref);
    } catch {
      setDeleteError("Couldn’t delete note");
    }
  }

  function onClose() {
    scheduleSave.cancel();
    router.push(listHref);
  }

  return (
    <div className={styles.page}>
      <header className={styles.chrome}>
        <CategoryPicker
          categories={categories.data ?? []}
          value={categoryId}
          onChange={onCategoryChange}
          disabled={creating || categories.isLoading}
        />
        <div className={styles.chromeActions}>
          {noteId !== null ? (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close note"
          >
            ×
          </button>
        </div>
      </header>

      <div
        className={styles.sheet}
        style={{ ["--sheet-color" as string]: sheetColor }}
      >
        <div className={styles.sheetMeta}>
          <p className={styles.lastEdited}>{formatLastEdited(updatedAt)}</p>
        </div>

        <label className="visually-hidden" htmlFor="note-title">
          Note title
        </label>
        <textarea
          id="note-title"
          className={styles.title}
          value={title}
          placeholder="Note Title"
          rows={2}
          onChange={(e) => void onFieldsChange(e.target.value, content)}
        />

        <MarkdownBodyField
          value={content}
          onChange={(next) => void onFieldsChange(title, next)}
          placeholder="Pour your heart out..."
        />

        {saveError ? (
          <p className={styles.error} role="alert">
            {saveError}
          </p>
        ) : null}
      </div>

      {confirmDelete ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-labelledby="delete-note-title"
            aria-describedby="delete-note-desc"
          >
            <h2 id="delete-note-title" className={styles.dialogTitle}>
              Delete this note?
            </h2>
            <p id="delete-note-desc" className={styles.dialogBody}>
              This can’t be undone.
            </p>
            {deleteError ? (
              <p className={styles.error} role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancel}
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dialogConfirm}
                onClick={() => void onConfirmDelete()}
                disabled={deleteNote.isPending}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
