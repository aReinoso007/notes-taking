"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { PillButton } from "@/components/PillButton";
import { NotesEmptyState } from "@/components/notes/NotesEmptyState";
import { NotesGrid } from "@/components/notes/NotesGrid";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { ApiError, api } from "@/lib/api-client";
import { useCategories, useMe, useNotes } from "@/lib/hooks";
import { parseCategoryFilter } from "@/lib/notes-filter";

import styles from "./NotesPage.module.css";

export function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategoryId = parseCategoryFilter(searchParams.get("category"));

  const me = useMe();
  const categories = useCategories();
  const notes = useNotes(activeCategoryId);

  useEffect(() => {
    if (me.isError && me.error instanceof ApiError && me.error.status === 401) {
      router.replace("/login");
    }
  }, [me.isError, me.error, router]);

  async function onLogout() {
    await api.logout().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  if (me.isLoading || categories.isLoading || notes.isLoading) {
    return <div className={styles.loading}>Loading notes…</div>;
  }

  if (me.isError) {
    return <div className={styles.loading}>Redirecting…</div>;
  }

  const categoryList = categories.data ?? [];
  const noteList = notes.data?.results ?? [];
  const activeCategory = categoryList.find((c) => c.id === activeCategoryId);
  const isFiltered = activeCategoryId !== undefined;
  const isEmpty = noteList.length === 0;

  return (
    <div className={styles.shell}>
      <div className={styles.actions}>
        <PillButton
          type="button"
          className={styles.newNoteBtn}
          onClick={() => router.push("/notes/new")}
        >
          + New Note
        </PillButton>
        <button
          type="button"
          className={styles.logout}
          onClick={onLogout}
          aria-label="Log out"
        >
          ×
        </button>
      </div>

      <div className={styles.body}>
        <NotesSidebar
          categories={categoryList}
          activeCategoryId={activeCategoryId}
        />
        <section
          className={[styles.main, isEmpty ? styles.mainEmpty : ""].filter(Boolean).join(" ")}
        >
          {isEmpty ? (
            <NotesEmptyState
              variant={isFiltered ? "filtered" : "first-run"}
              categoryName={activeCategory?.name}
            />
          ) : (
            <NotesGrid notes={noteList} />
          )}
        </section>
      </div>
    </div>
  );
}
