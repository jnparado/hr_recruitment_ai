#!/usr/bin/env node
/**
 * Apply supabase/schema.sql to your remote Supabase Postgres database.
 *
 * Requires SUPABASE_DB_PASSWORD in .env.local (or DATABASE_URL).
 * Find the password: Supabase Dashboard → Project Settings → Database.
 *
 * Usage: npm run db:setup
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) return null;

  const ref = url.replace(/^https?:\/\//, "").replace(/\.supabase\.co\/?$/, "");
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

loadEnvLocal();

const connectionString = getConnectionString();
if (!connectionString) {
  console.error(`
Missing database credentials.

Add one of these to .env.local:

  SUPABASE_DB_PASSWORD=your-database-password
  # (from Supabase Dashboard → Project Settings → Database)

Or:

  DATABASE_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres

Then run: npm run db:setup

Alternatively, paste supabase/schema.sql, supabase/policies.sql, and supabase/storage-policies.sql into the Supabase SQL Editor.
`);
  process.exit(1);
}

const schemaPath = resolve(root, "supabase/schema.sql");
const policiesPath = resolve(root, "supabase/policies.sql");
const schemaSql = readFileSync(schemaPath, "utf8");
const policiesSql = existsSync(policiesPath) ? readFileSync(policiesPath, "utf8") : "";

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(schemaSql);
  console.log("✓ Supabase tables created successfully.");

  if (policiesSql) {
    await client.query(policiesSql);
    console.log("✓ RLS policies applied.");
  }

  const { rows } = await client.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename"
  );
  console.log("Tables:", rows.map((r) => r.tablename).join(", "));

  const { rows: jobs } = await client.query("select count(*)::int as n from jobs");
  console.log(`Sample jobs seeded: ${jobs[0].n}`);
} catch (err) {
  console.error("Failed to apply schema:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
