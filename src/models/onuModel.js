const db = require("../config/db");

const OnuModel = {
  // Ambil semua data ONU
  getAll: async () => {
    const [rows] = await db.execute("SELECT * FROM tbl_onu");
    return rows;
  },

  // Ambil detail ONU berdasarkan no_internet
  getByNoInternet: async (noInternet) => {
    const [rows] = await db.execute(
      "SELECT * FROM tbl_onu WHERE no_internet = ?",
      [noInternet]
    );
    return rows[0] || null;
  },
};

module.exports = OnuModel;
