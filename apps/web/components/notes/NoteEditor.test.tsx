import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatLastEdited } from "@/lib/dates";
import type { Category, Note } from "@/lib/types";

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, refresh: vi.fn() }),
}));

const createNote = vi.fn();
const updateNote = vi.fn();
const deleteNote = vi.fn();
const listCategories = vi.fn();

vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super("api");
      this.status = status;
      this.body = body;
    }
  },
  api: {
    createNote: (...args: unknown[]) => createNote(...args),
    updateNote: (...args: unknown[]) => updateNote(...args),
    deleteNote: (...args: unknown[]) => deleteNote(...args),
    listCategories: (...args: unknown[]) => listCategories(...args),
    createCategory: vi.fn(),
  },
}));

import { NoteEditor } from "./NoteEditor";

const categories: Category[] = [
  {
    id: 1,
    name: "School",
    color: "#FCDC94",
    note_count: 0,
  },
];

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 42,
    title: "Existing",
    content: "Body",
    preview_text: "Body",
    category: { id: 1, name: "School", color: "#FCDC94" },
    created_at: "2024-07-21T12:00:00.000Z",
    updated_at: "2024-07-21T12:00:00.000Z",
    ...overrides,
  };
}

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("NoteEditor", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    replace.mockReset();
    push.mockReset();
    createNote.mockReset();
    updateNote.mockReset();
    deleteNote.mockReset();
    listCategories.mockReset();
    listCategories.mockResolvedValue(categories);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("creates on first keystroke then replaces to the note route", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    createNote.mockResolvedValue(
      makeNote({ id: 99, title: "H", content: "", preview_text: "" }),
    );

    wrap(<NoteEditor mode="new" initialCategoryId={1} />);

    await waitFor(() => {
      expect(listCategories).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText("Note title"), "H");

    await waitFor(() => {
      expect(createNote).toHaveBeenCalledTimes(1);
    });
    expect(createNote).toHaveBeenCalledWith({
      title: "H",
      content: "",
      category: 1,
    });
    // Soft URL update — must not router.replace (that remounts and steals focus).
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/notes/99");
  });

  it("debounces autosave to a single PATCH after quiet period", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    updateNote.mockResolvedValue(
      makeNote({
        title: "Existing!",
        updated_at: "2024-07-21T12:01:00.000Z",
      }),
    );

    wrap(<NoteEditor mode="edit" note={makeNote()} />);

    await waitFor(() => {
      expect(listCategories).toHaveBeenCalled();
    });

    const title = screen.getByLabelText("Note title");
    await user.type(title, "!");
    await user.type(title, "!");
    await user.type(title, "!");

    expect(updateNote).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(updateNote).toHaveBeenCalledTimes(1);
    });
    expect(updateNote).toHaveBeenCalledWith(42, {
      title: "Existing!!!",
      content: "Body",
      category: 1,
    });
  });

  it("updates Last Edited optimistically on keystroke", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const now = new Date("2024-07-22T15:30:00");
    vi.setSystemTime(now);

    updateNote.mockImplementation(
      () =>
        new Promise(() => {
          /* hang — never resolve so optimistic stamp stays */
        }),
    );

    wrap(
      <NoteEditor
        mode="edit"
        note={makeNote({ updated_at: "2024-07-21T12:00:00.000Z" })}
      />,
    );

    await waitFor(() => {
      expect(listCategories).toHaveBeenCalled();
    });

    expect(screen.getByText(formatLastEdited("2024-07-21T12:00:00.000Z"))).toBeInTheDocument();

    await user.type(screen.getByLabelText("Note title"), "x");

    expect(
      screen.getByText(formatLastEdited(now.toISOString())),
    ).toBeInTheDocument();
  });
});
