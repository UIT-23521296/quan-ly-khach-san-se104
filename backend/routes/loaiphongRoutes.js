const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET tất cả loại phòng
router.get("/", async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT MaLoaiPhong, TenLoaiPhong, DonGia FROM loaiphong");

    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi lấy loại phòng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
