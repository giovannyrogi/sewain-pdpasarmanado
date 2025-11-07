import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

// Tentukan file .env sesuai NODE_ENV
const envFile = process.env.NODE_ENV === "production"
  ? ".env.production"
  : process.env.NODE_ENV === "development"
  ? ".env.development"
  : ".env.local";

// Load env dari file yang sesuai
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(`[DB] Environment aktif: ${process.env.NODE_ENV}`);
console.log(`[DB] Env file dibaca: ${envFile}`);

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

export default pool;
