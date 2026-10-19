// Construct the internal URL here so passwords containing URL punctuation work.
if (!process.env.DATABASE_URL) {
  const password = process.env.POSTGRES_PASSWORD;
  if (!password) throw new Error("POSTGRES_PASSWORD is required");
  const url = new URL("postgres://cutlink@postgres:5432/cutlink");
  url.password = encodeURIComponent(password);
  process.env.DATABASE_URL = url.toString();
}

switch (process.argv[2]) {
  case "migrate":
    await import("../apps/api/src/db/migrate");
    break;
  case "serve":
    await import("../apps/api/src/index");
    break;
  default:
    throw new Error("Expected serve or migrate");
}
export {};
