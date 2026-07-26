"use client";

import { useId } from "react";

import styles from "./NotesSearchField.module.css";

type NotesSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

export function NotesSearchField({
  value,
  onChange,
  onClear,
}: NotesSearchFieldProps) {
  const id = useId();

  return (
    <div className={styles.wrap}>
      <label className="visually-hidden" htmlFor={id}>
        Search notes
      </label>
      <input
        id={id}
        className={styles.input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes"
        autoComplete="off"
        enterKeyHint="search"
      />
      {value.trim() ? (
        <button
          type="button"
          className={styles.clear}
          onClick={onClear}
          aria-label="Clear search"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
