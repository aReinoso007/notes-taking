export type User = {
  id: number;
  email: string;
};

export type Category = {
  id: number;
  name: string;
  color: string;
  note_count: number;
  created_at?: string;
};

export type NoteCategoryRef = {
  id: number;
  name: string;
  color: string;
} | null;

export type NoteListItem = {
  id: number;
  title: string;
  preview_text: string;
  category: NoteCategoryRef;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: number;
  title: string;
  content: string;
  preview_text: string;
  category: NoteCategoryRef;
  created_at: string;
  updated_at: string;
};

export type PaginatedNotes = {
  results: NoteListItem[];
  next: string | null;
  previous?: string | null;
};

export type AuthUserResponse = {
  user: User;
};
