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

    try {
      const [result] = await db.execute(sql, [
        data.no_internet, data.nama, data.lokasi, data.epon_port,
        data.onu_id, data.onu_mac, data.status, data.telepon,
        data.email, data.paket, data.alamat_lengkap
      ]);
      return result;
    } catch (error) {
      console.error("Error saat menambah ONU:", error);
      throw error;
    }
  }

}

module.exports = OnuModels;
