import type { NoteListItem } from "@/lib/types";

import { NoteCard } from "./NoteCard";
import styles from "./NotesGrid.module.css";

type NotesGridProps = {
  notes: NoteListItem[];
};

export function NotesGrid({ notes }: NotesGridProps) {
  return (
    <div className={styles.grid}>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
