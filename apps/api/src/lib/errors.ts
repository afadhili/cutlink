import { t } from "elysia";
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const errorSchema = t.Object({
  error: t.Object({ code: t.String(), message: t.String() }),
});
export const errorResponses = {
  400: errorSchema,
  404: errorSchema,
  409: errorSchema,
  422: errorSchema,
  429: errorSchema,
  500: errorSchema,
};
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (
    ("code" in error && error.code === "23505") ||
    ("cause" in error && isUniqueViolation(error.cause))
  );
}
