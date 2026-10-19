import type { ApiError } from "@cutlink/shared";
const base = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(
      result?.error?.message ||
        `Request failed (${response.status}). Please try again.`,
    );
  }
  return response.json() as Promise<T>;
}
