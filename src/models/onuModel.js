const db = require("../config/db");

class OnuModels {
  static async getAll() {
    try {
      const [rows] = await db.execute("SELECT * FROM tbl_onu");
      return rows;
    } catch (error) {
      console.error("Error ambil data:", error);
      throw error;
    }
  }

  static async getByNoInternet(noInternet) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM tbl_onu WHERE no_internet = ?",
        [noInternet]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error saat menambah ONU:", error);
      throw error;
    }
  }

  static async tambahOnu(data) {
    const sql = `
      INSERT INTO tbl_onu 
        (no_internet, nama, lokasi, epon_port, onu_id, onu_mac, status, telepon, email, paket, alamat_lengkap, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    console.log("MODEL :\n", data);

    try {
      const [result] = await db.execute(sql, [
        data.no_internet,
        data.nama,
        data.lokasi,
        data.epon_port,
        data.onu_id,
        data.onu_mac,
        data.status,
        data.telepon,
        data.email,
        data.paket,
        data.alamat_lengkap,
      ]);
      console.log("INPUT DB:\n", result);
      return result;
    } catch (error) {
      console.error("Error saat menambah ONU:", error);
      throw error;
    }
  }

  static async getUnregisteredOnu() {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM tb_onu_unauth WHERE name = 'NA'"
      );
      return rows.length ? rows : null;
    } catch (error) {
      console.error("❌ ERROR saat mencari ONU belum terautentikasi:", error);
      throw error;
    }
  }

  static async findOnuByMac(mac_onu) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM tb_onu_unauth WHERE mac_onu = ?",
        [mac_onu]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("❌ ERROR saat mencari ONU berdasarkan MAC:", error);
      throw error;
    }
  }

  static async registerOnu(noInternet, mac_onu, epon_port, onu_id) {
    try {
      const [result] = await db.execute(
        "INSERT INTO tbl_onu (no_internet, mac_onu, epon_port, onu_id, created_at) VALUES (?, ?, ?, ?, NOW())",
        [noInternet, mac_onu, epon_port, onu_id]
      );
      return result.insertId ? true : false;
    } catch (error) {
      console.error("❌ ERROR saat menyimpan ONU ke database:", error);
      throw error;
    }
  }

  static async newOnuAuth(data) {
    try {
      const { mac_onu, epon_port, onu_id } = data;

      const [result] = await db.execute(
        "INSERT INTO tb_onu_unauth (name, mac_onu, epon_port, onu_id, created_at) VALUES ('NA', ?, ?, ?, NOW())",
        [mac_onu, epon_port, onu_id]
      );

      return result.insertId ? true : false;
    } catch (error) {
      console.error("❌ ERROR saat menyimpan ONU belum terautentikasi:", error);
      throw error;
    }
  }

  static async updateOnuWithAuth(noInternet, mac_onu, epon_port, onu_id) {
    try {
      // Update tbl_onu dengan MAC, Port, dan ONU ID berdasarkan nomor internet
      const [result] = await db.execute(
        "UPDATE tbl_onu SET onu_mac = ?, epon_port = ?, onu_id = ?, status = ?, updated_at = NOW() WHERE no_internet = ?",
        [mac_onu, epon_port, onu_id, 'active', noInternet]
      );

      if (result.affectedRows > 0) {
        // Hapus dari tb_onu_unauth karena sudah terautentikasi
        await db.execute("DELETE FROM tb_onu_unauth WHERE mac_onu = ?", [
          mac_onu,
        ]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ ERROR saat mengupdate ONU:", error);
      throw error;
    }
  }

  static async saveUnregisteredOnu(mac_onu, epon_port, onu_id) {
    try {
      const [existing] = await db.execute(
        "SELECT * FROM tb_onu_unauth WHERE mac_onu = ?",
        [mac_onu]
      );

      if (existing.length === 0) {
        await db.execute(
          "INSERT INTO tb_onu_unauth (mac_onu, epon_port, onu_id, created_at) VALUES (?, ?, ?, NOW())",
          [mac_onu, epon_port, onu_id]
        );
        console.log(`✅ ONU baru disimpan ke tb_onu_unauth: ${mac_onu}`);
      } else {
        console.log(`⚠️ ONU sudah ada di tb_onu_unauth: ${mac_onu}`);
      }
    } catch (error) {
      console.error("❌ ERROR saat menyimpan ONU baru:", error);
      throw error;
    }
  }
}

module.exports = OnuModels;
