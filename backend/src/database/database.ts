import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env } from "../config/env.js";

const databaseFile = resolve(process.cwd(), env.databasePath);
mkdirSync(resolve(databaseFile, ".."), { recursive: true });

export const database = new DatabaseSync(databaseFile);
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
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
`);

function addUserOwnershipColumn(table: "decisions" | "decision_drafts"): void {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((column) => column.name === "user_id")) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE`);
  }
}

addUserOwnershipColumn("decisions");
addUserOwnershipColumn("decision_drafts");
const decisionColumns = database.prepare("PRAGMA table_info(decisions)").all() as { name: string }[];
if (!decisionColumns.some((column) => column.name === "scoring_mode")) {
  database.exec("ALTER TABLE decisions ADD COLUMN scoring_mode TEXT NOT NULL DEFAULT 'rating'");
}
const userColumns = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
if (!userColumns.some((column) => column.name === "email_verified_at")) {
  database.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
  database.exec("UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL");
}
const refreshedUserColumns = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
for (const column of ["date_of_birth", "gender", "phone_number", "location"] as const) {
  if (!refreshedUserColumns.some((entry) => entry.name === column)) {
    database.exec(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
  }
}
database.exec(`
  CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);
  CREATE INDEX IF NOT EXISTS decision_drafts_user_id_idx ON decision_drafts(user_id);
`);
