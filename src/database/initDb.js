const pool = require("../config/db");

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("🔍 Mengecek dan mencocokkan tabel di database...");

    async function tableExists(tableName) {
      const [rows] = await connection.query("SHOW TABLES LIKE ?", [tableName]);
      return rows.length > 0;
    }

    // ✅ Buat tabel `tbl_onu` jika belum ada
    if (await tableExists("tbl_onu")) {
      console.log("✅ Tabel 'tbl_onu' sudah ada.");
    } else {
      await connection.query(`
                CREATE TABLE tbl_onu (
                    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    no_internet VARCHAR(50) NOT NULL,
                    nama VARCHAR(255) NOT NULL,
                    lokasi VARCHAR(255) NOT NULL,
                    optic_status ENUM('linkup','linkdown') NOT NULL DEFAULT 'linkup',
                    epon_port VARCHAR(10) NOT NULL,
                    onu_id INT(11) NOT NULL,
                    onu_mac VARCHAR(20) NOT NULL,
                    status ENUM('unverifed','active','suspend') NOT NULL DEFAULT 'unverifed',
                    telepon VARCHAR(25) DEFAULT NULL,
                    email VARCHAR(255) DEFAULT NULL,
                    paket VARCHAR(255) DEFAULT NULL,
                    alamat_lengkap TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
      console.log("✅ Tabel 'tbl_onu' berhasil dibuat.");
    }

    // ✅ Buat tabel `tbl_paket` jika belum ada
    if (await tableExists("tbl_paket")) {
      console.log("✅ Tabel 'tbl_paket' sudah ada.");
    } else {
      await connection.query(`
                CREATE TABLE tbl_paket (
                    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    speed VARCHAR(255) NOT NULL,
                    harga INT(11) NOT NULL,
                    normal_perangkat VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
      console.log("✅ Tabel 'tbl_paket' berhasil dibuat.");
    }

    // ✅ Tambahkan data default ke `tbl_paket` jika kosong
    const [paketRows] = await connection.query(
      "SELECT COUNT(*) as count FROM tbl_paket"
    );
    if (paketRows[0].count === 0) {
      await connection.query(`
                INSERT INTO tbl_paket (name, speed, harga, normal_perangkat) VALUES
                ('lite internet only', '5 Mbps', 175000, '2 - 4 Perangkat'),
                ('silver internet only', '10 Mbps', 220000, '4 - 8 Perangkat'),
                ('gold internet only', '30 Mbps', 350000, '10 - 20 Perangkat'),
                ('platinum internet only', '50 Mbps', 450000, '20 - 30 Perangkat'),
                ('agen reseller', 'Agen', 0, 'Unlimited')
            `);
      console.log("✅ Data awal ditambahkan ke 'tbl_paket'.");
    } else {
      console.log("✅ Data 'tbl_paket' sudah ada, tidak perlu ditambahkan.");
    }

    // ✅ Buat tabel `tbl_users` jika belum ada
    if (await tableExists("tbl_users")) {
      console.log("✅ Tabel 'tbl_users' sudah ada.");
    } else {
      await connection.query(`
                CREATE TABLE tbl_users (
                    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    api_key VARCHAR(255) NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
      console.log("✅ Tabel 'tbl_users' berhasil dibuat.");
    }

    // ✅ Tambahkan admin default jika tidak ada pengguna
    const [userRows] = await connection.query(
      "SELECT COUNT(*) as count FROM tbl_users"
    );
    if (userRows[0].count === 0) {
      await connection.query(`
                INSERT INTO tbl_users (username, password, api_key) VALUES
                ('admin', '$2b$10$d102Vif4yPY1VxARfS6XGuRqUvfuulgfaZW9oR3MSvbIVjciTIo92', 'd643b321fe51c359d6b1d045407a2de2916d1c9db0f0c2c8f43c59d5c0b1558a')
            `);
      console.log("✅ Admin default ditambahkan ke 'tbl_users'.");
    } else {
      console.log("✅ Admin 'tbl_users' sudah ada, tidak perlu ditambahkan.");
    }

    // ✅ Buat tabel `tb_onu_unauth` jika belum ada
    if (await tableExists("tb_onu_unauth")) {
      console.log("✅ Tabel 'tb_onu_unauth' sudah ada.");
    } else {
      await connection.query(`
                CREATE TABLE tb_onu_unauth (
                    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) DEFAULT 'NA',
                    mac_onu VARCHAR(17) NOT NULL UNIQUE,
                    epon_port VARCHAR(50) NOT NULL,
                    onu_id VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
      console.log("✅ Tabel 'tb_onu_unauth' berhasil dibuat.");
    }

    connection.release();
    console.log("🎉 Inisialisasi database selesai!\n");
  } catch (error) {
    switch (error.code) {
      case "ER_BAD_DB_ERROR":
        console.error(
          "❌ ERROR: Database tidak ditemukan! Periksa DB_NAME di .env."
        );
        break;
      case "ER_ACCESS_DENIED_ERROR":
        console.error(
          "❌ ERROR: Akses ke database ditolak! Periksa username/password."
        );
        break;
      default:
        console.error("❌ ERROR saat inisialisasi database:", error);
    }
    process.exit(1); // Keluar jika ada error fatal
  }
}

module.exports = initDatabase;
