"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { CategoryCreateForm } from "@/components/notes/CategoryCreateForm";
import type { Category } from "@/lib/types";
import { notesListPath } from "@/lib/notes-filter";

import styles from "./NotesSidebar.module.css";

type NotesSidebarProps = {
  categories: Category[];
  activeCategoryId?: number;
  /** Preserve search when switching folders. */
  searchQuery?: string;
  userEmail?: string;
  onLogout?: () => void | Promise<void>;
  /** Called after a category (or All) is chosen — used to close the mobile drawer. */
  onNavigate?: () => void;
  className?: string;
};

export function NotesSidebar({
  categories,
  activeCategoryId,
  searchQuery = "",
  userEmail,
  onLogout,
  onNavigate,
  className,
}: NotesSidebarProps) {
  const router = useRouter();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function pathFor(categoryId?: number) {
    return notesListPath({
      categoryId,
      q: searchQuery || undefined,
    });
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleLogout() {
    if (!onLogout || loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  }

  const displayName = userEmail?.trim() || "Account";

  return (
    <aside
      className={[styles.sidebar, className].filter(Boolean).join(" ")}
      aria-label="Categories"
    >
      <div className={styles.top}>
        <Link
          href={pathFor()}
          className={[
            styles.heading,
            activeCategoryId === undefined ? styles.headingActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onNavigate?.()}
        >
          All Categories
          <span className={styles.chevron} aria-hidden="true">
            ▾
          </span>
        </Link>

        {creating ? (
          <CategoryCreateForm
            className={styles.createForm}
            onCreated={(category) => {
              setCreating(false);
              onNavigate?.();
              router.push(pathFor(category.id));
            }}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setCreating(true)}
          >
            + New category
          </button>
        )}

        <nav className={styles.nav}>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={pathFor(category.id)}
              className={[
                styles.item,
                activeCategoryId === category.id ? styles.active : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onNavigate?.()}
            >
              <span
                className={styles.swatch}
                style={{ background: category.color }}
                aria-hidden="true"
              />
              <span className={styles.name}>{category.name}</span>
              <span className={styles.count}>{category.note_count}</span>
            </Link>
          ))}
        </nav>
      </div>

      {userEmail || onLogout ? (
        <div className={styles.userSection} ref={menuRef}>
          <button
            type="button"
            className={styles.userBtn}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Image
              src="/favicon.png"
              alt=""
              width={32}
              height={32}
              className={styles.userAvatar}
            />
            <span className={styles.userEmail}>{displayName}</span>
            <span className={styles.userChevron} aria-hidden="true">
              {menuOpen ? "▴" : "▾"}
            </span>
          </button>

          {menuOpen ? (
            <div id={menuId} className={styles.userMenu} role="menu">
              <button
                type="button"
                className={styles.userMenuItem}
                role="menuitem"
                disabled={loggingOut || !onLogout}
                onClick={() => void handleLogout()}
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
