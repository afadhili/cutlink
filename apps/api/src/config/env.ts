export function readEnv(
  source: Record<string, string | undefined> = process.env,
) {
  const required = (key: string) => {
    const value = source[key];
    if (!value) throw new Error(`Missing environment variable: ${key}`);
    return value;
  };
  const databaseUrl = required("DATABASE_URL");
  if (!["postgres:", "postgresql:"].includes(new URL(databaseUrl).protocol))
    throw new Error("DATABASE_URL must be PostgreSQL");
  const origin = (key: string) => {
    const url = new URL(required(key));
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error(`${key} must be an HTTP(S) origin`);
    return url.origin;
  };
  const port = Number(source.API_PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid API_PORT");
  return {
    databaseUrl,
    port,
    webOrigin: origin("WEB_ORIGIN"),
    publicBaseUrl: origin("PUBLIC_BASE_URL"),
  };
}
export type Config = ReturnType<typeof readEnv>;
