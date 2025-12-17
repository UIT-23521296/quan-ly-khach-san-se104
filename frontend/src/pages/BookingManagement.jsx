import React, { useEffect, useState } from "react";
import api from "../services/api";

/* =====================
   STATE MẪU
===================== */
const emptyForm = {
  MaPhong: "",
  NgayBatDauThue: "",
  NgayDuKienTra: "",
  GhiChu: "", 
};

const emptyKhach = {
  HoTen: "",
  MaLoaiKhach: "",
  CMND: "",
  DiaChi: "",
  SDT: "",
};

const BookingManagement = () => {
  // --- STATE ---
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guestTypes, setGuestTypes] = useState([]);
  const [soKhachToiDa, setSoKhachToiDa] = useState(1);

  // Bộ lọc Tab
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  // ✅ Bộ lọc Tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); 
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState(emptyForm);
  const [khachList, setKhachList] = useState([{ ...emptyKhach }]);
  const [selectedPhieu, setSelectedPhieu] = useState(null);

  // Bộ lọc Ngày
  const [filterDateFrom, setFilterDateFrom] = useState(""); // Từ ngày
  const [filterDateTo, setFilterDateTo] = useState("");     // Đến ngày

  // ✅ STATE MỚI: Lưu số lượng khách lúc mới mở form 
  const [initialGuestCount, setInitialGuestCount] = useState(0);

  /* =====================
     LOAD DATA
  ===================== */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, rRes, gRes, maxRes] = await Promise.all([
        api.get("/phieuthue"),
        api.get("/phong"),
        api.get("/loaikhach"),
        api.get("/thamso/sokhachMax"),
      ]);
      setBookings(bRes.data);
      setRooms(rRes.data.filter((r) => r.TinhTrang === "Trống"));
      setGuestTypes(gRes.data);
      setSoKhachToiDa(maxRes.data.soKhachToiDa);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
  };

  const formatInputDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /* =====================
     HELPER XỬ LÝ DỮ LIỆU & LỌC
  ===================== */
  const processBookings = () => {
    // 1. GOM NHÓM DỮ LIỆU 
    const map = {};
    bookings.forEach((b) => {
      if (!map[b.SoPhieu]) {
        map[b.SoPhieu] = {
          ...b,
          khachListDetail: [{
            MaKH: b.MaKH, HoTen: b.HoTen, CMND: b.CMND, SDT: b.SDT, DiaChi: b.DiaChi, MaLoaiKhach: b.MaLoaiKhach || "" 
          }],
          khachListNames: [b.HoTen],
        };
      } else {
        if (!map[b.SoPhieu].khachListDetail.find(k => k.MaKH === b.MaKH)) {
          map[b.SoPhieu].khachListDetail.push({
            MaKH: b.MaKH, HoTen: b.HoTen, CMND: b.CMND, SDT: b.SDT, DiaChi: b.DiaChi, MaLoaiKhach: b.MaLoaiKhach || ""
          });
          map[b.SoPhieu].khachListNames.push(b.HoTen);
        }
      }
    });

    let result = Object.values(map);

    // 2. SẮP XẾP 
    result.sort((a, b) => new Date(b.NgayBatDauThue) - new Date(a.NgayBatDauThue));

    // 3. LỌC: TÌM KIẾM 
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.SoPhieu.toLowerCase().includes(lowerTerm) ||
        b.TenPhong.toLowerCase().includes(lowerTerm) ||
        b.khachListNames.some(name => name.toLowerCase().includes(lowerTerm))
      );
    }

    // 4. LỌC: THEO TAB 
    if (filterStatus === 'DANG_THUE') {
      result = result.filter(b => b.TrangThaiLuuTru === 'DANG_THUE');
    } else if (filterStatus === 'DA_TRA_PHONG') {
      result = result.filter(b => b.TrangThaiLuuTru === 'DA_TRA_PHONG' || b.TrangThaiLuuTru === 'DA_THANH_TOAN');
    } else if (filterStatus === 'DA_HUY') {
      result = result.filter(b => b.TrangThaiLuuTru === 'DA_HUY');
    }

    // ✅ 5. LỌC: THEO NGÀY 
    if (filterDateFrom) {
      result = result.filter(b => formatInputDate(b.NgayBatDauThue) >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter(b => formatInputDate(b.NgayBatDauThue) <= filterDateTo);
    }

    return result;
  };

  // Các hàm formatDate, formatInputDate, renderTrangThai
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderTrangThai = (trangThai) => {
    const statusMap = {
      DANG_THUE: { icon: "🟢", text: "Đang thuê", color: "#10b981" },
      DA_TRA_PHONG: { icon: "✅", text: "Đã trả phòng", color: "#3b82f6" },
      DA_THANH_TOAN: { icon: "✅", text: "Đã trả phòng", color: "#3b82f6" },
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
     HANDLER MODAL & FORM
  ===================== */
  // Các hàm openModal, handleFormChange, etc.
  const openModalCreate = () => {
    setModalMode("create");
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    setForm({
      ...emptyForm,
      NgayBatDauThue: todayStr, 
    });
    setKhachList([{ ...emptyKhach }]);
    setIsModalOpen(true);
  };

  const openModalEdit = (booking) => {
    setModalMode("edit");
    setSelectedPhieu(booking.SoPhieu);
    
    setForm({
      MaPhong: booking.MaPhong,
      NgayBatDauThue: formatInputDate(booking.NgayBatDauThue),
      NgayDuKienTra: formatInputDate(booking.NgayDuKienTra),
      GhiChu: booking.GhiChu || ""
    });

    const details = booking.khachListDetail.map(k => ({...k}));
    setKhachList(details);
    setInitialGuestCount(details.length);
    setIsModalOpen(true);
  };

  const openModalView = (booking) => {
    setModalMode("view");
    setForm({
      MaPhong: booking.TenPhong,
      NgayBatDauThue: formatInputDate(booking.NgayBatDauThue),
      NgayDuKienTra: formatInputDate(booking.NgayDuKienTra),
      GhiChu: booking.GhiChu || "Không có ghi chú"
    });
    setKhachList(booking.khachListDetail);
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
    if (modalMode === "view") {
        closeModal();
        return;
    }

    // Validate dữ liệu rỗng (như đã làm trước đó)
    for (let i = 0; i < khachList.length; i++) {
        const k = khachList[i];
        if (!k.HoTen || !k.HoTen.trim()) {
            alert(`❌ Khách hàng #${i + 1} chưa nhập tên!`);
            return;
        }
        if (!k.MaLoaiKhach) {
            alert(`❌ Khách hàng #${i + 1} chưa chọn Loại khách!`);
            return;
        }
    }

    // === LOGIC KIỂM TRA SỐ LƯỢNG KHÁCH ===
    const currentCount = khachList.length;

    // TRƯỜNG HỢP 1: TẠO MỚI 
    if (modalMode === "create") {
        if (currentCount > soKhachToiDa) {
            alert(`❌ Quy định hiện tại chỉ cho phép tối đa ${soKhachToiDa} khách/phòng.`);
            return;
        }
    } 
    // TRƯỜNG HỢP 2: SỬA (EDIT) 
    else if (modalMode === "edit") {
        // Nếu số khách TĂNG LÊN so với ban đầu VÀ vượt quá quy định
        if (currentCount > initialGuestCount && currentCount > soKhachToiDa) {
             alert(`❌ Không thể thêm người!\n\nQuy định mới là tối đa ${soKhachToiDa} khách.\n(Bạn chỉ được phép giữ nguyên số lượng cũ hoặc giảm bớt).`);
             return;
        }
    }
    // =======================================================

    setLoading(true);
    try {
      if (modalMode === "create") {
        await api.post("/phieuthue", { ...form, danhSachKhach: khachList });
        alert("✅ Lập phiếu thuê thành công");
      } else if (modalMode === "edit") {
        await api.put(`/phieuthue/${selectedPhieu}`, {
            NgayDuKienTra: form.NgayDuKienTra,
            GhiChu: form.GhiChu,
            danhSachKhach: khachList
        });
        alert("✅ Cập nhật phiếu thành công");
      }
      closeModal();
      fetchData();
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Lỗi xử lý"));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, booking) => {
      const isCheckout = action === 'checkout';
      const msg = isCheckout 
        ? `Xác nhận TRẢ PHÒNG ${booking.TenPhong}?` 
        : `Xác nhận HỦY phiếu ${booking.SoPhieu}?`;
      
      if (!window.confirm(msg)) return;

      try {
          const endpoint = isCheckout ? 'checkout' : 'huy';
          await api.put(`/phieuthue/${booking.SoPhieu}/${endpoint}`);
          alert("✅ Thao tác thành công!");
          fetchData();
      } catch (err) {
          alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
      }
  }

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
          <button style={styles.addBtn} onClick={openModalCreate}>
            <span style={styles.btnIcon}>+</span>
            <span>Tạo phiếu thuê mới</span>
          </button>
        </div>

        {/* --- THANH CÔNG CỤ: TAB + NGÀY + TÌM KIẾM --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          
          {/* Dòng 1: Tab trạng thái */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'DANG_THUE', label: '🟢 Đang ở' },
              { key: 'DA_TRA_PHONG', label: '✅ Đã trả' },
              { key: 'DA_HUY', label: '🔴 Đã hủy' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  background: filterStatus === tab.key ? '#3b82f6' : '#fff',
                  color: filterStatus === tab.key ? '#fff' : '#64748b',
                  boxShadow: filterStatus === tab.key ? '0 2px 5px rgba(59, 130, 246, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dòng 2: Bộ lọc ngày và Tìm kiếm */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{fontSize: '14px', fontWeight: 600, color: '#64748b'}}>Từ ngày:</span>
              <input 
                type="date" 
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                style={styles.inputSearch}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{fontSize: '14px', fontWeight: 600, color: '#64748b'}}>Đến ngày:</span>
              <input 
                type="date" 
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                style={styles.inputSearch}
              />
            </div>

            <div style={{flex: 1}}></div> {/* Spacer đẩy ô tìm kiếm sang phải */}

            <input 
              type="text" 
              placeholder="🔍 Tìm phiếu, phòng, khách..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...styles.inputSearch, width: '300px' }}
            />
            
            {/* Nút Xóa lọc */}
            {(filterDateFrom || filterDateTo || searchTerm) && (
              <button 
                onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setSearchTerm(""); }}
                style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}
                title="Xóa bộ lọc"
              >
                🔄
              </button>
            )}
          </div>
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
              {processBookings().map((b, idx) => {
                const trangThai = b.TrangThaiLuuTru || "DANG_THUE";
                const isDangThue = trangThai === "DANG_THUE";

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
                        {b.khachListNames.map((name, i) => (
                          <div key={i} style={{ marginBottom: 4 }}>
                            {name}
                          </div>
                        ))}
                        <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginTop: 4, display: "block" }}>
                          ({b.khachListNames.length} khách)
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>{formatDate(b.NgayBatDauThue)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>{formatDate(b.NgayDuKienTra)}</span>
                    </td>
                    <td style={styles.td}>{renderTrangThai(trangThai)}</td>
                    <td style={styles.tdActions}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => openModalView(b)}
                          title="Xem chi tiết"
                        >
                          Xem
                        </button>

                        {isDangThue && (
                            <button
                            style={styles.actionBtn}
                            onClick={() => openModalEdit(b)}
                            title="Sửa phiếu"
                            >
                            Sửa
                            </button>
                        )}

                        {isDangThue && (
                            <button
                            style={{ ...styles.actionBtn, background: "#dbeafe", color: "#2563eb", borderColor: "#bfdbfe" }}
                            onClick={() => handleAction('checkout', b)}
                            title="Trả phòng"
                            >
                            Trả phòng
                            </button>
                        )}

                        {isDangThue && (
                            <button
                            style={{ ...styles.actionBtn, background: "#fee2e2", color: "#ef4444", borderColor: "#fecaca" }}
                            onClick={() => handleAction('cancel', b)}
                            title="Hủy phiếu"
                            >
                            Hủy
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MODAL & STYLES (Giữ nguyên như cũ) */}
        {isModalOpen && (
          <div style={styles.overlay} onClick={closeModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                    {modalMode === 'create' && "✨ Tạo phiếu thuê phòng mới"}
                    {modalMode === 'edit' && "✏️ Sửa thông tin phiếu thuê"}
                    {modalMode === 'view' && "ℹ️ Chi tiết phiếu thuê"}
                </h2>
                <button style={styles.closeBtn} onClick={closeModal}>
                  ✕
                </button>
              </div>

              <div style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phòng</label>
                  {modalMode === 'create' ? (
                      <select
                        name="MaPhong"
                        onChange={handleFormChange}
                        style={styles.select}
                        value={form.MaPhong}
                      >
                        <option value="">-- Chọn phòng trống --</option>
                        {rooms.map((r) => (
                          <option key={r.MaPhong} value={r.MaPhong}>
                            🚪 {r.TenPhong}
                          </option>
                        ))}
                      </select>
                  ) : (
                      <input 
                        style={{...styles.input, background: '#f3f4f6'}} 
                        value={modalMode === 'view' ? form.MaPhong : form.MaPhong} 
                        disabled 
                      />
                  )}
                </div>

                <div style={styles.dateGroup}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Ngày bắt đầu thuê</label>
                    <input
                      type="date"
                      name="NgayBatDauThue"
                      value={form.NgayBatDauThue}
                      onChange={handleFormChange}
                      style={styles.input}
                      disabled={modalMode !== 'create'}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Ngày trả dự kiến</label>
                    <input
                      type="date"
                      name="NgayDuKienTra"
                      value={form.NgayDuKienTra}
                      onChange={handleFormChange}
                      style={styles.input}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Ghi chú</label>
                    <input
                      type="text"
                      name="GhiChu"
                      value={form.GhiChu}
                      onChange={handleFormChange}
                      style={styles.input}
                      placeholder="Ghi chú thêm..."
                      disabled={modalMode === 'view'}
                    />
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
                        {modalMode !== 'view' && khachList.length > 1 && (
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
                            disabled={modalMode === 'view'}
                          />
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.labelSmall}>Loại khách *</label>
                          {modalMode === 'create' || modalMode == 'edit' ? (
                              <select
                                value={k.MaLoaiKhach}
                                onChange={(e) => handleKhachChange(index, "MaLoaiKhach", e.target.value)}
                                style={styles.select}
                              >
                                <option value="">-- Chọn loại --</option>
                                {guestTypes.map((g) => (
                                  <option key={g.MaLoaiKhach} value={g.MaLoaiKhach}>
                                    {g.TenLoaiKhach}
                                  </option>
                                ))}
                              </select>
                          ) : (
                              <input 
                                style={{...styles.input, background: '#f3f4f6'}} 
                                value={guestTypes.find(g => g.MaLoaiKhach == k.MaLoaiKhach)?.TenLoaiKhach || k.MaLoaiKhach} 
                                disabled 
                              />
                          )}
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
                            disabled={modalMode === 'view'}
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
                            disabled={modalMode === 'view'}
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
                            disabled={modalMode === 'view'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {modalMode !== 'view' && (
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
                  )}
                </div>
              </div>

              <div style={styles.actions}>
                <button style={styles.cancelBtn} onClick={closeModal}>
                  {modalMode === 'view' ? "Đóng" : "Hủy bỏ"}
                </button>
                {modalMode !== 'view' && (
                    <button
                    style={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={loading}
                    >
                    {loading ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
                    </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =====================
          STYLE 
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
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
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
  inputSearch: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    outline: 'none',
    fontSize: '14px',
    color: '#334155'
  },
};

export default BookingManagement;