const db = require("../config/db");

class PaketModels {
  
  static async getAll() {
    try {
      const [rows] = await db.execute("SELECT * FROM tbl_paket");
      return rows;
    } catch (error) {
      console.error("Error ambil paket:", error);
      throw error;
    }
  }
  
}

module.exports = PaketModels;