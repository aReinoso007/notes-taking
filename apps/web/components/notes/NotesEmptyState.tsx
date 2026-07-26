import Image from "next/image";

import styles from "./NotesEmptyState.module.css";

type NotesEmptyStateProps = {
  variant: "first-run" | "filtered" | "search";
  categoryName?: string;
  searchQuery?: string;
};

export function NotesEmptyState({
  variant,
  categoryName,
  searchQuery,
}: NotesEmptyStateProps) {
  if (variant === "search") {
    return (
      <div className={styles.empty} role="status">
        <Image
          src="/empty-boba.png"
          alt=""
          width={220}
          height={220}
          className={styles.art}
          priority
        />
        <p className={styles.copy}>
          No notes match “{searchQuery?.trim() || "that"}”.
        </p>
      </div>
    );
  }

  if (variant === "filtered") {
    return (
      <div className={styles.empty} role="status">
        <Image
          src="/empty-boba.png"
          alt=""
          width={220}
          height={220}
          className={styles.art}
          priority
        />
        <p className={styles.copy}>
          Nothing in {categoryName ?? "this category"} yet — try New Note.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.empty} role="status">
      <Image
        src="/empty-boba.png"
        alt=""
        width={297}
        height={296}
        className={styles.art}
        priority
      />
      <p className={styles.copy}>
        I&apos;m just here waiting for your charming notes...
      </p>
    </div>
  );
}
