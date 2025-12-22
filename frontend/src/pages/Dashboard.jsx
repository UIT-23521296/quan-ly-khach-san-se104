import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Lỗi tải dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>⏳ Đang tải dữ liệu tổng quan...</div>;
  if (!stats) return null;

  // Tính tổng số phòng để tính % cho thanh trạng thái
  const totalRooms = stats.rooms['Trống'] + stats.rooms['Đã thuê'] + stats.rooms['Bảo trì'] + stats.rooms['Ngưng kinh doanh'];
  
  // Hàm tính %
  const getPercent = (val) => totalRooms > 0 ? ((val / totalRooms) * 100).toFixed(1) + "%" : "0%";

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.pageTitle}>📊 Tổng quan hệ thống</h1>
      <p style={styles.subTitle}>Cập nhật tình hình kinh doanh mới nhất hôm nay.</p>

      {/* --- PHẦN 1: CÁC THẺ THỐNG KÊ (CARDS) --- */}
      <div style={styles.cardGrid}>
        
        {/* Card 1: Doanh thu tháng */}
        <div style={{...styles.statCard, borderLeft: '4px solid #2563eb'}}>
          <div style={styles.cardIconBoxBlue}>💰</div>
          <div>
            <p style={styles.cardLabel}>Doanh thu tháng này</p>
            <h3 style={{...styles.cardValue, color: '#2563eb'}}>
                {Number(stats.revenue.month).toLocaleString()} đ
            </h3>
            <p style={styles.cardSub}>Hôm nay: <span style={{fontWeight: 'bold'}}>{Number(stats.revenue.today).toLocaleString()} đ</span></p>
          </div>
        </div>

        {/* Card 2: Phòng đang thuê */}
        <div style={{...styles.statCard, borderLeft: '4px solid #dc2626'}}>
          <div style={styles.cardIconBoxRed}>🔑</div>
          <div>
            <p style={styles.cardLabel}>Phòng đang có khách</p>
            <h3 style={{...styles.cardValue, color: '#dc2626'}}>
                {stats.rooms['Đã thuê']} <span style={styles.unit}>phòng</span>
            </h3>
            <p style={styles.cardSub}>Chiếm {getPercent(stats.rooms['Đã thuê'])} tổng số phòng</p>
          </div>
        </div>

        {/* Card 3: Phòng trống */}
        <div style={{...styles.statCard, borderLeft: '4px solid #10b981'}}>
          <div style={styles.cardIconBoxGreen}>🛏️</div>
          <div>
            <p style={styles.cardLabel}>Phòng trống hiện tại</p>
            <h3 style={{...styles.cardValue, color: '#10b981'}}>
                {stats.rooms['Trống']} <span style={styles.unit}>phòng</span>
            </h3>
            <p style={styles.cardSub}>Sẵn sàng đón khách</p>
          </div>
        </div>

        {/* Card 4: Khách hàng */}
        <div style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}}>
          <div style={styles.cardIconBoxOrange}>👥</div>
          <div>
            <p style={styles.cardLabel}>Tổng khách hàng</p>
            <h3 style={{...styles.cardValue, color: '#d97706'}}>
                {stats.totalCustomers} <span style={styles.unit}>người</span>
            </h3>
            <p style={styles.cardSub}>Đã lưu trữ trong hệ thống</p>
          </div>
        </div>
      </div>

      {/* --- PHẦN 2: CHI TIẾT (Chia 2 cột) --- */}
      <div style={styles.detailGrid}>
        
        {/* CỘT TRÁI: TÌNH TRẠNG PHÒNG (Dạng thanh tiến trình) */}
        <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>🏨 Tình trạng phòng ({totalRooms} phòng)</h3>
            <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                
                <div style={styles.progressItem}>
                    <div style={styles.progressHeader}>
                        <span style={{color: '#10b981', fontWeight: 'bold'}}>Sẵn sàng đón khách (Trống)</span>
                        <span style={{fontWeight: 'bold'}}>{stats.rooms['Trống']} phòng</span>
                    </div>
                    <div style={styles.progressBarBg}>
                        <div style={{...styles.progressBarFill, width: getPercent(stats.rooms['Trống']), background: '#10b981'}}></div>
                    </div>
                </div>

                <div style={styles.progressItem}>
                    <div style={styles.progressHeader}>
                        <span style={{color: '#dc2626', fontWeight: 'bold'}}>Đang có khách (Đã thuê)</span>
                        <span style={{fontWeight: 'bold'}}>{stats.rooms['Đã thuê']} phòng</span>
                    </div>
                    <div style={styles.progressBarBg}>
                        <div style={{...styles.progressBarFill, width: getPercent(stats.rooms['Đã thuê']), background: '#dc2626'}}></div>
                    </div>
                </div>

                <div style={styles.progressItem}>
                    <div style={styles.progressHeader}>
                        <span style={{color: '#f59e0b', fontWeight: 'bold'}}>Đang bảo trì / Ngưng KD</span>
                        <span style={{fontWeight: 'bold'}}>{stats.rooms['Bảo trì'] + stats.rooms['Ngưng kinh doanh']} phòng</span>
                    </div>
                    <div style={styles.progressBarBg}>
                        <div style={{...styles.progressBarFill, width: getPercent(stats.rooms['Bảo trì'] + stats.rooms['Ngưng kinh doanh']), background: '#f59e0b'}}></div>
                    </div>
                </div>

                <div style={{marginTop: '20px', textAlign: 'center'}}>
                    <button style={styles.btnAction} onClick={() => navigate('/phieuthue')}>
                        📝 Lập phiếu thuê ngay
                    </button>
                </div>
            </div>
        </div>

        {/* CỘT PHẢI: HÓA ĐƠN GẦN ĐÂY */}
        <div style={styles.sectionCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={styles.sectionTitle}>🧾 Hóa đơn mới nhất</h3>
                <button style={styles.linkBtn} onClick={() => navigate('/invoice')}>Xem tất cả</button>
            </div>
            
            <div style={styles.recentList}>
                {stats.recentInvoices.length === 0 ? (
                    <p style={{textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '20px'}}>Chưa có hóa đơn nào.</p>
                ) : (
                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
                        <thead>
                            <tr style={{textAlign: 'left', color: '#64748b', fontSize: '12px', borderBottom: '1px solid #e2e8f0'}}>
                                <th style={{padding: '8px'}}>Số HĐ</th>
                                <th style={{padding: '8px'}}>Khách hàng</th>
                                <th style={{padding: '8px', textAlign: 'right'}}>Trị giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentInvoices.map((inv) => (
                                <tr key={inv.SoHoaDon} style={{borderBottom: '1px dashed #f1f5f9'}}>
                                    <td style={{padding: '12px 8px', color: '#334155', fontWeight: 'bold', fontSize: '13px'}}>{inv.SoHoaDon}</td>
                                    <td style={{padding: '12px 8px', color: '#475569'}}>
                                        <div style={{fontWeight: '600'}}>{inv.TenKhachHangCoQuan}</div>
                                        <div style={{fontSize: '11px', color: '#94a3b8'}}>{new Date(inv.NgayLap).toLocaleDateString('vi-VN')}</div>
                                    </td>
                                    <td style={{padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2563eb'}}>
                                        {Number(inv.TriGia).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  wrapper: { padding: "2rem 3rem", background: "#F5F8FF", minHeight: "100vh" },
  pageTitle: { fontSize: "2rem", fontWeight: "800", color: "#1e293b", margin: 0 },
  subTitle: { color: "#64748b", marginTop: "5px", marginBottom: "30px", fontSize: "1rem" },

  // Grid
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" },
  
  // Card
  statCard: { background: "white", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s" },
  
  // Icons
  cardIconBoxBlue: { width: "50px", height: "50px", borderRadius: "12px", background: "#dbeafe", color: "#2563eb", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" },
  cardIconBoxRed: { width: "50px", height: "50px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" },
  cardIconBoxGreen: { width: "50px", height: "50px", borderRadius: "12px", background: "#d1fae5", color: "#059669", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" },
  cardIconBoxOrange: { width: "50px", height: "50px", borderRadius: "12px", background: "#fef3c7", color: "#d97706", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" },

  cardLabel: { margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "600" },
  cardValue: { margin: "5px 0", fontSize: "24px", fontWeight: "800" },
  unit: { fontSize: "14px", fontWeight: "normal", color: "#94a3b8" },
  cardSub: { margin: 0, fontSize: "12px", color: "#64748b" },

  // Detail Section
  detailGrid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "25px" },
  sectionCard: { background: "white", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: 'flex', flexDirection: 'column' },
  sectionTitle: { margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "700" },

  // Progress Bar
  progressItem: { marginBottom: "10px" },
  progressHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#334155" },
  progressBarBg: { width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: "5px", transition: "width 0.5s ease-in-out" },

  btnAction: { padding: "10px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)" },
  linkBtn: { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  recentList: { marginTop: '10px' }
};

export default Dashboard;