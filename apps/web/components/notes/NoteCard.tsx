import Link from "next/link";

import type { NoteListItem } from "@/lib/types";
import { formatCardDate } from "@/lib/dates";
import { truncatePreview } from "@/lib/truncate";

import styles from "./NoteCard.module.css";

type NoteCardProps = {
  note: NoteListItem;
};

export function NoteCard({ note }: NoteCardProps) {
  const color = note.category?.color ?? "var(--cat-none)";
  const categoryName = note.category?.name ?? "Uncategorised";
  const title = note.title.trim() || "Untitled";
  const preview = truncatePreview(note.preview_text || "");

  return (
    <Link
      href={`/notes/${note.id}`}
      className={styles.card}
      style={{ ["--c" as string]: color }}
    >
      <div className={styles.meta}>
        <span className={styles.category}>{categoryName}</span>
        <time dateTime={note.updated_at} className={styles.date}>
          {formatCardDate(note.updated_at)}
        </time>
      </div>
      <h2 className={styles.title}>{title}</h2>
      {preview ? <p className={styles.preview}>{preview}</p> : null}
    </Link>
  );
}
