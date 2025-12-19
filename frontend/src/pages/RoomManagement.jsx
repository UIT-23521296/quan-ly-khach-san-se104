import React, { useState, useEffect } from "react";
import api from "../services/api";

const emptyForm = {
  maPhong: "",
  tenPhong: "",
  loaiPhong: "",
  tinhTrang: "Trống", // Mặc định
  ghiChu: "",
};

const generateRoomCode = (tenPhong) => {
  if (!/phòng/i.test(tenPhong)) return null;
  const numbers = tenPhong.match(/\d+/g);
  if (!numbers) return null;
  return "P" + numbers.join("");
};

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Biến kiểm tra xem phòng đang sửa có phải là "Đã thuê" không
  const isRented = form.tinhTrang === "Đã thuê";

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/phong");
      setRooms(response.data);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách phòng:", error);
      alert("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get("/loaiphong");
      setRoomTypes(response.data); 
    } catch (error) {
      console.error("❌ Lỗi khi tải loại phòng:", error);
    }
  };

  const openAddModal = () => {
    setMode("add");
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setMode("edit");
    setForm({
      maPhong: room.MaPhong,
      tenPhong: room.TenPhong,
      loaiPhong: room.MaLoaiPhong,
      tinhTrang: room.TinhTrang,
      ghiChu: room.GhiChu || "",
    });
    setEditingId(room.MaPhong);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.tenPhong.trim()) errs.tenPhong = "Tên phòng không được trống";
    if (!form.loaiPhong) errs.loaiPhong = "Chọn loại phòng";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      if (mode === "add") {
        const generatedCode = generateRoomCode(form.tenPhong);
        if (!generatedCode) {
            alert("Tên phòng phải có chữ 'Phòng' và số. VD: Phòng 101");
            setLoading(false);
            return;
        }

        const payload = {
            MaPhong: generatedCode,
            TenPhong: form.tenPhong,
            MaLoaiPhong: form.loaiPhong,
            TinhTrang: 'Trống', 
            GhiChu: form.ghiChu,
        };
        await api.post("/phong", payload);
        alert("✅ Thêm phòng thành công!");
      } else {
        // Khi sửa: Gửi thông tin cập nhật
        const payload = {
            TenPhong: form.tenPhong,
            MaLoaiPhong: form.loaiPhong,
            GhiChu: form.ghiChu,
        };
        await api.put(`/phong/${editingId}`, payload);
        alert("✅ Cập nhật phòng thành công!");
      }

      fetchRooms();
      setIsModalOpen(false);
    } catch (error) {
      console.error("❌ Lỗi khi lưu phòng:", error);
      const msg = error.response?.data?.message || "Không thể lưu phòng. Vui lòng thử lại.";
      alert("❌ " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Phòng này chưa có dữ liệu lịch sử. Bạn có chắc muốn XÓA vĩnh viễn?")) return;
    try {
      await api.delete(`/phong/${id}`);
      alert("✅ Xóa phòng thành công!");
      fetchRooms();
    } catch (error) {
      console.error("❌ Lỗi khi xóa phòng:", error);
      alert("Không thể xóa phòng: " + (error.response?.data?.error || ""));
    }
  };

  const handleMaintenance = async (room) => {
    const isMaintenance = room.TinhTrang === "Bảo trì";
    const newStatus = isMaintenance ? "Trống" : "Bảo trì";
    const actionText = isMaintenance ? "Hoàn tất bảo trì" : "Đưa vào bảo trì";

    if (!window.confirm(`Bạn muốn ${actionText} cho phòng ${room.TenPhong}?`)) return;

    try {
        await api.put(`/phong/${room.MaPhong}/maintenance`, { status: newStatus });
        alert("✅ Cập nhật trạng thái thành công!");
        fetchRooms();
    } catch (error) {
        alert("❌ Lỗi: " + (error.response?.data?.message || "Không thể cập nhật trạng thái"));
    }
  };

  const handleBusinessStatus = async (room, action) => {
      const msg = action === 'stop' 
        ? `Ngưng kinh doanh phòng ${room.TenPhong}? (Phòng sẽ không thể chọn để thuê)`
        : `Kích hoạt lại phòng ${room.TenPhong}?`;
      
      if(!window.confirm(msg)) return;

      try {
          await api.put(`/phong/${room.MaPhong}/business`, { action });
          alert("✅ Thành công!");
          fetchRooms();
      } catch (error) {
          alert("❌ Lỗi: " + (error.response?.data?.message || "Lỗi cập nhật"));
      }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Danh mục phòng</h1>
          <p style={styles.subtitle}>
            Quản lý thông tin phòng, loại phòng và tình trạng phòng.
          </p>
        </div>
        <button style={styles.addButton} onClick={openAddModal}>
           + Thêm phòng
        </button>
      </div>

      {loading && <p style={{ textAlign: "center" }}>⏳ Đang tải...</p>}

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Mã phòng</th>
              <th style={styles.th}>Tên phòng</th>
              <th style={styles.th}>Loại</th>
              <th style={styles.th}>Đơn giá</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Tình trạng</th>
              <th style={styles.th}>Ghi chú</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => {
              const isStopped = room.TinhTrang === 'Ngưng kinh doanh';
              const hasHistory = room.CoLichSu > 0; 

              return (
                <tr 
                    key={room.MaPhong} 
                    style={{
                        ...styles.tr,
                        backgroundColor: isStopped ? '#F3F4F6' : 'white',
                        opacity: isStopped ? 0.6 : 1
                    }}
                >
                  <td style={styles.td}>{room.MaPhong}</td>
                  <td style={styles.td}>{room.TenPhong}</td>

                  <td style={styles.td}>
                    <span
                      style={loaiPhongBadgeStyle(
                        room.TenLoaiPhong || room.MaLoaiPhong
                      )}
                    >
                      {room.TenLoaiPhong || room.MaLoaiPhong}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {room.DonGia
                      ? Number(room.DonGia).toLocaleString("vi-VN", {
                          minimumFractionDigits: 0,
                        }) + " VND"
                      : "-"}
                  </td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span style={statusBadgeStyle(room.TinhTrang)}>
                      {room.TinhTrang}
                    </span>
                  </td>

                  <td style={styles.td}>{room.GhiChu}</td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <div style={styles.actionRow}>
                      
                      {isStopped ? (
                          <button 
                            style={styles.activateBtn}
                            onClick={() => handleBusinessStatus(room, 'active')}
                            title="Kích hoạt lại để tiếp tục cho thuê"
                          >
                            🔄 Kích hoạt
                          </button>
                      ) : (
                          <>
                            <button
                              style={styles.editButton}
                              onClick={() => openEditModal(room)}
                            >
                              Sửa
                            </button>

                            {(room.TinhTrang === "Trống" || room.TinhTrang === "Bảo trì") && (
                                <button
                                    style={room.TinhTrang === "Bảo trì" ? styles.finishBtn : styles.maintenanceBtn}
                                    onClick={() => handleMaintenance(room)}
                                    title={room.TinhTrang === "Bảo trì" ? "Hoàn tất bảo trì" : "Đưa vào bảo trì"}
                                >
                                    {room.TinhTrang === "Bảo trì" ? "Xong" : "Bảo trì"}
                                </button>
                            )}

                            {hasHistory ? (
                                <button 
                                    style={styles.stopBtn} 
                                    onClick={() => handleBusinessStatus(room, 'stop')}
                                    title="Phòng đã có dữ liệu, chỉ có thể ngưng kinh doanh"
                                >
                                    ⛔ Ngưng KD
                                </button>
                            ) : (
                                <button
                                  style={styles.deleteButton}
                                  onClick={() => handleDelete(room.MaPhong)}
                                  title="Phòng chưa có dữ liệu, có thể xóa vĩnh viễn"
                                >
                                  Xoá
                                </button>
                            )}
                          </>
                      )}

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
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {mode === "add" ? "Thêm phòng" : "Sửa phòng"}
            </h2>

            <div style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Tên phòng</label>
                  <input
                    name="tenPhong"
                    value={form.tenPhong}
                    onChange={handleChange}
                    // ✅ Khóa Tên phòng nếu đang ở chế độ Sửa VÀ phòng Đang thuê
                    disabled={mode === "edit" && isRented} 
                    style={{
                        ...styles.input,
                        backgroundColor: (mode === "edit" && isRented) ? "#f3f4f6" : "white",
                        cursor: (mode === "edit" && isRented) ? "not-allowed" : "text"
                    }}
                  />
                  {mode === "add" && (
                    <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.25rem" }}>
                        VD: Nhập "Phòng 101" → Mã phòng sẽ tự tạo là P101
                    </p>
                  )}
                  {/* Hiển thị cảnh báo nếu bị khóa */}
                  {mode === "edit" && isRented && (
                    <p style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "0.25rem" }}>
                        🔒 Phòng đang thuê, không thể sửa Tên phòng.
                    </p>
                  )}
                  {errors.tenPhong && (
                    <span style={styles.errorText}>{errors.tenPhong}</span>
                  )}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Loại phòng</label>
                  <select
                    name="loaiPhong"
                    value={form.loaiPhong}
                    onChange={handleChange}
                    // ✅ Khóa Loại phòng nếu phòng Đang thuê
                    disabled={isRented}
                    style={{
                        ...styles.input,
                        backgroundColor: isRented ? "#f3f4f6" : "white",
                        cursor: isRented ? "not-allowed" : "pointer"
                    }}
                  >
                    <option value="">-- Chọn loại phòng --</option>
                    {roomTypes.map((type) => (
                      <option key={type.MaLoaiPhong} value={type.MaLoaiPhong}>
                        {type.TenLoaiPhong} -{" "}
                        {Number(type.DonGia).toLocaleString("vi-VN")} VND
                      </option>
                    ))}
                  </select>
                  {isRented && (
                    <p style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "0.25rem" }}>
                        🔒 Phòng đang thuê, không thể đổi Loại phòng.
                    </p>
                  )}
                  {errors.loaiPhong && (
                    <span style={styles.errorText}>{errors.loaiPhong}</span>
                  )}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Ghi chú</label>
                  {/* ✅ Ghi chú luôn cho phép sửa */}
                  <input
                    name="ghiChu"
                    value={form.ghiChu}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ghi chú thêm..."
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={styles.cancelButton}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={styles.saveButton}
                  disabled={loading}
                >
                  {loading
                    ? "⏳ Đang lưu..."
                    : mode === "add"
                    ? "Lưu"
                    : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== STYLES =====
const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem 2rem 3rem",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1F2A40",
  },
  subtitle: {
    marginTop: "0.3rem",
    color: "#6B7280",
  },
  addButton: {
    padding: "0.6rem 1.4rem",
    backgroundColor: "#3A7DFF",
    color: "white",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 5px 14px rgba(58, 125, 255, 0.35)",
  },
  tableCard: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
    padding: "1.5rem",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
  },
  th: {
    padding: "12px 16px",
    backgroundColor: "#F9FAFB",
    borderBottom: "2px solid #E5E7EB",
    fontWeight: 600,
    color: "#374151",
    textAlign: "left",
  },
  tr: {
    borderBottom: "1px solid #E5E7EB",
    transition: '0.2s',
  },
  td: {
    padding: "12px 16px",
    verticalAlign: "middle",
  },
  actionRow: {
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
  },
  editButton: {
    background: "#3A7DFF",
    color: "white",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  deleteButton: {
    background: "#EF4444",
    color: "white",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  maintenanceBtn: {
    background: "#F59E0B",
    color: "white",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  finishBtn: {
    background: "#10B981",
    color: "white",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  stopBtn: {
    background: "#374151",
    color: "white",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  activateBtn: {
    background: "#059669",
    color: "white",
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: "680px",
    background: "white",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontSize: "1.4rem",
    marginBottom: "1rem",
    fontWeight: 700,
    color: "#1F2A40",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  formRow: {
    display: "flex",
    gap: "1rem",
  },
  formGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  input: {
    padding: "0.55rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "0.95rem",
  },
  errorText: {
    color: "#EF4444",
    fontSize: "0.8rem",
    marginTop: "0.2rem",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.8rem",
    marginTop: "1rem",
  },
  cancelButton: {
    padding: "0.5rem 1.2rem",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    background: "white",
    cursor: "pointer",
  },
  saveButton: {
    padding: "0.5rem 1.4rem",
    borderRadius: "8px",
    border: "none",
    background: "#3A7DFF",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
};

const loaiPhongBadgeStyle = (loai) => {
  const colors = {
    A: { bg: "#DBEAFE", color: "#1D4ED8" },
    "Loại A": { bg: "#DBEAFE", color: "#1D4ED8" },
    B: { bg: "#FEF3C7", color: "#D97706" },
    "Loại B": { bg: "#FEF3C7", color: "#D97706" },
    C: { bg: "#FEE2E2", color: "#DC2626" },
    "Loại C": { bg: "#FEE2E2", color: "#DC2626" },
    D: { bg: "#E9D5FF", color: "#7C3AED" },
    "Loại D": { bg: "#E9D5FF", color: "#7C3AED" },
  };

  const style = colors[loai] || { bg: "#E0EAFF", color: "#1E40AF" };
  return {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.85rem",
    backgroundColor: style.bg,
    color: style.color,
    minWidth: "36px",
    textAlign: "center",
  };
};

const statusBadgeStyle = (status) => {
  let bg = "#E5E7EB";
  let color = "#374151";
  if (status === "Trống") {
    bg = "#D1FAE5";
    color = "#059669";
  } else if (status === "Đã thuê") {
    bg = "#FEE2E2";
    color = "#DC2626";
  } else if (status === "Đang dọn") {
    bg = "#FEF3C7";
    color = "#D97706";
  } else if (status === "Bảo trì") {
    bg = "#fed7aa"; 
    color = "#c2410c";
  } else if (status === "Ngưng kinh doanh") {
    bg = "#4b5563"; 
    color = "#ffffff";
  }

  return {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.85rem",
    backgroundColor: bg,
    color,
    minWidth: "80px",
  };
};

export default RoomManagement;