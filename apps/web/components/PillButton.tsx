import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./PillButton.module.css";

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pending?: boolean;
};

export function PillButton({
  children,
  pending = false,
  className,
  disabled,
  type = "button",
  ...rest
}: PillButtonProps) {
  return (
    <button
      type={type}
      className={[styles.pill, className].filter(Boolean).join(" ")}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending ? "…" : children}
    </button>
  );
}
