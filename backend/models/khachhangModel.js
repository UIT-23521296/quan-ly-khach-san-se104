const db = require("../config/db");

exports.getAll = () => {
  // Lấy danh sách khách kèm tên loại khách và đếm xem họ đang đứng tên bao nhiêu phiếu "DANG_THUE"
  const sql = `
    SELECT 
        kh.*, 
        lk.TenLoaiKhach,
        (
            SELECT COUNT(*) 
            FROM ct_phieuthue ct 
            JOIN phieuthue pt ON ct.SoPhieu = pt.SoPhieu 
            WHERE ct.MaKH = kh.MaKH AND pt.TrangThaiLuuTru = 'DANG_THUE'
        ) as DangThueCount
    FROM khachhang kh
    LEFT JOIN loaikhach lk ON kh.MaLoaiKhach = lk.MaLoaiKhach
    ORDER BY kh.HoTen ASC
  `;
  return db.promise().query(sql);
};

exports.update = (maKH, hoTen, cmnd, sdt, diaChi, maLoaiKhach) => {
  const sql = `UPDATE khachhang SET HoTen = ?, CMND = ?, SDT = ?, DiaChi = ?, MaLoaiKhach = ? WHERE MaKH = ?`;
  return db.promise().query(sql, [hoTen, cmnd, sdt, diaChi, maLoaiKhach, maKH]);
};

exports.delete = async (maKH) => {
    // // 1. Xóa trong ct_phieuthue trước (Lịch sử lưu trú)
    // await db.promise().query("DELETE FROM ct_phieuthue WHERE MaKH = ?", [maKH]);
    // // 2. Xóa khách hàng
    return db.promise().query("DELETE FROM khachhang WHERE MaKH = ?", [maKH]);
};