require("dotenv").config();
const mysql = require("mysql2/promise");

const seedData = async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: "db_isp",
            port: process.env.DB_PORT,
        });

        console.log("✅ Terhubung ke database 'db_isp'");

        // Seed data untuk tbl_paket
        await db.query(`
            INSERT INTO tbl_paket (id, name, speed, harga, normal_perangkat, created_at) VALUES
            (1, 'lite internet only', '5 Mbps', 175000, '2 - 4 Perangkat', NOW()),
            (2, 'silver internet only', '10 Mbps', 220000, '4 - 8 Perangkat', NOW()),
            (3, 'gold internet only', '30 Mbps', 350000, '10 - 20 Perangkat', NOW()),
            (4, 'platinum internet only', '50 Mbps', 450000, '20 - 30 Perangkat', NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), speed = VALUES(speed), harga = VALUES(harga), normal_perangkat = VALUES(normal_perangkat);
        `);
        console.log("✅ Data default 'tbl_paket' telah dimasukkan atau sudah ada.");

        // Seed data untuk tbl_users
        await db.query(`
            INSERT INTO tbl_users (id, username, password, api_key, created_at, updated_at) VALUES
            (1, 'admin', '$2b$10$d102Vif4yPY1VxARfS6XGuRqUvfuulgfaZW9oR3MSvbIVjciTIo92', 'd643b321fe51c359d6b1d045407a2de2916d1c9db0f0c2c8f43c59d5c0b1558a', NOW(), NOW())
            ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password), api_key = VALUES(api_key);
        `);
        console.log("✅ Data default 'tbl_users' telah dimasukkan atau sudah ada.");

        await db.end();
    } catch (err) {
        console.error("❌ Error saat memasukkan data default:", err);
    }
};

// Eksekusi
seedData();
