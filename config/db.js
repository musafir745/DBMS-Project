const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "wanderlust_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
  console.log("Connected to MySQL database");
}

module.exports = {
  pool,
  testConnection,
};
