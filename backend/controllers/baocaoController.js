const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// Hàm tính toán (Giữ nguyên, nhưng chú ý nó đã trả về TenLoaiPhong rồi)
const calculateRevenue = async (thang, nam) => {
    let whereClause = "YEAR(hd.NgayLap) = ?";
    let params = [nam];

    if (thang && thang !== 'ALL') {
        whereClause += " AND MONTH(hd.NgayLap) = ?";
        params.push(thang);
    }

    const sql = `
      SELECT 
        lp.MaLoaiPhong,
        lp.TenLoaiPhong, -- Chúng ta sẽ lấy cái này để lưu snapshot
        COALESCE(SUM(thuc_te.ThanhTien), 0) as DoanhThu
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

exports.getDoanhThuThang = async (req, res) => {
  const { thang, nam } = req.query;
  if (!nam) return res.status(400).json({ message: "Vui lòng chọn năm" });
  try {
    const rows = await calculateRevenue(thang, nam);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tính toán doanh thu" });
  }
};

// --- CẬP NHẬT HÀM LƯU BÁO CÁO (SNAPSHOT) ---
exports.saveReport = async (req, res) => {
    const { thang, nam } = req.body;
    if (!nam) return res.status(400).json({ message: "Thiếu thông tin năm" });

    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        // 1. Xác định tháng (NULL nếu là báo cáo năm)
        const dbThang = (thang && thang !== 'ALL') ? thang : null;

        // 2. Xóa báo cáo cũ của kỳ này (để lưu đè cái mới)
        let deleteSql = "DELETE FROM baocaodoanhthu WHERE Nam = ?";
        let deleteParams = [nam];
        if (dbThang) {
            deleteSql += " AND Thang = ?";
            deleteParams.push(dbThang);
        } else {
            deleteSql += " AND Thang IS NULL";
        }
        await conn.query(deleteSql, deleteParams);

        // 3. Tính toán dữ liệu
        const data = await calculateRevenue(thang, nam);
        const totalRevenue = data.reduce((sum, item) => sum + Number(item.DoanhThu), 0);

        // 4. Insert Snapshot (Lưu cả Tên Loại Phòng)
        for (const item of data) {
            const tile = totalRevenue > 0 ? (item.DoanhThu / totalRevenue) : 0;
            const maBaoCaoRow = uuidv4(); 

            // --- SỬA CÂU QUERY INSERT Ở ĐÂY ---
            // Chúng ta lưu item.TenLoaiPhong vào cột TenLoaiPhong
            await conn.query(
                `INSERT INTO baocaodoanhthu (MaBaoCao, Thang, Nam, MaLoaiPhong, TenLoaiPhong, DoanhThu, TiLe) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    maBaoCaoRow, 
                    dbThang, 
                    nam, 
                    item.MaLoaiPhong, 
                    item.TenLoaiPhong, 
                    item.DoanhThu, 
                    tile
                ]
            );
        }

        await conn.commit();
        res.json({ message: "Lưu báo cáo thành công!" });

    } catch (err) {
        await conn.rollback();
        console.error("Lỗi lưu báo cáo:", err);
        res.status(500).json({ message: "Lỗi server: " + err.message });
    } finally {
        conn.release();
    }
};

// --- API: XEM BÁO CÁO ĐÃ LƯU ---
exports.getSavedReport = async (req, res) => {
    const { thang, nam } = req.query;
    if (!nam) return res.status(400).json({ message: "Thiếu thông tin năm" });

    try {
        const dbThang = (thang && thang !== 'ALL') ? thang : null;
        
        let sql = "SELECT * FROM baocaodoanhthu WHERE Nam = ?";
        let params = [nam];

        if (dbThang) {
            sql += " AND Thang = ?";
            params.push(dbThang);
        } else {
            sql += " AND Thang IS NULL";
        }

        const [rows] = await db.promise().query(sql, params);
        
        // Trả về mảng rỗng nếu chưa lưu, hoặc mảng dữ liệu nếu có
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy báo cáo đã lưu" });
    }
};