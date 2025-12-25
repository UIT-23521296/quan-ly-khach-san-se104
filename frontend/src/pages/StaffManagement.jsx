import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";

// ===== Helpers =====
const pick = (obj, keys, fallback = "") => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return fallback;
};

const normalizeUser = (u) => {
  const id = pick(u, ["MaNV", "id", "ID", "userId"]);
  const username = pick(u, ["Username", "username", "TenDangNhap"]);
  const hoTen = pick(u, ["HoTen", "hoTen", "fullName", "TenNV"]);
  const vaiTro = pick(u, ["VaiTro", "vaiTro", "role"], "User");
  const ngayTao = pick(u, ["NgayTao", "createdAt", "ngayTao"]);
  return { raw: u, id, username, hoTen, vaiTro, ngayTao };
};

const formatDateTimeVN = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("vi-VN") +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
};

const emptyForm = {
  username: "",
  password: "",
  hoTen: "",
  vaiTro: "User",
};

const StaffManagement = () => {
  // ✅ Role check (KHÔNG return trước hook)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.vaiTro === "Admin";

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search + Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | Admin | User

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [editing, setEditing] = useState(null); // normalized user
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ========= API call with fallback =========
  const apiGetWithFallback = useCallback(async (primary, fallback) => {
    try {
      return await api.get(primary);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 && fallback) return await api.get(fallback);
      throw err;
    }
  }, []);

  const apiPutWithFallback = useCallback(async (primary, fallback, payload) => {
    try {
      return await api.put(primary, payload);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 && fallback) return await api.put(fallback, payload);
      throw err;
    }
  }, []);

  const apiDeleteWithFallback = useCallback(async (primary, fallback) => {
    try {
      return await api.delete(primary);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 && fallback) return await api.delete(fallback);
      throw err;
    }
  }, []);

  const apiPostWithFallback = useCallback(async (primary, fallback, payload) => {
    try {
      return await api.post(primary, payload);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 && fallback) return await api.post(fallback, payload);
      throw err;
    }
  }, []);

  // ========= Fetch list =========
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      // ưu tiên /users, fallback /staff
      const res = await apiGetWithFallback("/users", "/staff");
      const list = Array.isArray(res.data) ? res.data : [];
      setStaff(list.map(normalizeUser));
    } catch (e) {
      console.error(e);
      alert("❌ Không tải được danh sách nhân viên: " + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  }, [apiGetWithFallback]);

  useEffect(() => {
    if (isAdmin) fetchStaff();
  }, [fetchStaff, isAdmin]);

  // ========= Modal handlers =========
  const openAddModal = () => {
    setMode("add");
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (row) => {
    setMode("edit");
    setEditing(row);
    setForm({
      username: row.username || "",
      password: "", // edit: password optional
      hoTen: row.hoTen || "",
      vaiTro: row.vaiTro || "User",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ========= Validate =========
  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = "Username không được trống";
    if (!form.hoTen.trim()) errs.hoTen = "Họ tên không được trống";
    if (!form.vaiTro) errs.vaiTro = "Chọn vai trò";

    if (mode === "add") {
      if (!form.password || form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự";
    } else {
      // edit: nếu nhập mật khẩu mới thì cũng phải >= 6
      if (form.password && form.password.length < 6) errs.password = "Mật khẩu mới tối thiểu 6 ký tự";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ========= Save (add/edit) =========
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (mode === "add") {
        // ✅ đúng với authRoutes.js bạn gửi: POST /auth/create {username,password,hoTen,vaiTro}
        const payload = {
          username: form.username.trim(),
          password: form.password,
          hoTen: form.hoTen.trim(),
          vaiTro: form.vaiTro,
        };

        await apiPostWithFallback("/auth/create", "/users", payload);
        alert("✅ Tạo nhân viên thành công!");
      } else {
        // update (đặt theo pattern phổ biến)
        // payload update: cho phép sửa username/hoTen/vaiTro, password nếu có nhập
        const payload = {
          username: form.username.trim(),
          hoTen: form.hoTen.trim(),
          vaiTro: form.vaiTro,
          ...(form.password ? { password: form.password } : {}),
        };

        const id = editing?.id;
        if (!id) {
          alert("❌ Không xác định được mã nhân viên để cập nhật.");
          return;
        }

        await apiPutWithFallback(`/users/${id}`, `/staff/${id}`, payload);
        alert("✅ Cập nhật nhân viên thành công!");
      }

      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message;
      alert("❌ " + msg);
    } finally {
      setSaving(false);
    }
  };

  // ========= Delete =========
  const handleDelete = async (row) => {
    const id = row?.id;
    if (!id) return alert("❌ Không xác định được mã nhân viên để xóa.");

    if (!window.confirm(`Bạn chắc chắn muốn XÓA nhân viên "${row.hoTen}" (ID: ${id})?`)) return;

    try {
      await apiDeleteWithFallback(`/users/${id}`, `/staff/${id}`);
      alert("✅ Đã xóa nhân viên!");
      fetchStaff();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      alert("❌ " + msg);
    }
  };

  // ========= Filtered list =========
  const filteredStaff = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return staff.filter((s) => {
      if (roleFilter !== "ALL" && String(s.vaiTro) !== roleFilter) return false;
      if (!term) return true;

      return (
        String(s.id).toLowerCase().includes(term) ||
        String(s.username).toLowerCase().includes(term) ||
        String(s.hoTen).toLowerCase().includes(term) ||
        String(s.vaiTro).toLowerCase().includes(term)
      );
    });
  }, [staff, searchTerm, roleFilter]);

  // ========= Guard =========
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>👥 Quản lý nhân viên</h1>
          <p style={styles.subtitle}>
            Tạo tài khoản nhân viên (User) và quản trị (Admin). Chỉ Admin được truy cập trang này.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={styles.select}>
            <option value="ALL">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          <div style={{ position: "relative" }}>
            <input
              style={styles.searchInput}
              placeholder="🔍 Tìm theo mã, họ tên, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                style={styles.clearBtn}
                title="Xóa tìm kiếm"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          <button style={styles.btnPrimary} onClick={openAddModal}>
            + Thêm nhân viên
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ color: "#64748b", fontSize: 14 }}>
          Tổng: <b>{filteredStaff.length}</b> nhân viên
        </div>
        <button style={styles.btnGhost} onClick={fetchStaff} disabled={loading}>
          {loading ? "⏳ Đang tải..." : "↻ Tải lại"}
        </button>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Mã</th>
              <th style={styles.th}>Họ tên</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Vai trò</th>
              <th style={styles.th}>Ngày tạo</th>
              <th style={{ ...styles.th, textAlign: "center", width: 220 }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  ⏳ Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🕵️‍♂️</div>
                  Không tìm thấy nhân viên phù hợp.
                </td>
              </tr>
            ) : (
              filteredStaff.map((s) => (
                <tr key={s.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.codeBadge}>{s.id}</span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#0f172a" }}>{s.hoTen}</td>
                  <td style={styles.td}>{s.username}</td>
                  <td style={styles.td}>
                    <span style={roleBadgeStyle(s.vaiTro)}>{s.vaiTro}</span>
                  </td>
                  <td style={styles.td}>{formatDateTimeVN(s.ngayTao)}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <div style={styles.actionRow}>
                      <button style={styles.btnEdit} onClick={() => openEditModal(s)}>
                        ✏️ Sửa
                      </button>
                      <button style={styles.btnDelete} onClick={() => handleDelete(s)}>
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL ===== */}
      {isModalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {mode === "add" ? "✨ Thêm nhân viên" : "✏️ Cập nhật nhân viên"}
              </h2>
              <button style={styles.closeBtn} onClick={closeModal} disabled={saving}>
                ✕
              </button>
            </div>

            <form style={{ padding: 20 }} onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username</label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="VD: nhanvien01"
                    disabled={saving}
                  />
                  {errors.username && <div style={styles.errorText}>{errors.username}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Vai trò</label>
                  <select
                    name="vaiTro"
                    value={form.vaiTro}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={saving}
                  >
                    <option value="User">User (Nhân viên)</option>
                    <option value="Admin">Admin (Chủ khách sạn)</option>
                  </select>
                  {errors.vaiTro && <div style={styles.errorText}>{errors.vaiTro}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Họ tên</label>
                  <input
                    name="hoTen"
                    value={form.hoTen}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="VD: Nguyễn Văn A"
                    disabled={saving}
                  />
                  {errors.hoTen && <div style={styles.errorText}>{errors.hoTen}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Mật khẩu {mode === "edit" ? <span style={{ color: "#64748b" }}>(bỏ trống nếu không đổi)</span> : null}
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder={mode === "add" ? "Tối thiểu 6 ký tự" : "Nhập để đổi mật khẩu"}
                    disabled={saving}
                  />
                  {errors.password && <div style={styles.errorText}>{errors.password}</div>}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.btnCancel} onClick={closeModal} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" style={styles.btnSave} disabled={saving}>
                  {saving ? "⏳ Đang lưu..." : mode === "add" ? "Tạo nhân viên" : "Cập nhật"}
                </button>
              </div>

              <div style={styles.hintBox}>
                <b>Lưu ý:</b> Trang này dùng endpoint ưu tiên <code>/users</code> (list/update/delete) và{" "}
                <code>/auth/create</code> (create). Nếu backend bạn đang dùng <code>/staff</code> thì file này tự fallback.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Styles =====
const styles = {
  wrapper: { width: "100%", maxWidth: 1400, margin: "0 auto", padding: "2rem 2rem 3rem" },

  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 },
  title: { margin: 0, fontSize: "2rem", fontWeight: 800, color: "#0f172a" },
  subtitle: { marginTop: 6, color: "#64748b" },

  select: {
    padding: "0.6rem 0.9rem",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    outline: "none",
    fontWeight: 600,
    color: "#334155",
  },

  searchInput: {
    width: 280,
    padding: "0.6rem 2.0rem 0.6rem 0.9rem",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
  },
  clearBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#94a3b8",
    fontWeight: 900,
  },

  btnPrimary: {
    padding: "0.6rem 1.2rem",
    borderRadius: 10,
    border: "none",
    background: "#3A7DFF",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 10px 18px rgba(58,125,255,0.25)",
    whiteSpace: "nowrap",
  },

  btnGhost: {
    padding: "0.55rem 0.95rem",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
    color: "#334155",
  },

  tableCard: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
    border: "1px solid #eef2ff",
    overflowX: "auto",
  },

  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    padding: "14px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    color: "#475569",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontSize: 12,
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px 16px", color: "#334155", verticalAlign: "middle" },

  codeBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 900,
    fontFamily: "monospace",
    fontSize: 13,
  },

  actionRow: { display: "flex", gap: 10, justifyContent: "center" },

  btnEdit: {
    padding: "7px 12px",
    borderRadius: 10,
    border: "1px solid #bae6fd",
    background: "#e0f2fe",
    color: "#0284c7",
    cursor: "pointer",
    fontWeight: 800,
  },

  btnDelete: {
    padding: "7px 12px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fee2e2",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: 800,
  },

  // Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: 14,
    backdropFilter: "blur(2px)",
  },
  modal: {
    width: "100%",
    maxWidth: 720,
    background: "white",
    borderRadius: 16,
    boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 900, color: "#0f172a" },
  closeBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    color: "#64748b",
    fontWeight: 900,
  },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 800, color: "#334155" },
  input: {
    padding: "0.7rem 0.85rem",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
  },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: 700 },

  modalActions: { marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 10 },
  btnCancel: {
    padding: "0.7rem 1.1rem",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    fontWeight: 900,
    color: "#334155",
  },
  btnSave: {
    padding: "0.7rem 1.1rem",
    borderRadius: 10,
    border: "none",
    background: "#3A7DFF",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 18px rgba(58,125,255,0.25)",
  },

  hintBox: {
    marginTop: 14,
    padding: 12,
    background: "#f1f5f9",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.5,
  },
};

const roleBadgeStyle = (role) => {
  const isAdmin = role === "Admin";
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    background: isAdmin ? "#ede9fe" : "#dcfce7",
    color: isAdmin ? "#6d28d9" : "#15803d",
    border: isAdmin ? "1px solid #ddd6fe" : "1px solid #bbf7d0",
  };
};

export default StaffManagement;