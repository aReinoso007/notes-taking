import type { Metadata } from "next";
import { Inter, Inria_Serif, Nunito, Sniglet } from "next/font/google";

import { QueryProvider } from "@/lib/providers";

import "./globals.css";

const display = Sniglet({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const noteTitle = Inria_Serif({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-note-title",
});

const noteBody = Inter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-note-body",
});

const ui = Nunito({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Notes",
  description: "A cute notes-taking app",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${noteTitle.variable} ${noteBody.variable} ${ui.variable}`}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
