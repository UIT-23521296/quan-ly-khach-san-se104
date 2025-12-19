const phieuThueModel = require("../models/phieuthueModel");
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// 1️⃣ TẠO PHIẾU
exports.createPhieuThue = async (req, res) => {
  const { MaPhong, NgayBatDauThue, NgayDuKienTra, GhiChu, danhSachKhach } = req.body;
  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    // --- BỔ SUNG: Lấy tên phòng hiện tại trước khi tạo phiếu ---
    const [rooms] = await conn.query("SELECT TenPhong FROM phong WHERE MaPhong = ?", [MaPhong]);
    if (rooms.length === 0) {
        throw new Error("Phòng không tồn tại!");
    }
    const tenPhongSnapshot = rooms[0].TenPhong; // Đây là tên phòng tại thời điểm tạo
    // ----------------------------------------------------------

    const SoPhieu = "PT" + Date.now();
    
    // SỬA: Truyền thêm tenPhongSnapshot vào vị trí tham số thứ 3
    await phieuThueModel.insertPhieuThue([
        SoPhieu, 
        MaPhong, 
        tenPhongSnapshot, // <--- Lưu tên phòng vào đây
        NgayBatDauThue, 
        NgayDuKienTra, 
        'DANG_THUE', 
        GhiChu || ''
    ]);

    // Insert Khách
    for (const k of danhSachKhach) {
      const MaKH = uuidv4();
      await phieuThueModel.insertKhachHang([MaKH, k.HoTen, k.MaLoaiKhach, k.CMND, k.DiaChi, k.SDT]);
      await phieuThueModel.insertCTPhieuThue([SoPhieu, MaKH]);
    }

    // Cập nhật phòng -> Đã thuê
    await conn.query("UPDATE phong SET TinhTrang = 'Đã thuê' WHERE MaPhong = ?", [MaPhong]);

    await conn.commit();
    res.json({ message: "Tạo phiếu thành công (Đang thuê)", SoPhieu });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
};

// 2️⃣ SỬA PHIẾU (Chỉ sửa Ngày trả, Ghi chú, Thông tin khách)
// =======================
exports.updatePhieuThue = async (req, res) => {
  const { soPhieu } = req.params;
  const { NgayDuKienTra, GhiChu, danhSachKhach } = req.body;
  
  try {
    // 1. Cập nhật thông tin chung của phiếu
    await phieuThueModel.updatePhieu(soPhieu, NgayDuKienTra, GhiChu);

    // 2. --- XỬ LÝ XÓA KHÁCH HÀNG (MỚI) ---
    // Lấy danh sách MaKH của những người CÒN LẠI trong danh sách (những người không bị xóa)
    const currentMaKHs = danhSachKhach
        .filter(k => k.MaKH) // Chỉ lấy những người đã có MaKH (khách cũ)
        .map(k => k.MaKH);

    if (currentMaKHs.length > 0) {
        // Xóa những khách trong DB mà KHÔNG nằm trong danh sách gửi lên
        // (Nghĩa là họ đã bị xóa ở frontend)
        await db.promise().query(
            `DELETE FROM ct_phieuthue WHERE SoPhieu = ? AND MaKH NOT IN (?)`,
            [soPhieu, currentMaKHs]
        );
    } else {
        // Nếu danh sách khách cũ rỗng (nghĩa là xóa hết khách cũ, chỉ còn khách mới hoặc không còn ai)
        // Thì xóa sạch liên kết cũ của phiếu này đi
        await db.promise().query(
            `DELETE FROM ct_phieuthue WHERE SoPhieu = ?`,
            [soPhieu]
        );
    }

    // 3. --- CẬP NHẬT HOẶC THÊM MỚI ---
    if (danhSachKhach && danhSachKhach.length > 0) {
      for (const k of danhSachKhach) {
        if (k.MaKH) {
           // Khách cũ -> Cập nhật thông tin
           await phieuThueModel.updateKhachHang(k.MaKH, k.HoTen, k.CMND, k.SDT, k.DiaChi, k.MaLoaiKhach);
        } else {
           // Khách mới (Chưa có MaKH) -> Tạo mới & Gắn vào phiếu
           const newMaKH = uuidv4();
           await phieuThueModel.insertKhachHang([newMaKH, k.HoTen, k.MaLoaiKhach, k.CMND, k.DiaChi, k.SDT]);
           await phieuThueModel.insertCTPhieuThue([soPhieu, newMaKH]);
        }
      }
    }
    res.json({ message: "Cập nhật phiếu thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi cập nhật: " + error.message });
  }
};

// 3️⃣ TRẢ PHÒNG (DANG_THUE -> DA_TRA_PHONG, Phòng -> Trống)
exports.checkOut = async (req, res) => {
  const { soPhieu } = req.params;
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    
    // Update phiếu
    await conn.query("UPDATE phieuthue SET TrangThaiLuuTru = 'DA_TRA_PHONG' WHERE SoPhieu = ?", [soPhieu]);
    
    // Update phòng -> Trống
    const [rows] = await conn.query("SELECT MaPhong FROM phieuthue WHERE SoPhieu = ?", [soPhieu]);
    if (rows.length > 0) {
      await conn.query("UPDATE phong SET TinhTrang = 'Trống' WHERE MaPhong = ?", [rows[0].MaPhong]);
    }

    await conn.commit();
    res.json({ message: "Trả phòng thành công" });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
};

// 4️⃣ HỦY PHIẾU (DANG_THUE -> DA_HUY, Phòng -> Trống)
exports.huyPhieu = async (req, res) => {
  const { soPhieu } = req.params;
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    await conn.query("UPDATE phieuthue SET TrangThaiLuuTru = 'DA_HUY' WHERE SoPhieu = ?", [soPhieu]);
    
    const [rows] = await conn.query("SELECT MaPhong FROM phieuthue WHERE SoPhieu = ?", [soPhieu]);
    if (rows.length > 0) {
      await conn.query("UPDATE phong SET TinhTrang = 'Trống' WHERE MaPhong = ?", [rows[0].MaPhong]);
    }

    await conn.commit();
    res.json({ message: "Đã hủy phiếu" });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
};

exports.getAllPhieuThue = async (req, res) => {
  try {
    const [rows] = await phieuThueModel.getAll();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};