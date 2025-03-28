const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { generateApiKey } = require("../helpers/authHelper");

exports.registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username dan password diperlukan" });
    }

    const [user] = await db.query(
      "SELECT username from tbl_users WHERE username = ?",
      username
    );
    if (user) {
      return res
        .status(403)
        .json({ success: false, message: "Username telah terdaftart" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = generateApiKey();
    await db.query(
      "INSERT INTO tbl_users (username, password, api_key) VALUES (?, ?, ?)",
      [username, hashedPassword, apiKey]
    );

    res.json({
      success: true,
      message: "User berhasil didaftarkan",
      api_key: apiKey,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Kesalahan server" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await db.query(
      "SELECT * FROM tbl_users WHERE username = ?",
      [username]
    );
    if (user.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Username atau password salah" });
    }
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Username atau password salah" });
    }

    res.json({
      success: true,
      message: "Login berhasil",
      api_key: user[0].api_key,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Kesalahan server" });
  }
};

exports.userInfo = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const [user] = await db.query(
      "SELECT * FROM tbl_users WHERE api_key =?",
      apiKey
    );

    res.status(200).json({
      success: true,
      data: {
        username: user[0].username,
        apiKey: user[0].api_key,
        created_at: user[0].created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Kesalahan server" });
  }
};
