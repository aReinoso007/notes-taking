export default async function NoteDetailStubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1
        style={{
          color: "var(--heading)",
          fontFamily: "var(--font-display), cursive",
        }}
      >
        Note {id}
      </h1>
      <p style={{ color: "var(--ink)" }}>
        Inline edit + markdown preview land in Step 8.
      </p>
    </main>
  );
}
