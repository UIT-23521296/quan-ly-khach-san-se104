const phongModel = require("../models/phongModel");
const db = require("../config/db");

exports.getAllRooms = async (req, res) => {
  try {
    const [rows] = await phongModel.getAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// 1️⃣ CREATE: Mặc định TinhTrang là 'Trống'
exports.createRoom = async (req, res) => {
  const { TenPhong, MaLoaiPhong, GhiChu } = req.body; // Bỏ TinhTrang khỏi req.body

  const soPhong = TenPhong?.match(/\d+/);
  if (!soPhong) return res.status(400).json({ message: "Tên phòng phải có số" });

  const MaPhong = "P" + soPhong[0];

  try {
    const [exist] = await phongModel.findByMaPhong(MaPhong);
    if (exist.length > 0) return res.status(400).json({ message: "Phòng đã tồn tại" });

    // ✅ FORCE STATUS = 'Trống'
    await phongModel.create([MaPhong, TenPhong, MaLoaiPhong, 'Trống', GhiChu]);
    res.json({ message: "Thêm phòng thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2️⃣ UPDATE: Chỉ sửa Loại và Ghi chú
exports.updateRoom = async (req, res) => {
  const { id } = req.params; // id là MaPhong
  const { TenPhong, MaLoaiPhong, GhiChu } = req.body; 
  
  try {
    // BƯỚC 1: Lấy thông tin cũ của phòng để kiểm tra trạng thái
    const [rows] = await db.promise().query("SELECT * FROM PHONG WHERE MaPhong = ?", [id]);
    
    if (rows.length === 0) {
        return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    const phongCu = rows[0];

    // BƯỚC 2: Kiểm tra logic nghiệp vụ
    // Nếu phòng đang có khách ('Đã thuê'), kiểm tra xem user có cố sửa Tên hoặc Loại không
    if (phongCu.TinhTrang === 'Đã thuê') {
        if (TenPhong !== phongCu.TenPhong) {
            return res.status(400).json({ message: "Phòng đang có khách thuê, KHÔNG được đổi Tên phòng!" });
        }
        if (MaLoaiPhong !== phongCu.MaLoaiPhong) {
             return res.status(400).json({ message: "Phòng đang có khách thuê, KHÔNG được đổi Loại phòng!" });
        }
    }

    // BƯỚC 3: Nếu hợp lệ (hoặc chỉ sửa Ghi chú), tiến hành Update
    await phongModel.updateInfo(TenPhong, MaLoaiPhong, GhiChu, id);
    res.json({ message: "Cập nhật thông tin phòng thành công" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Bảo trì phòng
exports.toggleMaintenance = async (req, res) => {
  const { id } = req.params; // id là MaPhong
  const { status } = req.body; // 'Bảo trì' hoặc 'Trống'

  try {
    await phongModel.updateStatus(status, id);
    res.json({ message: `Đã chuyển phòng sang trạng thái: ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ngưng / Kích hoạt kinh doanh
exports.toggleBusinessStatus = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'stop' hoặc 'active'

  try {
    // --- BƯỚC 1: KIỂM TRA TRẠNG THÁI HIỆN TẠI ---
    const [check] = await db.promise().query("SELECT TinhTrang FROM phong WHERE MaPhong = ?", [id]);
    if (check.length === 0) return res.status(404).json({ message: "Phòng không tồn tại" });
    
    const currentStatus = check[0].TinhTrang;

    // Nếu muốn Ngưng kinh doanh mà phòng đang có khách -> CHẶN
    if (action === 'stop' && currentStatus === 'Đã thuê') {
        return res.status(400).json({ message: "Không thể ngưng kinh doanh: Phòng đang có khách thuê!" });
    }
    // -------------------------------------------------------

    const newStatus = action === 'stop' ? 'Ngưng kinh doanh' : 'Trống';
    await phongModel.updateStatus(newStatus, id);
    res.json({ message: "Cập nhật trạng thái kinh doanh thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa phòng
exports.deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    // --- BƯỚC 1: KIỂM TRA TRẠNG THÁI  ---
    const [check] = await db.promise().query("SELECT TinhTrang FROM phong WHERE MaPhong = ?", [id]);
    if (check.length > 0 && check[0].TinhTrang === 'Đã thuê') {
        return res.status(400).json({ message: "Không thể xóa: Phòng đang có khách thuê!" });
    }
    // ------------------------------------------------

    await phongModel.delete(id);
    res.json({ message: "Xóa phòng thành công" });
  } catch (err) {
    // Check lỗi khóa ngoại (nếu phòng đã có lịch sử cũ)
    if (err.errno === 1451) {
         return res.status(400).json({ message: "Không thể xóa phòng đã có lịch sử thuê. Hãy chọn 'Ngưng kinh doanh'." });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.getRoomById = async (req, res) => {
  const { id } = req.params; // id chính là MaPhong (VD: P101)

  try {
    // Dùng lại hàm bạn đã có trong model
    const [rows] = await phongModel.findByMaPhong(id);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    // Trả về 1 phòng
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};