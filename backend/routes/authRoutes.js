const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ĐĂNG NHẬP
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  User.findByUsername(username, async (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    if (results.length === 0)
      return res.status(401).json({ error: "Tài khoản không tồn tại" });

    const user = results[0];

    // So sánh mật khẩu đã hash
    const match = await bcrypt.compare(password, user.Password);
    if (!match) return res.status(401).json({ error: "Sai mật khẩu" });

    // Tạo token
    const token = jwt.sign(
      {
        id: user.MaNV,
        username: user.Username,
        vaiTro: user.VaiTro,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.MaNV,
        username: user.Username,
        hoTen: user.HoTen,
        vaiTro: user.VaiTro,
      },
    });
  });
});

// Admin tạo user mới
router.post("/create", async (req, res) => {
  const { username, password, hoTen, vaiTro } = req.body;

  const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));

  User.create({ username, password: hashed, hoTen, vaiTro }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Tạo user thành công" });
  });
});

module.exports = router;
