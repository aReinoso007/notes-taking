"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PillButton } from "@/components/PillButton";
import { NotesEmptyState } from "@/components/notes/NotesEmptyState";
import { NotesGrid } from "@/components/notes/NotesGrid";
import { NotesSearchField } from "@/components/notes/NotesSearchField";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { ApiError, api } from "@/lib/api-client";
import { useCategories, useMe, useNotes } from "@/lib/hooks";
import {
  notesListPath,
  parseCategoryFilter,
  parseSearchQuery,
} from "@/lib/notes-filter";
import { clearSessionCache } from "@/lib/session-cache";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";

import styles from "./NotesPage.module.css";

function syncNotesUrl(categoryId: number | undefined, q: string) {
  const href = notesListPath({ categoryId, q });
  if (typeof window === "undefined") return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== href) {
    window.history.replaceState(window.history.state, "", href);
  }
}

export function NotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const activeCategoryId = parseCategoryFilter(searchParams.get("category"));
  const urlQuery = parseSearchQuery(searchParams.get("q"));

  // Input text vs committed search (drives the query). Soft URL sync via
  // history.replaceState so we don't remount the Suspense boundary.
  const [draftQuery, setDraftQuery] = useState(urlQuery);
  const [committedQuery, setCommittedQuery] = useState(urlQuery);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const me = useMe();
  const categories = useCategories();
  const notes = useNotes(activeCategoryId, committedQuery);

  // Sync from Next URL when category links / back-forward change searchParams.
  useEffect(() => {
    setDraftQuery(urlQuery);
    setCommittedQuery(urlQuery);
  }, [urlQuery, activeCategoryId]);

  const commitSearch = useDebouncedCallback((next: string) => {
    const trimmed = next.trim();
    setCommittedQuery(trimmed);
    syncNotesUrl(activeCategoryId, trimmed);
  }, 250);

  useEffect(() => {
    return () => commitSearch.cancel();
  }, [commitSearch]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (me.isError && me.error instanceof ApiError && me.error.status === 401) {
      router.replace("/login");
    }
  }, [me.isError, me.error, router]);

  async function onLogout() {
    await api.logout().catch(() => undefined);
    clearSessionCache(queryClient);
    router.replace("/login");
    router.refresh();
  }

  function onSearchChange(value: string) {
    setDraftQuery(value);
    commitSearch(value);
  }

  function onSearchClear() {
    commitSearch.cancel();
    setDraftQuery("");
    setCommittedQuery("");
    syncNotesUrl(activeCategoryId, "");
  }

  // Only block on auth/categories first paint. Never unmount for notes refetch.
  const booting =
    (me.isLoading && !me.data) || (categories.isLoading && !categories.data);

  if (booting) {
    return <div className={styles.loading}>Loading notes…</div>;
  }

  if (me.isError) {
    return <div className={styles.loading}>Redirecting…</div>;
  }

  const categoryList = categories.data ?? [];
  const noteList = notes.data?.results ?? [];
  const activeCategory = categoryList.find((c) => c.id === activeCategoryId);
  const isFiltered = activeCategoryId !== undefined;
  const isSearching = committedQuery.length > 0;
  const isEmpty = noteList.length === 0;
  const foldersLabel = activeCategory?.name ?? "All Categories";

  return (
    <div className={styles.shell}>
      <div className={styles.actions}>
        <PillButton
          type="button"
          className={styles.newNoteBtn}
          onClick={() => {
            const href =
              activeCategoryId !== undefined
                ? `/notes/new?category=${activeCategoryId}`
                : "/notes/new";
            router.push(href);
          }}
        >
          + New Note
        </PillButton>
      </div>

      <div className={styles.body}>
        <div className={styles.desktopSidebar}>
          <NotesSidebar
            categories={categoryList}
            activeCategoryId={activeCategoryId}
            searchQuery={committedQuery}
            userEmail={me.data?.user.email}
            onLogout={onLogout}
          />
        </div>

        <section
          className={[styles.main, isEmpty ? styles.mainEmpty : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.foldersBtn}
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-controls="categories-drawer"
            >
              <span className={styles.foldersIcon} aria-hidden="true">
                ☰
              </span>
              <span className={styles.foldersLabel}>{foldersLabel}</span>
            </button>

            <NotesSearchField
              value={draftQuery}
              onChange={onSearchChange}
              onClear={onSearchClear}
            />
          </div>

          {isEmpty ? (
            <NotesEmptyState
              variant={
                isSearching ? "search" : isFiltered ? "filtered" : "first-run"
              }
              categoryName={activeCategory?.name}
              searchQuery={committedQuery}
            />
          ) : (
            <NotesGrid notes={noteList} />
          )}
        </section>
      </div>

      {drawerOpen ? (
        <div className={styles.drawerRoot}>
          <button
            type="button"
            className={styles.drawerBackdrop}
            aria-label="Close folders"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            id="categories-drawer"
            className={styles.drawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Folders"
          >
            <div className={styles.drawerHeader}>
              <p className={styles.drawerTitle}>Folders</p>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close folders"
              >
                ×
              </button>
            </div>
            <NotesSidebar
              categories={categoryList}
              activeCategoryId={activeCategoryId}
              searchQuery={committedQuery}
              userEmail={me.data?.user.email}
              onLogout={onLogout}
              onNavigate={() => setDrawerOpen(false)}
              className={styles.drawerSidebar}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
