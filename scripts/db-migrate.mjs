import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "../drizzle");
const journalPath = path.join(migrationsFolder, "meta/_journal.json");

function createPoolConfig(connectionString) {
  const isSupabase = connectionString.includes("supabase");

  if (!isSupabase) {
    return { connectionString };
  }

  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");

  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
  };
}

function hashMigrationFile(tag) {
  const sql = fs.readFileSync(path.join(migrationsFolder, `${tag}.sql`), "utf8");
  return crypto.createHash("sha256").update(sql).digest("hex");
}

/** When the DB was created with `db:push`, mark prior migrations as applied. */
async function maybeBaselineFromPush(pool) {
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const entries = journal.entries ?? [];
  if (entries.length === 0) return;

  const { rows: applied } = await pool.query(
    "SELECT id FROM drizzle.__drizzle_migrations LIMIT 1",
  );
  if (applied.length > 0) return;

  const { rows: userTable } = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'user' LIMIT 1`,
  );
  if (userTable.length === 0) return;

  const baselineTag = process.env.DB_BASELINE_TAG ?? entries[entries.length - 2]?.tag;
  if (!baselineTag) return;

  const baselineEntry = entries.find((e) => e.tag === baselineTag);
  if (!baselineEntry) {
    console.error(`Unknown DB_BASELINE_TAG: ${baselineTag}`);
    process.exit(1);
  }

  const hash = hashMigrationFile(baselineTag);
  await pool.query(
    `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
    [hash, baselineEntry.when],
  );
  console.log(
    `Baselined migration history at ${baselineTag} (DB was likely created with db:push).`,
  );
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL or DIRECT_URL is not set");
    process.exit(1);
  }

  const pool = new pg.Pool(createPoolConfig(connectionString));

  try {
    await pool.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    await maybeBaselineFromPush(pool);

    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
