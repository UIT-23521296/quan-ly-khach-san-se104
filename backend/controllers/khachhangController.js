const khachhangModel = require("../models/khachhangModel");

exports.getAllCustomers = async (req, res) => {
  try {
    const [rows] = await khachhangModel.getAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { HoTen, CMND, SDT, DiaChi, MaLoaiKhach } = req.body;
  try {
    await khachhangModel.update(id, HoTen, CMND, SDT, DiaChi, MaLoaiKhach);
    res.json({ message: "Cập nhật thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await khachhangModel.delete(id);
    res.json({ message: "Xóa khách hàng thành công!" });
  } catch (err) {
    // --- BẮT LỖI RÀNG BUỘC KHÓA NGOẠI ---
    if (err.errno === 1451) {
        return res.status(400).json({ 
            message: "⛔ KHÔNG THỂ XÓA: Khách hàng này đã có lịch sử thuê phòng/hóa đơn trong hệ thống. Bạn chỉ có thể sửa thông tin." 
        });
    }
    // Các lỗi khác
    res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
};