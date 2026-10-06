import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString,
  ssl: connectionString?.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});

await pool.query(`
  UPDATE verification
  SET "createdAt" = COALESCE("createdAt", NOW()),
      "updatedAt" = COALESCE("updatedAt", NOW())
  WHERE "createdAt" IS NULL OR "updatedAt" IS NULL
`);

await pool.end();
console.log("verification timestamps backfilled");
