process.env.TZ = "Asia/Jakarta";
const initDatabase = require("./src/database/initDb");

// Jalankan inisialisasi database sebelum server start
initDatabase().then(() => {
  console.log("✅ Database siap!");
});
