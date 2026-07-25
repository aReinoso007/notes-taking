"use client";

import { useId, useState, type FormEvent } from "react";

import { ColorWheelPicker } from "@/components/notes/ColorWheelPicker";
import { normalizeHex } from "@/lib/color";
import { useCreateCategory } from "@/lib/hooks";
import { CATEGORY_PALETTE } from "@/lib/palette";
import type { Category } from "@/lib/types";

import styles from "./CategoryCreateForm.module.css";

type CategoryCreateFormProps = {
  onCreated: (category: Category) => void;
  onCancel?: () => void;
  className?: string;
};

export function CategoryCreateForm({
  onCreated,
  onCancel,
  className,
}: CategoryCreateFormProps) {
  const ids = useId();
  const createCategory = useCreateCategory();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_PALETTE[0]);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    const normalized = normalizeHex(color);
    if (!normalized) {
      setError("Pick a valid colour");
      return;
    }
    setError(null);
    try {
      const category = await createCategory.mutateAsync({
        name: trimmed,
        color: normalized,
      });
      setName("");
      setColor(CATEGORY_PALETTE[0]);
      onCreated(category);
    } catch {
      setError("Couldn’t create category");
    }
  }

  return (
    <form
      className={[styles.form, className].filter(Boolean).join(" ")}
      onSubmit={(e) => void onSubmit(e)}
    >
      <label className="visually-hidden" htmlFor={`${ids}-name`}>
        New category name
      </label>
      <input
        id={`${ids}-name`}
        className={styles.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        autoFocus
        disabled={createCategory.isPending}
      />

      <ColorWheelPicker
        value={color}
        onChange={setColor}
        disabled={createCategory.isPending}
      />

      <fieldset className={styles.presets} disabled={createCategory.isPending}>
        <legend className={styles.presetsLegend}>Suggestions</legend>
        {CATEGORY_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={[
              styles.colorBtn,
              color.toUpperCase() === swatch.toUpperCase()
                ? styles.colorBtnSelected
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ background: swatch }}
            aria-label={`Suggestion ${swatch}`}
            aria-pressed={color.toUpperCase() === swatch.toUpperCase()}
            onClick={() => setColor(swatch)}
          />
        ))}
      </fieldset>

      <div className={styles.actions}>
        {onCancel ? (
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={createCategory.isPending}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          className={styles.submit}
          disabled={createCategory.isPending}
        >
          Add
        </button>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
