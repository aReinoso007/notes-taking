import Link from "next/link";

import type { Category } from "@/lib/types";
import { notesPathForCategory } from "@/lib/notes-filter";

import styles from "./NotesSidebar.module.css";

type NotesSidebarProps = {
  categories: Category[];
  activeCategoryId?: number;
};

export function NotesSidebar({
  categories,
  activeCategoryId,
}: NotesSidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Categories">
      <Link
        href={notesPathForCategory()}
        className={[
          styles.heading,
          activeCategoryId === undefined ? styles.headingActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        All Categories
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </Link>
      <nav className={styles.nav}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={notesPathForCategory(category.id)}
            className={[
              styles.item,
              activeCategoryId === category.id ? styles.active : "",
            ]
              .filter(Boolean)
              .join(" ")}
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
    </aside>
  );
}
