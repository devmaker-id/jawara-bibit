const db = require("../config/db");

async function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res
      .status(403)
      .json({ success: false, message: "API Key diperlukan" });
  }

  try {
    const [user] = await db.query("SELECT * FROM tbl_users WHERE api_key = ?", [
      apiKey,
    ]);

    if (user.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "API Key tidak valid" });
    }

    req.user = user[0];
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Kesalahan server" });
  }
}

module.exports = apiKeyAuth;
