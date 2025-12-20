import React, { useState, useEffect } from "react";
import api from "../services/api";

const RoomSearch = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/phong");
      setRooms(response.data);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách phòng:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper format ngày
  const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const filteredRooms = rooms.filter((room) => {
    if (filterStatus !== "ALL" && room.TinhTrang !== filterStatus) return false;
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      room.TenPhong.toLowerCase().includes(lowerTerm) ||
      room.MaPhong.toLowerCase().includes(lowerTerm) ||
      (room.TenLoaiPhong && room.TenLoaiPhong.toLowerCase().includes(lowerTerm)) ||
      (room.TenKhach && room.TenKhach.toLowerCase().includes(lowerTerm)) 
    );
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>🔍 Tra cứu phòng</h1>
          <p style={styles.subtitle}>
            Tra cứu nhanh thông tin, khách đang ở và tình trạng phòng.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={styles.quickStats}>
                <span style={{color: '#059669'}}>Trống: <b>{rooms.filter(r => r.TinhTrang === 'Trống').length}</b></span>
                <span style={{color: '#DC2626'}}>Đang ở: <b>{rooms.filter(r => r.TinhTrang === 'Đã thuê').length}</b></span>
            </div>

            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.filterSelect}
            >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Trống">Phòng Trống</option>
                <option value="Đã thuê">Đang có khách</option>
                <option value="Bảo trì">Đang bảo trì</option>
            </select>

            <div style={{position: 'relative'}}>
                <input 
                    type="text" 
                    placeholder="Tìm phòng, tên khách..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
                {searchTerm && <button onClick={() => setSearchTerm("")} style={styles.clearSearchBtn}>✕</button>}
            </div>
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", color: '#64748b' }}>⏳ Đang tải dữ liệu...</p>}

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Phòng</th>
              <th style={styles.th}>Loại & Giá</th>
              {/* CỘT MỚI 1 */}
              <th style={styles.th}>Khách đang ở</th>
              {/* CỘT MỚI 2 */}
              <th style={styles.th}>Thời gian lưu trú</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Tình trạng</th>
              <th style={styles.th}>Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            {filteredRooms.length === 0 ? (
                <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                        Không tìm thấy kết quả.
                    </td>
                </tr>
            ) : filteredRooms.map((room, idx) => {
              const isOccupied = room.TinhTrang === 'Đã thuê';
              
              return (
                <tr 
                    key={room.MaPhong} 
                    style={{
                        ...styles.tr,
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                >
                  <td style={styles.td}>
                      <div style={{fontWeight: 'bold', color: '#1e293b', fontSize: '1rem'}}>{room.TenPhong}</div>
                      <span style={styles.codeBadge}>{room.MaPhong}</span>
                  </td>

                  <td style={styles.td}>
                    <span style={loaiPhongBadgeStyle(room.TenLoaiPhong || room.MaLoaiPhong)}>
                      {room.TenLoaiPhong || room.MaLoaiPhong}
                    </span>
                    <div style={{marginTop: '4px', fontSize: '0.85rem', color: '#64748b'}}>
                        {Number(room.DonGia).toLocaleString("vi-VN")} đ
                    </div>
                  </td>

                  {/* THÔNG TIN KHÁCH HÀNG */}
                  <td style={styles.td}>
                    {isOccupied && room.TenKhach ? (
                        <div>
                            <div style={{fontWeight: '600', color: '#334155'}}>👤 {room.TenKhach}</div>
                            <div style={{fontSize: '0.85rem', color: '#059669'}}>📞 {room.SDTKhach}</div>
                        </div>
                    ) : (
                        <span style={{color: '#cbd5e1'}}>---</span>
                    )}
                  </td>

                  {/* THÔNG TIN NGÀY */}
                  <td style={styles.td}>
                    {isOccupied && room.NgayBatDauThue ? (
                        <div style={{fontSize: '0.9rem'}}>
                            <div style={{color: '#2563eb'}}>In: {formatDate(room.NgayBatDauThue)}</div>
                            <div style={{color: '#d97706'}}>Out: {formatDate(room.NgayDuKienTra)}</div>
                        </div>
                    ) : (
                        <span style={{color: '#cbd5e1'}}>---</span>
                    )}
                  </td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span style={statusBadgeStyle(room.TinhTrang)}>
                      {room.TinhTrang}
                    </span>
                  </td>

                  <td style={{...styles.td, color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem'}}>
                    {room.GhiChu || ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles
const styles = {
  wrapper: { width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "2rem" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  title: { fontSize: "2rem", fontWeight: 700, color: "#1F2A40", marginBottom: "0.5rem" },
  subtitle: { color: "#64748b", fontSize: "0.95rem" },
  quickStats: { display: 'flex', gap: '15px', marginRight: '10px', fontSize: '0.9rem', background: '#fff', padding: '8px 16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  searchInput: { padding: "0.7rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.95rem", width: "240px", outline: "none" },
  filterSelect: { padding: "0.7rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.95rem", outline: "none", cursor: "pointer", backgroundColor: "white" },
  clearSearchBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold' },
  tableCard: { background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", padding: "0", overflowX: "auto", border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" },
  th: { padding: "16px 24px", backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontWeight: 600, color: "#475569", textAlign: "left", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.05em" },
  tr: { borderBottom: "1px solid #f1f5f9", transition: 'background 0.2s' },
  td: { padding: "16px 24px", verticalAlign: "middle" },
  codeBadge: { fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b', fontSize: '0.8rem', marginLeft: '0px' }
};

const loaiPhongBadgeStyle = (loai) => {
  const colors = { A: { bg: "#DBEAFE", color: "#1D4ED8" }, B: { bg: "#FEF3C7", color: "#D97706" }, C: { bg: "#FEE2E2", color: "#DC2626" }, D: { bg: "#E9D5FF", color: "#7C3AED" } };
  const style = colors[loai?.[0]] || { bg: "#E0EAFF", color: "#1E40AF" }; 
  return { display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", backgroundColor: style.bg, color: style.color };
};

const statusBadgeStyle = (status) => {
  let bg = "#f3f4f6"; let color = "#374151";
  if (status === "Trống") { bg = "#dcfce7"; color = "#166534"; }
  else if (status === "Đã thuê") { bg = "#fee2e2"; color = "#991b1b"; }
  else if (status === "Bảo trì") { bg = "#ffedd5"; color = "#9a3412"; }
  return { display: "inline-block", padding: "6px 12px", borderRadius: "20px", fontWeight: 600, fontSize: "0.8rem", backgroundColor: bg, color: color, minWidth: "90px", textAlign: 'center' };
};

export default RoomSearch;