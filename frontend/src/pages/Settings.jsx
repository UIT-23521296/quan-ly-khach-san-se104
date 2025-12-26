// frontend/src/pages/Settings.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import { Navigate } from "react-router-dom";

const Settings = () => {
  // ✅ Role check (KHÔNG return trước hook)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.vaiTro; // Admin | Manage | User
  const isAdmin = role === "Admin";
  const canView = isAdmin || role === "Manage" || role === "User"; // ai cũng xem Quy định

  const [activeTab, setActiveTab] = useState("loaiphong");

  const [loaiPhongs, setLoaiPhongs] = useState([]);
  const [loaiKhachs, setLoaiKhachs] = useState([]);
  const [phuThus, setPhuThus] = useState([]);
  const [thamSo, setThamSo] = useState({
    SoKhachToiDa: 0,
    SoKhachKhongTinhPhuThu: 0,
  });

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});

  // ✅ Đóng modal + reset khi đổi tab
  useEffect(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({});
  }, [activeTab]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    // để dùng dấu phẩy (,) đúng logic replace(/,/g,'')
    return n.toLocaleString("en-US");
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "loaiphong") {
        const res = await api.get("/quidinh/loaiphong");
        setLoaiPhongs(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === "loaikhach") {
        const res = await api.get("/quidinh/loaikhach");
        setLoaiKhachs(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === "phuthu") {
        const res = await api.get("/quidinh/phuthu");
        setPhuThus(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === "thamso") {
        const res = await api.get("/quidinh/thamso");
        setThamSo({
          SoKhachToiDa: Number(res.data?.SoKhachToiDa ?? 0),
          SoKhachKhongTinhPhuThu: Number(res.data?.SoKhachKhongTinhPhuThu ?? 0),
        });
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi tải dữ liệu: " + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (canView) fetchData();
  }, [fetchData, canView]);

  // ===== Quyền sửa =====
  const canEdit = isAdmin; // ✅ Manage/User chỉ xem

  // (Optional) chặn gọi nhầm CRUD nếu không phải admin
  const forbidIfNoEdit = () => {
    if (canEdit) return false;
    alert("⚠️ Bạn chỉ có quyền XEM Quy định, không được thay đổi.");
    return true;
  };

  const handleDelete = async (id, type) => {
    if (forbidIfNoEdit()) return;
    if (!window.confirm("⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN mục này?")) return;
    try {
      await api.delete(`/quidinh/${type}/${id}`);
      alert("✅ Đã xóa thành công!");
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      alert("❌ " + msg);
    }
  };

  const handleSave = async () => {
    if (forbidIfNoEdit()) return;

    try {
      if (activeTab === "loaiphong") {
        const rawPrice = form.DonGia ? String(form.DonGia).replace(/,/g, "") : "0";
        const payload = {
          maLoai: (form.MaLoaiPhong || "").trim(),
          tenLoai: (form.TenLoaiPhong || "").trim(),
          donGia: Number(rawPrice),
        };

        if (!payload.maLoai || !payload.tenLoai) {
          alert("❌ Vui lòng nhập đầy đủ Mã loại và Tên loại phòng.");
          return;
        }

        if (editingItem) {
          await api.put(`/quidinh/loaiphong/${editingItem.MaLoaiPhong}`, payload);
        } else {
          await api.post(`/quidinh/loaiphong`, payload);
        }
      } else if (activeTab === "loaikhach") {
        const payload = {
          maLoai: (form.MaLoaiKhach || "").trim(),
          tenLoai: (form.TenLoaiKhach || "").trim(),
          heSo: Number(form.HeSoPhuThu),
        };

        if (!payload.maLoai || !payload.tenLoai) {
          alert("❌ Vui lòng nhập đầy đủ Mã loại và Tên loại khách.");
          return;
        }
        if (Number.isNaN(payload.heSo)) {
          alert("❌ Hệ số phụ thu không hợp lệ.");
          return;
        }

        if (editingItem) {
          await api.put(`/quidinh/loaikhach/${editingItem.MaLoaiKhach}`, payload);
        } else {
          await api.post(`/quidinh/loaikhach`, payload);
        }
      } else if (activeTab === "phuthu") {
        const payload = {
          khachThu: Number(form.KhachThu),
          tiLe: Number(form.TiLePhuThu),
        };

        if (!Number.isInteger(payload.khachThu) || payload.khachThu <= 0) {
          alert("❌ 'Khách dư thứ' phải là số nguyên dương.");
          return;
        }
        if (Number.isNaN(payload.tiLe) || payload.tiLe < 0) {
          alert("❌ 'Tỉ lệ phụ thu' không hợp lệ.");
          return;
        }

        if (editingItem) {
          await api.put(`/quidinh/phuthu/${editingItem.KhachThu}`, payload);
        } else {
          await api.post(`/quidinh/phuthu`, payload);
        }
      }

      alert("✅ Lưu dữ liệu thành công!");
      setIsModalOpen(false);
      setEditingItem(null);
      setForm({});
      fetchData();
    } catch (err) {
      alert("❌ Lỗi: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleSaveThamSo = async () => {
    if (forbidIfNoEdit()) return;

    try {
      const payload = {
        SoKhachToiDa: Number(thamSo.SoKhachToiDa),
        SoKhachKhongTinhPhuThu: Number(thamSo.SoKhachKhongTinhPhuThu),
      };

      if (Number.isNaN(payload.SoKhachToiDa) || payload.SoKhachToiDa <= 0) {
        alert("❌ Số khách tối đa phải là số > 0.");
        return;
      }
      if (Number.isNaN(payload.SoKhachKhongTinhPhuThu) || payload.SoKhachKhongTinhPhuThu < 0) {
        alert("❌ Số khách tiêu chuẩn không hợp lệ.");
        return;
      }
      if (payload.SoKhachKhongTinhPhuThu > payload.SoKhachToiDa) {
        alert("❌ Số khách tiêu chuẩn không được lớn hơn số khách tối đa.");
        return;
      }

      await api.put(`/quidinh/thamso`, payload);
      alert("✅ Đã cập nhật tham số hệ thống!");
      fetchData();
    } catch (err) {
      alert("❌ Lỗi cập nhật tham số: " + (err?.response?.data?.message || err.message));
    }
  };

  const openModal = (item) => {
    if (!canEdit) {
      alert("⚠️ Bạn chỉ có quyền XEM Quy định, không được thay đổi.");
      return;
    }

    setEditingItem(item);

    if (item) {
      setForm({ ...item });
    } else {
      if (activeTab === "loaiphong") setForm({ MaLoaiPhong: "", TenLoaiPhong: "", DonGia: "" });
      if (activeTab === "loaikhach") setForm({ MaLoaiKhach: "", TenLoaiKhach: "", HeSoPhuThu: 1.0 });
      if (activeTab === "phuthu") setForm({ KhachThu: "", TiLePhuThu: 0.25 });
    }

    setIsModalOpen(true);
  };

  const renderActions = (item, id, type) => {
    if (!canEdit) return <span style={{ color: "#94a3b8" }}>Chỉ xem</span>;

    return (
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button style={styles.btnEdit} onClick={() => openModal(item)} title="Sửa thông tin">
          ✏️ Sửa
        </button>
        <button style={styles.btnDelete} onClick={() => handleDelete(id, type)} title="Xóa mục này">
          🗑️ Xóa
        </button>
      </div>
    );
  };

  const readOnlyBanner = useMemo(() => {
    if (canEdit) return null;
    return (
      <div style={styles.readOnlyBanner}>
        👀 Bạn đang ở chế độ <b>Chỉ xem</b>. Chỉ <b>Admin</b> mới được thay đổi các quy định.
      </div>
    );
  }, [canEdit]);

  // ✅ Redirect nếu chưa đăng nhập/không có role hợp lệ
  if (!canView) return <Navigate to="/" replace />;

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>⚙️ Cấu hình quy định</h1>
          <p style={styles.subtitle}>Quản lý danh mục phòng, khách và tham số hệ thống.</p>
        </div>
      </div>

      {readOnlyBanner}

      <div style={styles.tabContainer}>
        {["loaiphong", "loaikhach", "phuthu", "thamso"].map((tab) => (
          <button
            key={tab}
            style={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "loaiphong" && "🏨 Loại Phòng"}
            {tab === "loaikhach" && "👥 Loại Khách"}
            {tab === "phuthu" && "💰 Phụ Thu"}
            {tab === "thamso" && "🛠️ Tham Số"}
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign: "center", color: "#64748b" }}>⏳ Đang tải...</p>}

      <div style={styles.content}>
        {/* --- LOẠI PHÒNG --- */}
        {activeTab === "loaiphong" && (
          <div>
            {canEdit && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                <button style={styles.btnAdd} onClick={() => openModal(null)}>
                  + Thêm Loại Phòng
                </button>
              </div>
            )}

            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Mã Loại</th>
                    <th style={styles.th}>Tên Loại Phòng</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Đơn Giá</th>
                    <th style={{ ...styles.th, textAlign: "center", width: "180px" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loaiPhongs.map((item, idx) => (
                    <tr
                      key={item.MaLoaiPhong}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <td style={styles.td}>
                        <span style={styles.codeBadge}>{item.MaLoaiPhong}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "600" }}>{item.TenLoaiPhong}</td>
                      <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold", color: "#2563eb" }}>
                        {formatCurrency(item.DonGia)}{" "}
                        <span style={{ fontSize: "0.8em", color: "#64748b" }}>VND</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {renderActions(item, item.MaLoaiPhong, "loaiphong")}
                      </td>
                    </tr>
                  ))}
                  {loaiPhongs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                        Chưa có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- LOẠI KHÁCH --- */}
        {activeTab === "loaikhach" && (
          <div>
            {canEdit && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                <button style={styles.btnAdd} onClick={() => openModal(null)}>
                  + Thêm Loại Khách
                </button>
              </div>
            )}

            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Mã Loại</th>
                    <th style={styles.th}>Tên Loại Khách</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Hệ Số Phụ Thu</th>
                    <th style={{ ...styles.th, textAlign: "center", width: "180px" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loaiKhachs.map((item, idx) => (
                    <tr
                      key={item.MaLoaiKhach}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <td style={styles.td}>
                        <span style={styles.codeBadge}>{item.MaLoaiKhach}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "600" }}>{item.TenLoaiKhach}</td>
                      <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}>x {item.HeSoPhuThu}</td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {renderActions(item, item.MaLoaiKhach, "loaikhach")}
                      </td>
                    </tr>
                  ))}
                  {loaiKhachs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                        Chưa có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PHỤ THU --- */}
        {activeTab === "phuthu" && (
          <div>
            {canEdit && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                <button style={styles.btnAdd} onClick={() => openModal(null)}>
                  + Thêm Mốc Phụ Thu
                </button>
              </div>
            )}

            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Khách Dư Thứ...</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Tỉ Lệ Phụ Thu</th>
                    <th style={{ ...styles.th, textAlign: "center", width: "180px" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {phuThus.map((item, idx) => (
                    <tr
                      key={item.KhachThu}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <td style={styles.td}>
                        <strong>Khách thứ {item.KhachThu}</strong>
                      </td>
                      <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold", color: "#d97706" }}>
                        {Number(item.TiLePhuThu || 0) * 100}%
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {renderActions(item, item.KhachThu, "phuthu")}
                      </td>
                    </tr>
                  ))}
                  {phuThus.length === 0 && !loading && (
                    <tr>
                      <td colSpan={3} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                        Chưa có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- THAM SỐ --- */}
        {activeTab === "thamso" && (
          <div style={styles.card}>
            <div style={{ padding: "40px", maxWidth: "650px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "10px", color: "#1e293b" }}>Quy định chung</h3>
                <p style={{ color: "#64748b" }}>Cấu hình các tham số cốt lõi cho việc thuê phòng</p>
              </div>

              <div style={styles.paramItem}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Số khách tối đa trong 1 phòng</label>
                  <p style={styles.desc}>Giới hạn số người (bao gồm cả trẻ em) được phép ở.</p>
                </div>
                <input
                  type="number"
                  style={styles.inputLarge}
                  value={thamSo.SoKhachToiDa}
                  onChange={(e) => setThamSo({ ...thamSo, SoKhachToiDa: Number(e.target.value) })}
                  disabled={!canEdit}
                />
              </div>

              <div style={styles.paramItem}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Số khách tiêu chuẩn</label>
                  <p style={styles.desc}>Số lượng khách tối đa không bị tính phụ thu.</p>
                </div>
                <input
                  type="number"
                  style={styles.inputLarge}
                  value={thamSo.SoKhachKhongTinhPhuThu}
                  onChange={(e) =>
                    setThamSo({ ...thamSo, SoKhachKhongTinhPhuThu: Number(e.target.value) })
                  }
                  disabled={!canEdit}
                />
              </div>

              {canEdit && (
                <div
                  style={{
                    textAlign: "right",
                    marginTop: "40px",
                    paddingTop: "20px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <button style={styles.btnSave} onClick={handleSaveThamSo}>
                    💾 Lưu Thay Đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL (Admin-only) */}
      {canEdit && isModalOpen && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
                {editingItem ? "✏️ Cập nhật thông tin" : "✨ Thêm mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {activeTab === "loaiphong" && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mã Loại (A, B, C...):</label>
                    <input
                      style={styles.inputModal}
                      disabled={!!editingItem}
                      value={form.MaLoaiPhong || ""}
                      onChange={(e) => setForm({ ...form, MaLoaiPhong: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tên Loại:</label>
                    <input
                      style={styles.inputModal}
                      value={form.TenLoaiPhong || ""}
                      onChange={(e) => setForm({ ...form, TenLoaiPhong: e.target.value })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Đơn Giá (VND):</label>
                    <input
                      type="text"
                      style={styles.inputModal}
                      value={formatCurrency(form.DonGia)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (raw === "" || !Number.isNaN(Number(raw))) setForm({ ...form, DonGia: raw });
                      }}
                    />
                  </div>
                </>
              )}

              {activeTab === "loaikhach" && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mã Loại (NN, ND...):</label>
                    <input
                      style={styles.inputModal}
                      disabled={!!editingItem}
                      value={form.MaLoaiKhach || ""}
                      onChange={(e) => setForm({ ...form, MaLoaiKhach: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tên Loại:</label>
                    <input
                      style={styles.inputModal}
                      value={form.TenLoaiKhach || ""}
                      onChange={(e) => setForm({ ...form, TenLoaiKhach: e.target.value })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Hệ số phụ thu:</label>
                    <input
                      type="number"
                      step="0.1"
                      style={styles.inputModal}
                      value={form.HeSoPhuThu ?? ""}
                      onChange={(e) => setForm({ ...form, HeSoPhuThu: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {activeTab === "phuthu" && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Khách dư thứ:</label>
                    <input
                      type="number"
                      style={styles.inputModal}
                      disabled={!!editingItem}
                      value={form.KhachThu ?? ""}
                      onChange={(e) => setForm({ ...form, KhachThu: Number(e.target.value) })}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tỉ lệ (VD: 0.25 = 25%):</label>
                    <input
                      type="number"
                      step="0.01"
                      style={styles.inputModal}
                      value={form.TiLePhuThu ?? ""}
                      onChange={(e) => setForm({ ...form, TiLePhuThu: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              <div
                style={{
                  textAlign: "right",
                  marginTop: 30,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button style={styles.btnCancel} onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button style={styles.btnSaveModal} onClick={handleSave}>
                  Lưu thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const styles = {
  wrapper: { width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "2rem" },
  headerRow: { marginBottom: "2rem" },
  title: { fontSize: "2rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.5rem" },
  subtitle: { color: "#64748b", fontSize: "1rem" },

  readOnlyBanner: {
    marginBottom: 14,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 600,
  },

  content: { marginTop: "10px" },

  tabContainer: { display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "25px", gap: "20px" },
  tab: {
    padding: "12px 10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#64748b",
    fontWeight: "600",
    transition: "0.2s",
    borderBottom: "3px solid transparent",
  },
  tabActive: {
    padding: "12px 10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#3b82f6",
    fontWeight: "bold",
    borderBottom: "3px solid #3b82f6",
  },

  card: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },

  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" },
  tableHeader: { backgroundColor: "#f8fafc", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.5px" },
  th: { padding: "16px 24px", fontWeight: 600, color: "#475569", textAlign: "left", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "16px 24px", verticalAlign: "middle", color: "#334155" },

  codeBadge: {
    fontFamily: "monospace",
    background: "#e2e8f0",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#475569",
  },

  btnAdd: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.95rem",
    boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  btnEdit: {
    background: "#e0f2fe",
    color: "#0284c7",
    border: "1px solid #bae6fd",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 700,
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  btnDelete: {
    background: "#fee2e2",
    color: "#ef4444",
    border: "1px solid #fecaca",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 700,
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  paramItem: { display: "flex", alignItems: "center", gap: "20px", padding: "20px 0", borderBottom: "1px dashed #e2e8f0" },
  desc: { fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 0 0" },
  inputLarge: {
    width: "80px",
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "1.2rem",
    textAlign: "center",
    outline: "none",
    color: "#334155",
    fontWeight: "bold",
  },
  btnSave: {
    padding: "12px 30px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(37, 99, 235, 0.3)",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    backdropFilter: "blur(2px)",
  },
  modal: { width: "100%", maxWidth: "500px", background: "white", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden" },
  modalHeader: { padding: "20px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" },

  formGroup: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "600", color: "#334155" },
  inputModal: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box", fontSize: "1rem", transition: "border 0.2s" },

  btnSaveModal: { padding: "10px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer" },
  btnCancel: { padding: "10px 24px", background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" },
};

export default Settings;
