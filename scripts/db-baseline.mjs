/**
 * Mark migrations through a given journal tag as already applied (no SQL run).
 * Use when the database was created with `pnpm db:push` and you want `db:migrate`
 * to apply only newer files.
 *
 * Usage: DB_BASELINE_TAG=0002_comment_threads pnpm db:baseline
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "../drizzle");
const journalPath = path.join(migrationsFolder, "meta/_journal.json");

function createPoolConfig(connectionString) {
  const isSupabase = connectionString.includes("supabase");
  if (!isSupabase) return { connectionString };
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
  };
}

async function main() {
  const tag = process.env.DB_BASELINE_TAG;
  if (!tag) {
    console.error("Set DB_BASELINE_TAG to a journal tag (e.g. 0002_comment_threads).");
    process.exit(1);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const entry = journal.entries?.find((e) => e.tag === tag);
  if (!entry) {
    console.error(`Tag not found in ${journalPath}: ${tag}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(migrationsFolder, `${tag}.sql`), "utf8");
  const hash = crypto.createHash("sha256").update(sql).digest("hex");

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
    await pool.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
      [hash, entry.when],
    );
    console.log(`Recorded baseline through ${tag}.`);
  } finally {
    await pool.end();
  }
}

main();
