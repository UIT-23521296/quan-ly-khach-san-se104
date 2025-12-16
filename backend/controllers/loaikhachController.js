const loaikhachModel = require("../models/loaikhachModel");

exports.getAllLoaiKhach = async (req, res) => {
  try {
    const [rows] = await loaikhachModel.getAll();
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi lấy loại khách:", err);
    res.status(500).json({ message: "Không lấy được loại khách" });
  }
};
