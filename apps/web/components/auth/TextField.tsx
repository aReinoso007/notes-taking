import type { InputHTMLAttributes } from "react";

import styles from "./TextField.module.css";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({
  id,
  label,
  error,
  className,
  ...rest
}: TextFieldProps) {
  const fieldId = id ?? rest.name ?? "field";
  const errorId = `${fieldId}-error`;

  return (
    <div className={styles.wrap}>
      <label className={styles.srOnly} htmlFor={fieldId}>
        {label}
      </label>
      <input
        id={fieldId}
        className={[styles.input, error ? styles.invalid : "", className]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
