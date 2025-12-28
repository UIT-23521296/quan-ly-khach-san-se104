// backend/controllers/userController.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ALLOWED_ROLES = ["Admin", "Manage", "User"];

// helper: lấy user theo id (fallback nếu thiếu findByIdAsync)
async function getUserByIdSafe(id) {
  if (typeof User.findByIdAsync === "function") return await User.findByIdAsync(id);

  // fallback: quét toàn bộ (ít user thì OK)
  const all = await User.getAllAsync();
  return all?.find((u) => String(u.id ?? u.MaNV) === String(id));
}

// ===================== ADMIN APIs =====================

// GET /api/users  (Admin xem tất cả)
exports.getAllUsers = async (req, res) => {
  try {
    const rows = await User.getAllAsync();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách nhân viên", error: err.message });
  }
};

// POST /api/users  (Admin tạo user/manage/admin)
exports.createUser = async (req, res) => {
  try {
    const { username, password, hoTen, vaiTro } = req.body;

    if (!username || !password || !hoTen || !vaiTro) {
      return res.status(400).json({ message: "Thiếu dữ liệu tạo nhân viên" });
    }
    if (!ALLOWED_ROLES.includes(vaiTro)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ (Admin/Manage/User)" });
    }

    const exists = await User.existsUsernameAsync(username);
    if (exists) return res.status(409).json({ message: "Username đã tồn tại" });

    const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS || 10));

    User.create({ username, password: hashed, hoTen, vaiTro }, (err) => {
      if (err) return res.status(500).json({ message: "Lỗi tạo nhân viên", error: err.message || err });
      res.json({ message: "Tạo nhân viên thành công" });
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo nhân viên", error: err.message });
  }
};

// PUT /api/users/:id  (Admin sửa hoTen + vaiTro + (optional) password)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoTen, vaiTro, password } = req.body;

    if (!hoTen || !vaiTro) {
      return res.status(400).json({ message: "Thiếu dữ liệu cập nhật (hoTen, vaiTro)" });
    }
    if (!ALLOWED_ROLES.includes(vaiTro)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ (Admin/Manage/User)" });
    }

    // chặn tự hạ quyền bản thân
    if (String(req.user?.id) === String(id) && req.user?.vaiTro === "Admin" && vaiTro !== "Admin") {
      return res.status(400).json({ message: "Không được tự hạ quyền Admin của chính mình" });
    }

    // 1) update info
    const result = await User.updateInfoAsync(id, { hoTen, vaiTro });
    if (!result?.affectedRows) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    // 2) update password (nếu có)
    if (password && String(password).trim() !== "") {
      const newPass = String(password);

      if (newPass.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới tối thiểu 6 ký tự" });
      }

      const hashed = await bcrypt.hash(newPass, Number(process.env.SALT_ROUNDS || 10));

      // cần có hàm này trong model User
      const passResult = await User.updatePasswordAsync(id, hashed);
      if (!passResult?.affectedRows) {
        return res.status(500).json({ message: "Cập nhật mật khẩu thất bại" });
      }
    }

    res.json({ message: "Cập nhật nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật nhân viên", error: err.message });
  }
};


// DELETE /api/users/:id  (Admin xóa Manage/User, KHÔNG xóa Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user?.id) === String(id)) {
      return res.status(400).json({ message: "Không được tự xóa tài khoản đang đăng nhập" });
    }

    const target = await getUserByIdSafe(id);
    const targetRole = target?.VaiTro ?? target?.vaiTro;
    if (targetRole === "Admin") {
      return res.status(400).json({ message: "Không được xóa tài khoản Admin" });
    }

    const result = await User.deleteByIdAsync(id);
    if (!result?.affectedRows) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    res.json({ message: "Xóa nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa nhân viên", error: err.message });
  }
};

// ===================== MANAGE APIs =====================

// GET /api/users/managed  (Manage chỉ xem role=User)
exports.getManagedUsers = async (req, res) => {
  try {
    const rows = await User.getAllAsync();
    const onlyUsers = (rows || []).filter((u) => (u.VaiTro ?? u.vaiTro) === "User");
    res.json(onlyUsers);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách nhân viên", error: err.message });
  }
};

// POST /api/users/managed  (Manage chỉ tạo role=User)
exports.createManagedUser = async (req, res) => {
  try {
    const { username, password, hoTen } = req.body;

    if (!username || !password || !hoTen) {
      return res.status(400).json({ message: "Thiếu dữ liệu tạo nhân viên (username,password,hoTen)" });
    }

    const exists = await User.existsUsernameAsync(username);
    if (exists) return res.status(409).json({ message: "Username đã tồn tại" });

    const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS || 10));

    User.create({ username, password: hashed, hoTen, vaiTro: "User" }, (err) => {
      if (err) return res.status(500).json({ message: "Lỗi tạo nhân viên", error: err.message || err });
      res.json({ message: "Tạo nhân viên (User) thành công" });
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo nhân viên", error: err.message });
  }
};

// PUT /api/users/managed/:id  (Manage chỉ sửa hoTen của User, không đổi role)
// PUT /api/users/managed/:id  (Manage chỉ sửa hoTen + (optional) password của User)
exports.updateManagedUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoTen, password } = req.body;

    if (!hoTen) return res.status(400).json({ message: "Thiếu dữ liệu cập nhật (hoTen)" });

    const target = await getUserByIdSafe(id);
    if (!target) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    const targetRole = target?.VaiTro ?? target?.vaiTro;
    if (targetRole !== "User") {
      return res.status(403).json({ message: "Manage chỉ được sửa tài khoản có role User" });
    }

    const result = await User.updateInfoAsync(id, { hoTen, vaiTro: "User" });
    if (!result?.affectedRows) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    if (password && String(password).trim() !== "") {
      const newPass = String(password);
      if (newPass.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới tối thiểu 6 ký tự" });
      }

      const hashed = await bcrypt.hash(newPass, Number(process.env.SALT_ROUNDS || 10));
      const passResult = await User.updatePasswordAsync(id, hashed);
      if (!passResult?.affectedRows) {
        return res.status(500).json({ message: "Cập nhật mật khẩu thất bại" });
      }
    }

    res.json({ message: "Cập nhật nhân viên (User) thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật nhân viên", error: err.message });
  }
};


// DELETE /api/users/managed/:id  (Manage chỉ xóa User)
exports.deleteManagedUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user?.id) === String(id)) {
      return res.status(400).json({ message: "Không được tự xóa tài khoản đang đăng nhập" });
    }

    const target = await getUserByIdSafe(id);
    if (!target) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    const targetRole = target?.VaiTro ?? target?.vaiTro;
    if (targetRole !== "User") {
      return res.status(403).json({ message: "Manage chỉ được xóa tài khoản có role User" });
    }

    const result = await User.deleteByIdAsync(id);
    if (!result?.affectedRows) return res.status(404).json({ message: "Nhân viên không tồn tại" });

    res.json({ message: "Xóa nhân viên (User) thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa nhân viên", error: err.message });
  }
};
