import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "sewain-pdpasar",
  password: "testing123",
  port: 5432,
});

export default pool;