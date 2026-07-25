import type { Metadata } from "next";
import { Nunito, Sniglet } from "next/font/google";

import { QueryProvider } from "@/lib/providers";

import "./globals.css";

const display = Sniglet({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const ui = Nunito({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Notes",
  description: "A cute notes-taking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
