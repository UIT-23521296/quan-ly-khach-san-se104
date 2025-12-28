const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// 1. Tính toán doanh thu 
const calculateRevenue = async (thang, nam) => {
    let whereClause = "YEAR(hd.NgayLap) = ?";
    let params = [nam];
    if (thang && thang !== 'ALL') {
        whereClause += " AND MONTH(hd.NgayLap) = ?";
        params.push(thang);
    }
    const sql = `
      SELECT lp.MaLoaiPhong, lp.TenLoaiPhong, COALESCE(SUM(thuc_te.ThanhTien), 0) as DoanhThu
      FROM loaiphong lp
      LEFT JOIN (
          SELECT p.MaLoaiPhong, ct.ThanhTien
          FROM ct_hoadon ct
          JOIN hoadon hd ON ct.SoHoaDon = hd.SoHoaDon
          JOIN phong p ON ct.MaPhong = p.MaPhong
          WHERE ${whereClause}
      ) thuc_te ON lp.MaLoaiPhong = thuc_te.MaLoaiPhong
      GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong
    `;
    const [rows] = await db.promise().query(sql, params);
    return rows;
};

// API: Lấy dữ liệu Live để preview
exports.getDoanhThuThang = async (req, res) => {
  const { thang, nam } = req.query;
  try {
    const rows = await calculateRevenue(thang, nam);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- API: LƯU BÁO CÁO  ---
exports.saveReport = async (req, res) => {
    const { thang, nam } = req.body;
    const conn = await db.promise().getConnection();
    
    try {
        await conn.beginTransaction();

        // 1. Tạo Header Báo Cáo
        const maBaoCao = uuidv4();
        const dbThang = (thang && thang !== 'ALL') ? thang : null;
        const tenBaoCao = dbThang 
            ? `Báo cáo doanh thu Tháng ${dbThang}/${nam}` 
            : `Báo cáo doanh thu Năm ${nam}`;

        await conn.query(
            "INSERT INTO baocao (MaBaoCao, TenBaoCao, Thang, Nam) VALUES (?, ?, ?, ?)",
            [maBaoCao, tenBaoCao, dbThang, nam]
        );

        // 2. Tính toán & Lưu Chi Tiết
        const data = await calculateRevenue(thang, nam);
        const totalRevenue = data.reduce((sum, item) => sum + Number(item.DoanhThu), 0);

        for (const item of data) {
            const tile = totalRevenue > 0 ? (item.DoanhThu / totalRevenue) : 0;
            const maChiTiet = uuidv4();
            
            await conn.query(
                `INSERT INTO ct_baocao (MaCTBC, MaBaoCao, MaLoaiPhong, TenLoaiPhong, DoanhThu, TiLe) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [maChiTiet, maBaoCao, item.MaLoaiPhong, item.TenLoaiPhong, item.DoanhThu, tile]
            );
        }

        await conn.commit();
        res.json({ message: "Lưu báo cáo thành công!" });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally { conn.release(); }
};

// --- API: LẤY DANH SÁCH BÁO CÁO ĐÃ LƯU ---
exports.getSavedReportsList = async (req, res) => {
    try {
        // Lấy danh sách các báo cáo (Header), sắp xếp mới nhất lên đầu
        const [rows] = await db.promise().query("SELECT * FROM baocao ORDER BY NgayTao DESC");
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- API: XEM CHI TIẾT 1 BÁO CÁO ---
exports.getReportDetail = async (req, res) => {
    const { id } = req.params; // id là MaBaoCao
    try {
        const [rows] = await db.promise().query("SELECT * FROM ct_baocao WHERE MaBaoCao = ?", [id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- API: XÓA BÁO CÁO ---
exports.deleteReport = async (req, res) => {
    const { id } = req.params;
    try {
        // Nhờ ON DELETE CASCADE trong SQL, chỉ cần xóa bảng cha là bảng con tự bay màu
        await db.promise().query("DELETE FROM baocao WHERE MaBaoCao = ?", [id]);
        res.json({ message: "Đã xóa báo cáo" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- API: LẤY DANH SÁCH BÁO CÁO ---
exports.getSavedReportsList = async (req, res) => {
    try {
        const { thang, nam, type } = req.query; // Thêm tham số 'type'
        
        let sql = "SELECT * FROM baocao WHERE 1=1";
        const params = [];

        if (nam) {
            sql += " AND Nam = ?";
            params.push(nam);
        }

        // LOGIC LỌC MỚI:
        if (type === 'year') {
            // Nếu xem theo Năm -> Chỉ lấy báo cáo Năm (Thang IS NULL)
            sql += " AND Thang IS NULL";
        } else {
            // Nếu xem theo Tháng -> Lấy báo cáo tháng cụ thể
            if (thang && thang !== 'ALL') {
                sql += " AND Thang = ?";
                params.push(thang);
            } else {
                // Nếu chọn "Tất cả tháng" -> Lấy tất cả báo cáo có Thang khác NULL
                sql += " AND Thang IS NOT NULL";
            }
        }

        sql += " ORDER BY NgayTao DESC";

        const [rows] = await db.promise().query(sql, params);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
};