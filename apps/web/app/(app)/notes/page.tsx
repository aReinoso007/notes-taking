import { Suspense } from "react";

import { NotesPage } from "@/components/notes/NotesPage";

export default function NotesIndexPage() {
  // Avoid a full-page "Loading…" flash on every ?category= / ?q= change —
  // useSearchParams() is wrapped in Suspense, and a visible fallback remounts
  // the whole notes UI on each soft navigation.
  return (
    <Suspense fallback={null}>
      <NotesPage />
    </Suspense>
  );
}
