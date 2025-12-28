//frontend/src/pages/CustomerManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";

const CustomerManagement = () => {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const isAdmin = user?.vaiTro === "Admin";

  const [customers, setCustomers] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cusRes, typeRes] = await Promise.all([
        api.get("/khachhang"),
        api.get("/loaikhach"),
      ]);
      setCustomers(cusRes.data || []);
      setCustomerTypes(typeRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- XÓA: chỉ Admin ---
  const handleDelete = async (customer) => {
    if (!isAdmin) return; // chặn an toàn

    const confirmMsg = `Bạn có chắc chắn muốn xóa khách hàng: ${customer.HoTen}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      await api.delete(`/khachhang/${customer.MaKH}`);
      alert("✅ Đã xóa khách hàng thành công!");
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể xóa khách hàng này.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- SỬA: chỉ Admin ---
  const openEditModal = (cus) => {
    if (!isAdmin) return; // chặn an toàn

    setEditingCustomer(cus);
    setForm({
      HoTen: cus.HoTen,
      CMND: cus.CMND,
      SDT: cus.SDT,
      DiaChi: cus.DiaChi,
      MaLoaiKhach: cus.MaLoaiKhach,
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!isAdmin) return; // chặn an toàn
    if (!form.HoTen || !form.CMND) return alert("Vui lòng điền đủ tên và CMND");

    try {
      await api.put(`/khachhang/${editingCustomer.MaKH}`, form);
      alert("✅ Cập nhật thành công!");
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // --- FILTER ---
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.HoTen || "").toLowerCase().includes(term) ||
      (c.CMND || "").toLowerCase().includes(term) ||
      (c.SDT && c.SDT.includes(term))
    );
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>👥 Quản lý Khách Hàng</h1>
          <p style={styles.subtitle}>Danh sách khách hàng đã từng lưu trú tại khách sạn</p>
        </div>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="🔍 Tìm tên, CMND, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={styles.clearSearchBtn}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={styles.tableCard}>
        {loading ? (
          <p style={{ padding: "20px", textAlign: "center" }}>⏳ Đang tải...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Họ Tên</th>
                <th style={styles.th}>Loại Khách</th>
                <th style={styles.th}>CMND/CCCD</th>
                <th style={styles.th}>Liên hệ</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Trạng thái</th>

                {/* ✅ chỉ Admin mới thấy cột thao tác */}
                {isAdmin && <th style={{ ...styles.th, textAlign: "center" }}>Thao tác</th>}
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    style={{ padding: "30px", textAlign: "center", color: "#64748b" }}
                  >
                    Không tìm thấy khách hàng.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cus, idx) => (
                  <tr
                    key={cus.MaKH}
                    style={{ ...styles.tr, background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}
                  >
                    <td style={{ ...styles.td, fontWeight: "bold", color: "#334155" }}>{cus.HoTen}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: cus.MaLoaiKhach === "NN" ? "#dbeafe" : "#f1f5f9",
                          color: cus.MaLoaiKhach === "NN" ? "#1d4ed8" : "#475569",
                        }}
                      >
                        {cus.TenLoaiKhach || cus.MaLoaiKhach}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.codeBadge}>{cus.CMND}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: "13px" }}>📞 {cus.SDT || "---"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>📍 {cus.DiaChi || "---"}</div>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      {cus.DangThueCount > 0 ? (
                        <span style={styles.activeBadge}>🟢 Đang ở ({cus.DangThueCount})</span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Lịch sử cũ</span>
                      )}
                    </td>

                    {/* ✅ chỉ Admin mới render nút */}
                    {isAdmin && (
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                          <button style={styles.btnEdit} onClick={() => openEditModal(cus)}>
                            ✏️ Sửa
                          </button>
                          <button style={styles.btnDelete} onClick={() => handleDelete(cus)}>
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Modal chỉ Admin mới được mở (đã chặn ở openEditModal, nhưng thêm lớp bảo vệ) */}
      {isAdmin && isModalOpen && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>✏️ Cập nhật thông tin khách</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Họ tên</label>
                <input
                  style={styles.input}
                  value={form.HoTen || ""}
                  onChange={(e) => setForm({ ...form, HoTen: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>CMND/CCCD</label>
                  <input
                    style={styles.input}
                    value={form.CMND || ""}
                    onChange={(e) => setForm({ ...form, CMND: e.target.value })}
                  />
                </div>

                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Loại khách</label>
                  <select
                    style={styles.select}
                    value={form.MaLoaiKhach || ""}
                    onChange={(e) => setForm({ ...form, MaLoaiKhach: e.target.value })}
                  >
                    {customerTypes.map((t) => (
                      <option key={t.MaLoaiKhach} value={t.MaLoaiKhach}>
                        {t.TenLoaiKhach}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Số điện thoại</label>
                <input
                  style={styles.input}
                  value={form.SDT || ""}
                  onChange={(e) => setForm({ ...form, SDT: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Địa chỉ</label>
                <input
                  style={styles.input}
                  value={form.DiaChi || ""}
                  onChange={(e) => setForm({ ...form, DiaChi: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                Hủy
              </button>
              <button style={styles.saveBtn} onClick={handleUpdate}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "2rem" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#1F2A40", marginBottom: "0.5rem" },
  subtitle: { color: "#64748b", fontSize: "0.95rem" },
  searchInput: { padding: "0.7rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.95rem", width: "280px", outline: "none" },
  clearSearchBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold' },
  tableCard: { background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflowX: "auto", border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" },
  th: { padding: "16px 24px", backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontWeight: 600, color: "#475569", textAlign: "left", textTransform: "uppercase", fontSize: "0.8rem" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: 'background 0.2s' },
  td: { padding: "16px 24px", verticalAlign: "middle" },
  codeBadge: { fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b', fontSize: '0.85rem' },
  activeBadge: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  
  btnEdit: { background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 700 },
  btnDelete: { background: "#fee2e2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 700 },

  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 },
  modal: { width: "100%", maxWidth: "500px", background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" },
  modalTitle: { margin: '0 0 20px 0', fontSize: '1.5rem', color: '#1e293b' },
  formGroup: { marginBottom: '10px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px', color: '#334155' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  cancelBtn: { padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  saveBtn: { padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'white' }
};

export default CustomerManagement;