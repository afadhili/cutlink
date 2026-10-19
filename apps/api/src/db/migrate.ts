import { migrate } from "drizzle-orm/postgres-js/migrator";
import { connectDatabase } from "./index";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const connection = connectDatabase(url);
try {
  await migrate(connection.db, {
    migrationsFolder: new URL("./migrations", import.meta.url).pathname,
  });
  console.log("Migrations applied");
} finally {
  await connection.close();
}
