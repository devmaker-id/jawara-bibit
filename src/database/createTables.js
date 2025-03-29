require("dotenv").config();
const mysql = require("mysql2/promise");

const createTables = async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
            port: process.env.DB_PORT,
        });

        console.log(`Trhubung ke Db ${db.database}`);

        // Tabel tbl_onu
        await db.query(`
            CREATE TABLE IF NOT EXISTS tbl_onu (
                id INT(11) NOT NULL AUTO_INCREMENT,
                no_internet VARCHAR(50) NOT NULL,
                nama VARCHAR(255) NOT NULL,
                lokasi VARCHAR(255) NOT NULL,
                epon_port VARCHAR(10) NOT NULL,
                onu_id INT(11) NOT NULL,
                onu_mac VARCHAR(20) NOT NULL,
                status ENUM('unverifed','active','suspend') NOT NULL DEFAULT 'unverifed',
                telepon VARCHAR(25) DEFAULT NULL,
                email VARCHAR(255) DEFAULT NULL,
                paket VARCHAR(255) DEFAULT NULL,
                alamat_lengkap TEXT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log("✅ Tabel 'tbl_onu' berhasil dibuat atau sudah ada.");

        // Tabel tbl_paket
        await db.query(`
            CREATE TABLE IF NOT EXISTS tbl_paket (
                id INT(11) NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                speed VARCHAR(255) NOT NULL,
                harga INT(11) NOT NULL,
                normal_perangkat VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log("✅ Tabel 'tbl_paket' berhasil dibuat atau sudah ada.");

        // Tabel tbl_users
        await db.query(`
            CREATE TABLE IF NOT EXISTS tbl_users (
                id INT(11) NOT NULL AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                api_key VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log("✅ Tabel 'tbl_users' berhasil dibuat atau sudah ada.");

        // Tabel tb_onu_unauth
        await db.query(`
            CREATE TABLE IF NOT EXISTS tb_onu_unauth (
                id INT(11) NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) DEFAULT 'NA',
                mac_onu VARCHAR(17) NOT NULL,
                epon_port VARCHAR(50) NOT NULL,
                onu_id VARCHAR(50) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log("✅ Tabel 'tb_onu_unauth' berhasil dibuat atau sudah ada.");

        await db.end();
    } catch (err) {
        console.error("❌ Error saat membuat tabel:", err);
    }
};

// Eksekusi
createTables();
