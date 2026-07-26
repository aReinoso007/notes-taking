import type { QueryClient } from "@tanstack/react-query";

/** Drop all cached user/notes/categories so the next session can't flash prior data. */
export function clearSessionCache(queryClient: QueryClient): void {
  queryClient.clear();
}
