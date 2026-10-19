export interface RecentItem {
  type: "link" | "text";
  url: string;
  label: string;
  createdAt: string;
  slug: string;
}
const key = "cutlink:recent";
export function getHistory(): RecentItem[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(items)) return [];
    return items
      .filter(
        (item): item is RecentItem =>
          item &&
          ["link", "text"].includes(item.type) &&
          typeof item.url === "string" &&
          /^https?:\/\//.test(item.url) &&
          typeof item.label === "string" &&
          typeof item.createdAt === "string" &&
          typeof item.slug === "string",
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}
export function remember(item: RecentItem) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(
        [item, ...getHistory().filter((x) => x.url !== item.url)].slice(0, 20),
      ),
    );
  } catch {
    /* Sharing still works if browser storage is unavailable. */
  }
}
export function clearHistory() {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Storage may be disabled. */
  }
}
