// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

const isBcryptHash = (s) => typeof s === "string" && /^\$2[aby]\$\d{2}\$/.test(s);

const queryAsync = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
  });

router.post("/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username/password" });
    }

    const results = await queryAsync("SELECT * FROM users WHERE Username = ? LIMIT 1", [username]);
    if (!results || results.length === 0) {
      return res.status(401).json({ message: "Sai username hoặc mật khẩu" });
    }

    const user = results[0];
    const dbPass = user.Password;

    let ok = false;

    if (isBcryptHash(dbPass)) {
      ok = await bcrypt.compare(password, dbPass);
    } else {
      // ✅ legacy/plaintext -> cho login nếu khớp, rồi tự hash lại
      ok = password === String(dbPass || "");
      if (ok) {
        const newHash = await bcrypt.hash(password, SALT_ROUNDS);
        await queryAsync("UPDATE users SET Password = ? WHERE MaNV = ?", [newHash, user.MaNV]);
      }
    }

    if (!ok) return res.status(401).json({ message: "Sai mật khẩu" });

    const payload = {
      id: user.MaNV,
      username: user.Username,
      hoTen: user.HoTen,
      vaiTro: user.VaiTro,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: payload,
    });
  } catch (err) {
    console.error("LOGIN_ERR:", err);
    return res.status(500).json({ message: "Lỗi đăng nhập", error: err.message });
  }
});

module.exports = router;