const { Pool } = require("pg");
require("dotenv").config();

// If a DATABASE_URL is present (Render), use it. Otherwise, fall back to local config.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for secure cloud connections
    })
  : new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

pool.on("connect", () => {
  console.log("PostgreSQL database pool connected successfully.");
});

module.exports = pool;
