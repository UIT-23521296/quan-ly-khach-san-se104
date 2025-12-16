import React, { useEffect, useState } from "react";
import api from "../services/api";

/* =====================
   STATE MẪU
===================== */
const emptyForm = {
  MaPhong: "",
  NgayBatDauThue: "",
  NgayDuKienTra: "",
};

const emptyKhach = {
  HoTen: "",
  MaLoaiKhach: "",
  CMND: "",
  DiaChi: "",
  SDT: "",
};

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guestTypes, setGuestTypes] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [khachList, setKhachList] = useState([{ ...emptyKhach }]);
  const [soKhachToiDa, setSoKhachToiDa] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =====================
     LOAD DATA
  ===================== */
  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchGuestTypes();
    fetchSoKhachMax();
  }, []);

  const fetchBookings = async () => {
    const res = await api.get("/phieuthue");
    setBookings(res.data);
  };

  const fetchRooms = async () => {
    const res = await api.get("/phong");
    setRooms(res.data.filter((r) => r.TinhTrang === "Trống"));
  };

  const fetchGuestTypes = async () => {
    const res = await api.get("/loaikhach");
    setGuestTypes(res.data);
  };

  const fetchSoKhachMax = async () => {
    const res = await api.get("/thamso/sokhachMax");
    setSoKhachToiDa(res.data.soKhachToiDa);
  };

  /* =====================
     HANDLER
  ===================== */
  const openModal = () => {
    setForm(emptyForm);
    setKhachList([{ ...emptyKhach }]);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleKhachChange = (index, field, value) => {
    const newList = [...khachList];
    newList[index][field] = value;
    setKhachList(newList);
  };

  const addKhach = () => {
    if (khachList.length >= soKhachToiDa) return;
    setKhachList([...khachList, { ...emptyKhach }]);
  };

  const removeKhach = (index) => {
    if (khachList.length === 1) return;
    setKhachList(khachList.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (khachList.length > soKhachToiDa) {
      alert("❌ Vượt quá số khách tối đa");
      return;
    }

    setLoading(true);
    try {
      await api.post("/phieuthue", {
        ...form,
        danhSachKhach: khachList,
      });
      alert("✅ Lập phiếu thuê thành công");
      closeModal();
      fetchBookings();
      fetchRooms();
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Lỗi tạo phiếu"));
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     FORMAT DATE
  ===================== */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTrangThai = (booking) => {
    // Nếu có trạng thái từ API thì dùng, không thì tự tính
    if (booking.TrangThai) {
      return booking.TrangThai;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ngayBatDau = new Date(booking.NgayBatDauThue);
    ngayBatDau.setHours(0, 0, 0, 0);

    const ngayTra = new Date(booking.NgayDuKienTra);
    ngayTra.setHours(0, 0, 0, 0);

    if (today < ngayBatDau) {
      return "CHUA_CHECKIN";
    } else if (today >= ngayBatDau && today <= ngayTra) {
      return "DANG_THUE";
    } else {
      return "DA_TRA";
    }
  };

  const renderTrangThai = (trangThai) => {
    const statusMap = {
      CHUA_CHECKIN: { icon: "🟡", text: "Chưa check-in", color: "#f59e0b" },
      DANG_THUE: { icon: "🟢", text: "Đang thuê", color: "#10b981" },
      DA_TRA: { icon: "🔵", text: "Đã trả phòng", color: "#3b82f6" },
      DA_THANH_TOAN: { icon: "✅", text: "Đã thanh toán", color: "#8b5cf6" },
      DA_HUY: { icon: "🔴", text: "Đã hủy", color: "#ef4444" },
    };

    const status = statusMap[trangThai] || statusMap.DANG_THUE;

    return (
      <span
        style={{
          ...styles.statusBadge,
          background: `${status.color}20`,
          color: status.color,
          border: `1px solid ${status.color}40`,
        }}
      >
        {status.icon} {status.text}
      </span>
    );
  };

  /* =====================
     ACTIONS HANDLER
  ===================== */
  const handleViewDetail = (booking) => {
    alert(`Xem chi tiết phiếu: ${booking.SoPhieu}`);
    // TODO: Mở modal hiển thị chi tiết
  };

  const handleEdit = (booking) => {
    const trangThai = getTrangThai(booking);
    if (trangThai === "DA_THANH_TOAN") {
      alert("❌ Không thể sửa phiếu đã thanh toán");
      return;
    }
    alert(`Sửa phiếu: ${booking.SoPhieu}`);
    // TODO: Mở modal chỉnh sửa
  };

  const handleDelete = async (booking) => {
    const trangThai = getTrangThai(booking);
    if (trangThai === "DA_THANH_TOAN") {
      alert("❌ Không thể xóa phiếu đã thanh toán");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa phiếu ${booking.SoPhieu}?`)) {
      return;
    }

    try {
      await api.delete(`/phieuthue/${booking.SoPhieu}`);
      alert("✅ Xóa phiếu thành công");
      fetchBookings();
      fetchRooms();
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Lỗi xóa phiếu"));
    }
  };

  const handleCancel = async (booking) => {
    const trangThai = getTrangThai(booking);
    if (trangThai === "DA_THANH_TOAN") {
      alert("❌ Không thể hủy phiếu đã thanh toán");
      return;
    }

    if (trangThai === "DA_HUY") {
      alert("ℹ️ Phiếu này đã được hủy trước đó");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc muốn HỦY phiếu ${booking.SoPhieu}?\n\nPhiếu sẽ không bị xóa nhưng sẽ đánh dấu là "Đã hủy" để lưu lịch sử.`
      )
    ) {
      return;
    }

    try {
      await api.put(`/phieuthue/${booking.SoPhieu}/huy`);
      alert("✅ Hủy phiếu thành công");
      fetchBookings();
      fetchRooms();
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Lỗi hủy phiếu"));
    }
  };

  const handlePayment = (booking) => {
    const trangThai = getTrangThai(booking);
    if (trangThai === "DA_THANH_TOAN") {
      alert("✅ Phiếu này đã được thanh toán");
      return;
    }
    alert(`Thanh toán phiếu: ${booking.SoPhieu}`);
    // TODO: Chuyển đến trang thanh toán/tạo hóa đơn
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📋 Quản lý phiếu thuê phòng</h1>
            <p style={styles.subtitle}>
              Quản lý và theo dõi các phiếu thuê phòng khách sạn
            </p>
          </div>
          <button style={styles.addBtn} onClick={openModal}>
            <span style={styles.btnIcon}>+</span>
            <span>Tạo phiếu thuê mới</span>
          </button>
        </div>

        {/* TABLE */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Số phiếu</th>
                <th style={styles.th}>Phòng</th>
                <th style={styles.th}>Khách hàng</th>
                <th style={styles.th}>Ngày thuê</th>
                <th style={styles.th}>Ngày trả dự kiến</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(
                bookings.reduce((acc, b) => {
                  if (!acc[b.SoPhieu]) {
                    acc[b.SoPhieu] = { ...b, khachList: [b.HoTen] };
                  } else {
                    acc[b.SoPhieu].khachList.push(b.HoTen);
                  }
                  return acc;
                }, {})
              ).map((b, idx) => {
                const trangThai = getTrangThai(b);
                const isDisabled = trangThai === "DA_THANH_TOAN";

                return (
                  <tr
                    key={b.SoPhieu}
                    style={{
                      ...styles.tableRow,
                      background: idx % 2 === 0 ? "#f8fafc" : "#ffffff",
                    }}
                  >
                    <td style={styles.td}>
                      <span style={styles.badge}>{b.SoPhieu}</span>
                    </td>
                    <td style={styles.td}>
                      <strong style={styles.roomName}>{b.TenPhong}</strong>
                    </td>
                    <td style={styles.td}>
                      <div>
                        {b.khachList.map((khach, i) => (
                          <div key={i} style={{ marginBottom: 4 }}>
                            {khach}
                          </div>
                        ))}
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 600,
                            marginTop: 4,
                            display: "block",
                          }}
                        >
                          ({b.khachList.length} khách)
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>
                        {formatDate(b.NgayBatDauThue)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>
                        {formatDate(b.NgayDuKienTra)}
                      </span>
                    </td>
                    <td style={styles.td}>{renderTrangThai(trangThai)}</td>
                    <td style={styles.tdActions}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleViewDetail(b)}
                          title="Xem chi tiết"
                        >
                          👁️
                        </button>
                        <button
                          style={{
                            ...styles.actionBtn,
                            ...(isDisabled ? styles.actionBtnDisabled : {}),
                          }}
                          onClick={() => handleEdit(b)}
                          disabled={isDisabled}
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          style={{
                            ...styles.actionBtn,
                            background: "#fee2e2",
                            ...(isDisabled ? styles.actionBtnDisabled : {}),
                          }}
                          onClick={() => handleCancel(b)}
                          disabled={isDisabled}
                          title="Hủy phiếu"
                        >
                          ❌
                        </button>
                        <button
                          style={{
                            ...styles.actionBtn,
                            background: "#fef3c7",
                            ...(isDisabled ? styles.actionBtnDisabled : {}),
                          }}
                          onClick={() => handleDelete(b)}
                          disabled={isDisabled}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                        <button
                          style={{
                            ...styles.actionBtn,
                            background:
                              trangThai === "DA_THANH_TOAN"
                                ? "#e0e7ff"
                                : "#dcfce7",
                          }}
                          onClick={() => handlePayment(b)}
                          title="Thanh toán"
                        >
                          💰
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {isModalOpen && (
          <div style={styles.overlay} onClick={closeModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>✨ Tạo phiếu thuê phòng mới</h2>
                <button style={styles.closeBtn} onClick={closeModal}>
                  ✕
                </button>
              </div>

              <div style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phòng</label>
                  <select
                    name="MaPhong"
                    onChange={handleFormChange}
                    style={styles.select}
                  >
                    <option value="">-- Chọn phòng trống --</option>
                    {rooms.map((r) => (
                      <option key={r.MaPhong} value={r.MaPhong}>
                        🚪 {r.TenPhong}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.dateGroup}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Ngày bắt đầu thuê</label>
                    <input
                      type="date"
                      name="NgayBatDauThue"
                      onChange={handleFormChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Ngày trả dự kiến</label>
                    <input
                      type="date"
                      name="NgayDuKienTra"
                      onChange={handleFormChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.guestSection}>
                  <div style={styles.guestHeader}>
                    <h4 style={styles.guestTitle}>👥 Danh sách khách</h4>
                    <span style={styles.guestLimit}>
                      {khachList.length} / {soKhachToiDa} khách
                    </span>
                  </div>

                  {khachList.map((k, index) => (
                    <div key={index} style={styles.khachBox}>
                      <div style={styles.khachHeader}>
                        <span style={styles.khachNumber}>
                          Khách #{index + 1}
                        </span>
                        {khachList.length > 1 && (
                          <button
                            style={styles.removeBtn}
                            onClick={() => removeKhach(index)}
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </div>

                      <div style={styles.khachGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.labelSmall}>Họ tên *</label>
                          <input
                            placeholder="Nhập họ tên"
                            value={k.HoTen}
                            onChange={(e) =>
                              handleKhachChange(index, "HoTen", e.target.value)
                            }
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.labelSmall}>Loại khách *</label>
                          <select
                            value={k.MaLoaiKhach}
                            onChange={(e) =>
                              handleKhachChange(
                                index,
                                "MaLoaiKhach",
                                e.target.value
                              )
                            }
                            style={styles.select}
                          >
                            <option value="">-- Chọn loại --</option>
                            {guestTypes.map((g) => (
                              <option key={g.MaLoaiKhach} value={g.MaLoaiKhach}>
                                {g.TenLoaiKhach}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.labelSmall}>CCCD/CMND *</label>
                          <input
                            placeholder="Số CCCD"
                            value={k.CMND}
                            onChange={(e) =>
                              handleKhachChange(index, "CMND", e.target.value)
                            }
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.labelSmall}>Địa chỉ</label>
                          <input
                            placeholder="Địa chỉ liên hệ"
                            value={k.DiaChi}
                            onChange={(e) =>
                              handleKhachChange(index, "DiaChi", e.target.value)
                            }
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.labelSmall}>Số điện thoại</label>
                          <input
                            placeholder="Số điện thoại"
                            value={k.SDT}
                            onChange={(e) =>
                              handleKhachChange(index, "SDT", e.target.value)
                            }
                            style={styles.input}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addKhach}
                    disabled={khachList.length >= soKhachToiDa}
                    style={{
                      ...styles.addGuestBtn,
                      ...(khachList.length >= soKhachToiDa
                        ? styles.addGuestBtnDisabled
                        : {}),
                    }}
                  >
                    ➕ Thêm khách hàng
                  </button>
                </div>
              </div>

              <div style={styles.actions}>
                <button style={styles.cancelBtn} onClick={closeModal}>
                  Hủy bỏ
                </button>
                <button
                  style={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "⏳ Đang lưu..." : "💾 Lưu phiếu thuê"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =====================
   STYLE - SOFT NEUTRAL THEME
===================== */
const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
    padding: "32px 16px",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    background: "rgba(255,255,255,0.95)",
    padding: 24,
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: "#2d3748",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: 14,
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "#4299e1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)",
    transition: "all 0.3s ease",
  },
  btnIcon: {
    fontSize: 20,
    fontWeight: 700,
  },
  tableContainer: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    background: "#718096",
  },
  th: {
    padding: "16px 20px",
    textAlign: "left",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  td: {
    padding: "16px 20px",
    fontSize: 14,
    color: "#334155",
    borderBottom: "1px solid #e2e8f0",
  },
  badge: {
    background: "#4a5568",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  roomName: {
    color: "#2d3748",
    fontWeight: 600,
  },
  date: {
    color: "#64748b",
    fontSize: 13,
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-block",
    whiteSpace: "nowrap",
  },
  tdActions: {
    padding: "16px 20px",
    fontSize: 14,
    color: "#334155",
    borderBottom: "1px solid #e2e8f0",
  },
  actionButtons: {
    display: "flex",
    gap: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  actionBtn: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: 20,
    width: "90%",
    maxWidth: 700,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px 28px",
    borderBottom: "2px solid #e2e8f0",
    background: "#f7fafc",
    position: "relative",
  },
  modalTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#2d3748",
  },
  closeBtn: {
    position: "absolute",
    right: "28px",
    background: "transparent",
    border: "none",
    fontSize: 24,
    color: "#64748b",
    cursor: "pointer",
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  form: {
    padding: "28px",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
  },
  labelSmall: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    transition: "all 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    transition: "all 0.2s ease",
    outline: "none",
    background: "#fff",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  dateGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  guestSection: {
    marginTop: 24,
    padding: 20,
    background: "#f8fafc",
    borderRadius: 12,
  },
  guestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  guestTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
  },
  guestLimit: {
    background: "#4a5568",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  khachBox: {
    background: "#fff",
    border: "2px solid #e2e8f0",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  khachHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2px solid #e2e8f0",
  },
  khachNumber: {
    fontSize: 14,
    fontWeight: 700,
    color: "#4a5568",
  },
  removeBtn: {
    background: "#e53e3e",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  khachGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  addGuestBtn: {
    width: "100%",
    padding: "12px",
    background: "#48bb78",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  addGuestBtnDisabled: {
    background: "#cbd5e1",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    padding: "24px 28px",
    borderTop: "2px solid #e2e8f0",
    background: "#f8fafc",
  },
  cancelBtn: {
    padding: "12px 24px",
    background: "#fff",
    color: "#64748b",
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  submitBtn: {
    padding: "12px 24px",
    background: "#4299e1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)",
    transition: "all 0.2s ease",
  },
};

export default BookingManagement;
