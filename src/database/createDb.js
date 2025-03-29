require("dotenv").config();
const mysql = require("mysql2/promise");

const createDatabase = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            port: process.env.DB_PORT,
        });

        console.log("✅ Terhubung ke MySQL");

        await connection.query("CREATE DATABASE IF NOT EXISTS db_isp");
        console.log("✅ Database 'db_isp' berhasil dibuat atau sudah ada.");

        await connection.end();
    } catch (err) {
        console.error("❌ Error saat membuat database:", err);
    }
};

// Eksekusi
createDatabase();
