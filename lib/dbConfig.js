// import { Pool } from "pg";

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "sewain-pdpasar",
//   password: "testing123",
//   port: 5432,
// });

// export default pool;

import { Pool } from "pg";

const pool = new Pool({
  user: "pdpasarmdodb",
  host: "localhost",
  database: "sewain_db",
  password: "@DbSewain!@",
  port: 5432,
});

export default pool;