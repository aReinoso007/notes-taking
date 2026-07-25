"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { useCreateCategory } from "@/lib/hooks";
import type { Category } from "@/lib/types";

import styles from "./CategoryPicker.module.css";

type CategoryPickerProps = {
  categories: Category[];
  value: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
};

export function CategoryPicker({
  categories,
  value,
  onChange,
  disabled = false,
}: CategoryPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createCategory = useCreateCategory();

  const selected = categories.find((c) => c.id === value) ?? null;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
        setError(null);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setCreating(false);
        setError(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError("Name is required");
      return;
    }
    setError(null);
    try {
      const category = await createCategory.mutateAsync(name);
      onChange(category.id);
      setNewName("");
      setCreating(false);
      setOpen(false);
    } catch {
      setError("Couldn’t create category");
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={styles.swatch}
          style={{
            background: selected?.color ?? "var(--cat-none)",
          }}
          aria-hidden="true"
        />
        <span className={styles.label}>
          {selected?.name ?? "No category"}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className={styles.panel} id={listId} role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={value === null}
            className={styles.option}
            onClick={() => {
              onChange(null);
              setOpen(false);
              setCreating(false);
            }}
          >
            <span
              className={styles.swatch}
              style={{ background: "var(--cat-none)" }}
              aria-hidden="true"
            />
            No category
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="option"
              aria-selected={value === category.id}
              className={styles.option}
              onClick={() => {
                onChange(category.id);
                setOpen(false);
                setCreating(false);
              }}
            >
              <span
                className={styles.swatch}
                style={{ background: category.color }}
                aria-hidden="true"
              />
              {category.name}
            </button>
          ))}

          {creating ? (
            <form className={styles.createForm} onSubmit={onCreate}>
              <label className="visually-hidden" htmlFor={`${listId}-new`}>
                New category name
              </label>
              <input
                id={`${listId}-new`}
                className={styles.createInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                autoFocus
                disabled={createCategory.isPending}
              />
              <button
                type="submit"
                className={styles.createSubmit}
                disabled={createCategory.isPending}
              >
                Add
              </button>
              {error ? <p className={styles.error}>{error}</p> : null}
            </form>
          ) : (
            <button
              type="button"
              className={styles.createToggle}
              onClick={() => setCreating(true)}
            >
              Create category…
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
