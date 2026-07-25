/** Must match CATEGORY_PALETTE in apps/api/categories/models.py */
export const CATEGORY_PALETTE = [
  "#EF9C66", // apricot
  "#FCDC94", // butter
  "#C8CFA0", // sage
  "#78ABA8", // teal
  "#E8B4B8", // rose
  "#D4B483", // caramel
  "#9DBFBB", // mist
  "#E9C46A", // gold
] as const;

export type CategoryPaletteColor = (typeof CATEGORY_PALETTE)[number];
