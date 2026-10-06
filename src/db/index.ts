import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pool: pg.Pool | undefined;
};

function createPoolConfig(connectionString: string): pg.PoolConfig {
  const isSupabase = connectionString.includes("supabase");

  if (!isSupabase) {
    return { connectionString };
  }

  // pg v8 maps sslmode=require in the URL to verify-full, which breaks Supabase on
  // some Node/macOS setups. Strip URL SSL params and set explicit pool SSL.
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");

  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
  };
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new pg.Pool(createPoolConfig(connectionString));
}

const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

export * from "./schema";
