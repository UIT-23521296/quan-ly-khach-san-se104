const phongModel = require("../models/phongModel");

exports.getAllRooms = async (req, res) => {
  try {
    const [rows] = await phongModel.getAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.createRoom = async (req, res) => {
  const { TenPhong, MaLoaiPhong, TinhTrang, GhiChu } = req.body;

  // validate tên phòng
  const soPhong = TenPhong?.match(/\d+/);
  if (!soPhong) {
    return res.status(400).json({
      message: "Tên phòng phải có số (VD: Phòng 101)",
    });
  }

  const MaPhong = "P" + soPhong[0];

  try {
    // 🔍 CHECK TRÙNG
    const [exist] = await phongModel.findByMaPhong(MaPhong);
    if (exist.length > 0) {
      return res.status(400).json({
        message: `Phòng ${MaPhong} đã tồn tại`,
      });
    }

    // ✅ INSERT
    await phongModel.create([
      MaPhong,
      TenPhong,
      MaLoaiPhong,
      TinhTrang,
      GhiChu,
    ]);

    res.json({
      message: "Thêm phòng thành công",
      MaPhong,
    });
  } catch (err) {
    console.error("❌ SQL ERROR CODE:", err.code);
    console.error("❌ SQL MESSAGE:", err.sqlMessage);

    return res.status(500).json({
      message: err.sqlMessage || "Không thể lưu phòng",
    });
  }
};

// ✅ THÊM MỚI
exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const { MaPhong, TenPhong, MaLoaiPhong, TinhTrang, GhiChu } = req.body;

  try {
    await phongModel.update([TenPhong, MaLoaiPhong, TinhTrang, GhiChu, id]);
    res.json({ message: "Cập nhật phòng thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ THÊM MỚI
exports.deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    await phongModel.delete(id);
    res.json({ message: "Xóa phòng thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
