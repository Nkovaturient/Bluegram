import type { VariableId } from "@/lib/types";

const STORAGE_KEY = "bluegram:saved-posts";

export type Bookmark = {
  regionId: string;
  variable: VariableId;
  savedAt: string;
};

export function loadBookmarks(): Bookmark[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is Bookmark =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { regionId?: unknown }).regionId === "string" &&
        (typeof (item as { variable?: unknown }).variable === "string") &&
        ((item as { variable?: unknown }).variable === "temperature" ||
          (item as { variable?: unknown }).variable === "precipitation") &&
        typeof (item as { savedAt?: unknown }).savedAt === "string"
    );
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error: unknown) {
    console.error("Failed to save bookmarks:", error);
  }
}

export function isBookmarked(
  regionId: string,
  variable: VariableId,
  bookmarks: Bookmark[]
): boolean {
  return bookmarks.some(
    (b) => b.regionId === regionId && b.variable === variable
  );
}

export function toggleBookmark(
  regionId: string,
  variable: VariableId,
  bookmarks: Bookmark[]
): Bookmark[] {
  const existing = bookmarks.findIndex(
    (b) => b.regionId === regionId && b.variable === variable
  );
  if (existing >= 0) {
    return bookmarks.filter((_, i) => i !== existing);
  }
  return [
    ...bookmarks,
    { regionId, variable, savedAt: new Date().toISOString() },
  ];
}
