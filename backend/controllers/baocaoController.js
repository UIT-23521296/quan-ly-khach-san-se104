// backend/controllers/baocaoController.js
const db = require("../config/db");

exports.getDoanhThuThang = async (req, res) => {
  const { thang, nam } = req.query; // thang có thể undefined nếu chọn báo cáo năm

  if (!nam) {
    return res.status(400).json({ message: "Vui lòng chọn năm" });
  }

  try {
    // Xây dựng điều kiện lọc động
    let whereClause = "YEAR(hd.NgayLap) = ?";
    let params = [nam];

    // Nếu có tháng -> Thêm điều kiện tháng
    if (thang && thang !== 'ALL') {
        whereClause += " AND MONTH(hd.NgayLap) = ?";
        params.push(thang);
    }

    const sql = `
      SELECT 
        lp.TenLoaiPhong,
        COALESCE(SUM(thuc_te.ThanhTien), 0) as DoanhThu
      FROM loaiphong lp
      LEFT JOIN (
          SELECT p.MaLoaiPhong, ct.ThanhTien
          FROM ct_hoadon ct
          JOIN hoadon hd ON ct.SoHoaDon = hd.SoHoaDon
          JOIN phong p ON ct.MaPhong = p.MaPhong
          WHERE ${whereClause}  -- <--- Điều kiện động ở đây
      ) thuc_te ON lp.MaLoaiPhong = thuc_te.MaLoaiPhong
      GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong
    `;

    const [rows] = await db.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tính toán doanh thu" });
  }
};