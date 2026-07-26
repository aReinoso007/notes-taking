import { Suspense } from "react";

import { NotesPage } from "@/components/notes/NotesPage";

export default function NotesIndexPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading notes…</div>}>
      <NotesPage />
    </Suspense>
  );
}
