// Applies db/schema.sql to the database in DATABASE_URL (npm run db:setup, after `vercel env pull .env.local`).
// Every statement is "if not exists", so running it again changes nothing.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(new URL("./schema.sql", import.meta.url), "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
for (const statement of statements) await sql.query(statement);
console.log(`schema applied: ${statements.length} statements`);
