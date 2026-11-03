import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

function shouldUseSsl(databaseUrl: string): boolean {
  if (!databaseUrl) return false;
  return (
    databaseUrl.includes("neon.tech") ||
    databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("ssl=true") ||
    process.env.PGSSLMODE === "require" ||
    env.isProduction
  );
}

export const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
  ssl: shouldUseSsl(env.databaseUrl) ? { rejectUnauthorized: false } : undefined,
});

export const database = pool;

let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (!env.databaseUrl) {
      throw new Error(
        "DATABASE_URL is not set. Please add a valid Neon or PostgreSQL connection string to your .env file."
      );
    }

    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          google_sub TEXT UNIQUE,
          email_verified_at TEXT,
          date_of_birth TEXT,
          gender TEXT,
          phone_number TEXT,
          location TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);

        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx ON email_verification_tokens(user_id);

        CREATE TABLE IF NOT EXISTS decisions (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          alternatives_json TEXT NOT NULL,
          criteria_json TEXT NOT NULL,
          ratings_json TEXT NOT NULL,
          ranking_json TEXT NOT NULL,
          breakdown_json TEXT NOT NULL,
          scoring_mode TEXT NOT NULL DEFAULT 'rating',
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS decisions_created_at_idx ON decisions(created_at DESC);
        CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);

        CREATE TABLE IF NOT EXISTS decision_drafts (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          draft_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS decision_drafts_updated_at_idx ON decision_drafts(updated_at DESC);
        CREATE INDEX IF NOT EXISTS decision_drafts_user_id_idx ON decision_drafts(user_id);

        CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_idx ON users(google_sub) WHERE google_sub IS NOT NULL;

        ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;

        ALTER TABLE decisions ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE decisions ADD COLUMN IF NOT EXISTS scoring_mode TEXT NOT NULL DEFAULT 'rating';

        ALTER TABLE decision_drafts ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
      `);
    } finally {
      client.release();
    }
  })();

  return initPromise;
}
