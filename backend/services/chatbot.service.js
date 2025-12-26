require("dotenv").config();
const mysql = require("mysql2/promise");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pool MySQL READ ONLY
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // chatbot
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
});

/**
 * Kiểm tra SQL an toàn (CHỈ SELECT)
 */
function isSafeSQL(sql) {
  if (!sql) return false;

  const cleaned = sql
    .replace(/```sql/gi, "")
    .replace(/```/g, "")
    .replace(/--.*$/gm, "")
    .trim()
    .toLowerCase();

  // chỉ cho phép SELECT
  if (!cleaned.startsWith("select")) return false;

  // chặn câu nguy hiểm
  const forbidden = /(insert|update|delete|drop|alter|truncate|create)/i;
  return !forbidden.test(cleaned);
}

async function askDatabase(question) {
  // 1. AI sinh SQL
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
Bạn là AI cho hệ thống quản lý khách sạn.
Bạn PHẢI sinh câu lệnh SQL SELECT dựa CHÍNH XÁC trên schema sau.
TUYỆT ĐỐI không được đoán bảng hoặc cột không tồn tại.

===== DATABASE: quanlykhachsan =====

Bảng phong(
  MaPhong,
  TenPhong,
  MaLoaiPhong,
  TinhTrang
)
TinhTrang gồm:
- 'Trống'
- 'Đã thuê'
- 'Ngưng kinh doanh'

Bảng loaiphong(
  MaLoaiPhong,
  TenLoaiPhong,
  DonGia
)

Bảng phieuthue(
  SoPhieu,
  MaPhong,
  NgayBatDauThue,
  NgayDuKienTra,
  TrangThaiLuuTru
)

TrangThaiLuuTru gồm:
- 'DANG_THUE'
- 'DA_TRA_PHONG'
- 'DA_HUY'
- 'DA_THANH_TOAN'

Bảng khachhang(
  MaKH,
  HoTen,
  CMND,
  SDT
)

Bảng hoadon(
  SoHoaDon,
  NgayLap,
  TenKhachHangCoQuan,
  TriGia,
  TrangThaiThanhToan
)

Bảng ct_hoadon(
  SoHoaDon,
  MaPhong,
  SoNgayThue,
  DonGia,
  SoKhach,
  PhuThu,
  ThanhTien
)

Bảng baocao(
  MaBaoCao,
  TenBaoCao,
  Thang,
  Nam
)

Bảng ct_baocao(
  MaBaoCao,
  MaLoaiPhong,
  TenLoaiPhong,
  DoanhThu,
  TiLe
)

===== NGHIỆP VỤ ĐƯỢC PHÉP =====

1. Phòng trống:
- Lấy từ bảng phong
- Điều kiện: TinhTrang = 'Trống'

2. Giá phòng:
- Join phong.MaLoaiPhong = loaiphong.MaLoaiPhong

3. Danh sách hóa đơn:
- Lấy từ bảng hoadon

4. Doanh thu:
- Doanh thu = SUM(TriGia) từ bảng hoadon
- Doanh thu hôm nay: NgayLap = CURDATE()
- Doanh thu tháng: MONTH(NgayLap) & YEAR(NgayLap)
- Doanh thu năm: YEAR(NgayLap)

5. Báo cáo doanh thu theo loại phòng:
- Lấy từ ct_baocao
- Join với baocao qua MaBaoCao
- Có thể lọc theo Thang, Nam

===== QUY TẮC BẮT BUỘC =====
- CHỈ sinh SQL SELECT
- KHÔNG INSERT / UPDATE / DELETE
- KHÔNG DROP / ALTER / TRUNCATE
- KHÔNG dùng bảng ngoài schema
- KHÔNG giải thích
- CHỈ TRẢ VỀ SQL THUẦN

        `,
      },
      {
        role: "user",
        content: question,
      },
    ],
  });

  // 👉 LÀM SẠCH SQL (QUAN TRỌNG)
  let sql = completion.choices[0].message.content;
  sql = sql
    .replace(/```sql/gi, "")
    .replace(/```/g, "")
    .trim();

  // 👉 KIỂM TRA AN TOÀN
  if (!isSafeSQL(sql)) {
    return "❌ Câu hỏi không hợp lệ hoặc vượt quyền truy cập.";
  }

  // 2. Chạy SQL
  const [rows] = await pool.query(sql);

  // 3. AI diễn giải kết quả
  const explain = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `
Bạn là nhân viên lễ tân trả lời qua chatbot.
- Trả lời NGẮN GỌN
- Kết quả trả về có ngày thì cộng thêm 1 ngày (do chênh lệch múi giờ)
- Ngày tháng định dạng DD/MM/YYYY
- Chia dòng rõ ràng
- KHÔNG dùng văn phong email
- KHÔNG ký tên
- Bạn chỉ trả lời dựa trên DỮ LIỆU được cung cấp.
- Nếu không có dữ liệu, bạn nói "Rất tiếc, không tìm thấy thông tin phù hợp."
- Phù hợp giao diện chat
`,
      },
      {
        role: "user",
        content: `Dữ liệu: ${JSON.stringify(
          rows
        )}\nHãy trả lời khách bằng tiếng Việt.`,
      },
    ],
  });

  return explain.choices[0].message.content;
}

module.exports = { askDatabase };
