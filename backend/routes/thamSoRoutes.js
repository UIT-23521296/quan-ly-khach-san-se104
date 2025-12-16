const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Lấy số khách tối đa
router.get("/sokhachMax", (req, res) => {
  const sql = "SELECT SoKhachToiDa FROM thamso LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi DB" });

    res.json({ soKhachToiDa: result[0].SoKhachToiDa });
  });
});

module.exports = router;
