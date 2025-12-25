// backend/controllers/userController.js
const bcrypt = require("bcryptjs"); // hoặc bcrypt đều được nếu bạn cài bcrypt
const User = require("../models/User");

const ALLOWED_ROLES = ["Admin", "User"];

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const rows = await User.getAllAsync();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách nhân viên", error: err.message });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { username, password, hoTen, vaiTro } = req.body;

    if (!username || !password || !hoTen || !vaiTro) {
      return res.status(400).json({ message: "Thiếu dữ liệu tạo nhân viên" });
    }
    if (!ALLOWED_ROLES.includes(vaiTro)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ (Admin/User)" });
    }

    const exists = await User.existsUsernameAsync(username);
    if (exists) return res.status(409).json({ message: "Username đã tồn tại" });

    const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS || 10));

    // dùng callback create theo model của bạn
    User.create({ username, password: hashed, hoTen, vaiTro }, (err) => {
      if (err) return res.status(500).json({ message: "Lỗi tạo nhân viên", error: err.message || err });
      res.json({ message: "Tạo nhân viên thành công" });
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo nhân viên", error: err.message });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoTen, vaiTro } = req.body;

    if (!hoTen || !vaiTro) {
      return res.status(400).json({ message: "Thiếu dữ liệu cập nhật (hoTen, vaiTro)" });
    }
    if (!ALLOWED_ROLES.includes(vaiTro)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ (Admin/User)" });
    }

    // chặn tự hạ quyền bản thân
    if (String(req.user?.id) === String(id) && req.user?.vaiTro === "Admin" && vaiTro === "User") {
      return res.status(400).json({ message: "Không được tự hạ quyền Admin của chính mình" });
    }

    const result = await User.updateInfoAsync(id, { hoTen, vaiTro });
    if (!result?.affectedRows) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    res.json({ message: "Cập nhật nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật nhân viên", error: err.message });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // chặn tự xóa bản thân
    if (String(req.user?.id) === String(id)) {
      return res.status(400).json({ message: "Không được tự xóa tài khoản đang đăng nhập" });
    }

    // ✅ chặn xóa Admin (nếu bạn muốn)
    const target = await User.findByIdAsync?.(id);
    if (target && (target.VaiTro === "Admin" || target.vaiTro === "Admin")) {
      return res.status(400).json({ message: "Không được xóa tài khoản Admin" });
    }

    const result = await User.deleteByIdAsync(id);
    if (!result?.affectedRows) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    res.json({ message: "Xóa nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa nhân viên", error: err.message });
  }
};
