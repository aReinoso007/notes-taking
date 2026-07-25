import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./AuthLayout.module.css";

type AuthLayoutProps = {
  heading: string;
  footerHref: string;
  footerLabel: string;
  illustrationSrc: string;
  illustrationWidth: number;
  illustrationHeight: number;
  children: ReactNode;
};

export function AuthLayout({
  heading,
  footerHref,
  footerLabel,
  illustrationSrc,
  illustrationWidth,
  illustrationHeight,
  children,
}: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <div className={styles.illustrationSlot} aria-hidden="true">
          <Image
            src={illustrationSrc}
            alt=""
            width={illustrationWidth}
            height={illustrationHeight}
            className={styles.illustration}
            priority
          />
        </div>
        <h1 className={styles.heading}>{heading}</h1>
        {children}
        <Link href={footerHref} className={styles.footer}>
          {footerLabel}
        </Link>
      </div>
    </main>
  );
}
