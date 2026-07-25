"use client";

import { useState, type InputHTMLAttributes } from "react";

import styles from "./PasswordField.module.css";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

export function PasswordField({
  id,
  label,
  error,
  className,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? rest.name ?? "password";
  const errorId = `${fieldId}-error`;
  const toggleId = `${fieldId}-toggle`;

  return (
    <div className={styles.wrap}>
      <label className={styles.srOnly} htmlFor={fieldId}>
        {label}
      </label>
      <div className={styles.field}>
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          className={[styles.input, error ? styles.invalid : "", className]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        <button
          id={toggleId}
          type="button"
          className={styles.toggle}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2.1 3.5 3.5 2.1l18.4 18.4-1.4 1.4-3.3-3.3A11.6 11.6 0 0 1 12 19c-7 0-10-7-10-7a18.5 18.5 0 0 1 5.2-5.6L2.1 3.5zM12 7a5 5 0 0 1 4.9 4l-1.6-1.6A2.5 2.5 0 0 0 12 9.5V7zm9.9 5s-1.2 2.8-3.7 4.8l-1.5-1.5A15 15 0 0 0 20.5 12S17.8 7 12 7c-.5 0-1 .05-1.4.1L8.9 5.4C9.9 5.1 10.9 5 12 5c7 0 10 7 10 7z"
      />
    </svg>
  );
}
