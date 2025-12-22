import React, { useState, useEffect } from "react";
import api from "../services/api";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("loaiphong");
  
  const [loaiPhongs, setLoaiPhongs] = useState([]);
  const [loaiKhachs, setLoaiKhachs] = useState([]);
  const [phuThus, setPhuThus] = useState([]);
  const [thamSo, setThamSo] = useState({ SoKhachToiDa: 0, SoKhachKhongTinhPhuThu: 0 });
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
        if (activeTab === 'loaiphong') setLoaiPhongs((await api.get('/quidinh/loaiphong')).data);
        else if (activeTab === 'loaikhach') setLoaiKhachs((await api.get('/quidinh/loaikhach')).data);
        else if (activeTab === 'phuthu') setPhuThus((await api.get('/quidinh/phuthu')).data);
        else if (activeTab === 'thamso') setThamSo((await api.get('/quidinh/thamso')).data || {});
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const formatCurrency = (value) => {
      if (!value && value !== 0) return '';
      return Number(value).toLocaleString('en-US');
  };

  const handleDelete = async (id, type) => {
      if(!window.confirm("⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN mục này?")) return;
      try { 
          await api.delete(`/quidinh/${type}/${id}`); 
          alert("✅ Đã xóa thành công!"); 
          fetchData();
      } catch (err) { 
          const msg = err.response?.data?.message || err.message;
          alert("❌ " + msg); 
      }
  };

  const handleSave = async () => {
      try {
          if (activeTab === 'loaiphong') {
              const rawPrice = form.DonGia ? form.DonGia.toString().replace(/,/g, '') : 0;
              const payload = { maLoai: form.MaLoaiPhong, tenLoai: form.TenLoaiPhong, donGia: rawPrice };
              
              if (editingItem) await api.put(`/quidinh/loaiphong/${editingItem.MaLoaiPhong}`, payload);
              else await api.post(`/quidinh/loaiphong`, payload);

          } else if (activeTab === 'loaikhach') {
              const payload = { maLoai: form.MaLoaiKhach, tenLoai: form.TenLoaiKhach, heSo: form.HeSoPhuThu };
              
              if (editingItem) await api.put(`/quidinh/loaikhach/${editingItem.MaLoaiKhach}`, payload);
              else await api.post(`/quidinh/loaikhach`, payload);

          } else if (activeTab === 'phuthu') {
              await api.post(`/quidinh/phuthu`, { khachThu: form.KhachThu, tiLe: form.TiLePhuThu });
          }
          alert("✅ Lưu dữ liệu thành công!"); setIsModalOpen(false); fetchData();
      } catch (err) { alert("❌ Lỗi: " + (err.response?.data?.message || err.message)); }
  };

  const handleSaveThamSo = async () => {
      try { 
          // Log để kiểm tra dữ liệu gửi đi (F12 để xem)
          console.log("Gửi tham số:", thamSo);
          await api.put(`/quidinh/thamso`, thamSo); 
          alert("✅ Đã cập nhật tham số hệ thống!"); 
      } catch (err) { alert("Lỗi cập nhật tham số"); }
  };

  const openModal = (item) => {
      setEditingItem(item);
      if (item) setForm({...item});
      else {
          if (activeTab === 'loaiphong') setForm({ MaLoaiPhong: '', TenLoaiPhong: '', DonGia: '' });
          if (activeTab === 'loaikhach') setForm({ MaLoaiKhach: '', TenLoaiKhach: '', HeSoPhuThu: 1.0 });
          if (activeTab === 'phuthu') setForm({ KhachThu: '', TiLePhuThu: 0.25 });
      }
      setIsModalOpen(true);
  };

  // --- CẬP NHẬT GIAO DIỆN NÚT BẤM (Soft UI) ---
  const renderActions = (item, id, type) => {
      return (
          <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
              <button 
                style={styles.btnEdit} 
                onClick={() => openModal(item)}
                title="Sửa thông tin"
              >
                ✏️ Sửa
              </button>
              <button 
                style={styles.btnDelete} 
                onClick={() => handleDelete(id, type)}
                title="Xóa mục này"
              >
                🗑️ Xóa
              </button>
          </div>
      );
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div><h1 style={styles.title}>⚙️ Cấu hình quy định</h1><p style={styles.subtitle}>Quản lý danh mục phòng, khách và tham số hệ thống.</p></div>
      </div>
      
      <div style={styles.tabContainer}>
          {['loaiphong', 'loaikhach', 'phuthu', 'thamso'].map(tab => (
              <button 
                key={tab}
                style={activeTab === tab ? styles.tabActive : styles.tab} 
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'loaiphong' && '🏨 Loại Phòng'}
                {tab === 'loaikhach' && '👥 Loại Khách'}
                {tab === 'phuthu' && '💰 Phụ Thu'}
                {tab === 'thamso' && '🛠️ Tham Số'}
              </button>
          ))}
      </div>

      <div style={styles.content}>
        {/* --- LOẠI PHÒNG --- */}
        {activeTab === 'loaiphong' && (
            <div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
                    <button style={styles.btnAdd} onClick={() => openModal(null)}>+ Thêm Loại Phòng</button>
                </div>
                <div style={styles.card}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>Mã Loại</th>
                                <th style={styles.th}>Tên Loại Phòng</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Đơn Giá</th>
                                <th style={{...styles.th, textAlign: 'center', width: '180px'}}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loaiPhongs.map((item, idx) => (
                                <tr key={item.MaLoaiPhong} style={{borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc'}}>
                                    <td style={styles.td}>
                                        <span style={styles.codeBadge}>{item.MaLoaiPhong}</span>
                                    </td>
                                    <td style={{...styles.td, fontWeight: '600'}}>{item.TenLoaiPhong}</td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#2563eb'}}>
                                        {formatCurrency(item.DonGia)} <span style={{fontSize: '0.8em', color: '#64748b'}}>VND</span>
                                    </td>
                                    <td style={{...styles.td, textAlign: 'center'}}>{renderActions(item, item.MaLoaiPhong, 'loaiphong')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- LOẠI KHÁCH --- */}
        {activeTab === 'loaikhach' && (
            <div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
                    <button style={styles.btnAdd} onClick={() => openModal(null)}>+ Thêm Loại Khách</button>
                </div>
                <div style={styles.card}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>Mã Loại</th>
                                <th style={styles.th}>Tên Loại Khách</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Hệ Số Phụ Thu</th>
                                <th style={{...styles.th, textAlign: 'center', width: '180px'}}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loaiKhachs.map((item, idx) => (
                                <tr key={item.MaLoaiKhach} style={{borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc'}}>
                                    <td style={styles.td}>
                                        <span style={styles.codeBadge}>{item.MaLoaiKhach}</span>
                                    </td>
                                    <td style={{...styles.td, fontWeight: '600'}}>{item.TenLoaiKhach}</td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>x {item.HeSoPhuThu}</td>
                                    <td style={{...styles.td, textAlign: 'center'}}>{renderActions(item, item.MaLoaiKhach, 'loaikhach')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- PHỤ THU --- */}
        {activeTab === 'phuthu' && (
            <div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
                    <button style={styles.btnAdd} onClick={() => openModal(null)}>+ Thêm Mốc Phụ Thu</button>
                </div>
                <div style={styles.card}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>Khách Dư Thứ...</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Tỉ Lệ Phụ Thu</th>
                                <th style={{...styles.th, textAlign: 'center', width: '180px'}}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {phuThus.map((item, idx) => (
                                <tr key={item.KhachThu} style={{borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc'}}>
                                    <td style={styles.td}><strong>Khách thứ {item.KhachThu}</strong></td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#d97706'}}>{item.TiLePhuThu * 100}%</td>
                                    <td style={{...styles.td, textAlign: 'center'}}>{renderActions(item, item.KhachThu, 'phuthu')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- THAM SỐ (Cải tiến UI) --- */}
        {activeTab === 'thamso' && (
            <div style={styles.card}>
                <div style={{padding: '40px', maxWidth: '650px', margin: '0 auto'}}>
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <h3 style={{fontSize: '1.5rem', marginBottom: '10px', color: '#1e293b'}}>Quy định chung</h3>
                        <p style={{color: '#64748b'}}>Cấu hình các tham số cốt lõi cho việc thuê phòng</p>
                    </div>
                    
                    <div style={styles.paramItem}>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Số khách tối đa trong 1 phòng</label>
                            <p style={styles.desc}>Giới hạn số người (bao gồm cả trẻ em) được phép ở.</p>
                        </div>
                        <input type="number" style={styles.inputLarge} value={thamSo.SoKhachToiDa} onChange={e => setThamSo({...thamSo, SoKhachToiDa: e.target.value})}/>
                    </div>

                    <div style={styles.paramItem}>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Số khách tiêu chuẩn</label>
                            <p style={styles.desc}>Số lượng khách tối đa không bị tính phụ thu.</p>
                        </div>
                        <input type="number" style={styles.inputLarge} value={thamSo.SoKhachKhongTinhPhuThu} onChange={e => setThamSo({...thamSo, SoKhachKhongTinhPhuThu: e.target.value})}/>
                    </div>

                    <div style={{textAlign: 'right', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
                        <button style={styles.btnSave} onClick={handleSaveThamSo}>
                            💾 Lưu Thay Đổi
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h2 style={{margin: 0, fontSize: '1.25rem', color: '#1e293b'}}>{editingItem ? "✏️ Cập nhật thông tin" : "✨ Thêm mới"}</h2>
                    <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>✕</button>
                </div>
                
                <div style={{padding: '24px'}}>
                    {activeTab === 'loaiphong' && (
                        <>
                            <div style={styles.formGroup}><label style={styles.label}>Mã Loại (A, B, C...):</label><input style={styles.inputModal} disabled={!!editingItem} value={form.MaLoaiPhong} onChange={e => setForm({...form, MaLoaiPhong: e.target.value.toUpperCase()})}/></div>
                            <div style={styles.formGroup}><label style={styles.label}>Tên Loại:</label><input style={styles.inputModal} value={form.TenLoaiPhong} onChange={e => setForm({...form, TenLoaiPhong: e.target.value})}/></div>
                            <div style={styles.formGroup}><label style={styles.label}>Đơn Giá (VND):</label><input type="text" style={styles.inputModal} value={formatCurrency(form.DonGia)} onChange={e => {const raw = e.target.value.replace(/,/g, ''); if(!isNaN(raw)) setForm({...form, DonGia: raw});}}/></div>
                        </>
                    )}
                    {activeTab === 'loaikhach' && (
                        <>
                            <div style={styles.formGroup}><label style={styles.label}>Mã Loại (NN, ND...):</label><input style={styles.inputModal} disabled={!!editingItem} value={form.MaLoaiKhach || ''} onChange={e => setForm({...form, MaLoaiKhach: e.target.value.toUpperCase()})}/></div>
                            <div style={styles.formGroup}><label style={styles.label}>Tên Loại:</label><input style={styles.inputModal} value={form.TenLoaiKhach || ''} onChange={e => setForm({...form, TenLoaiKhach: e.target.value})}/></div>
                            <div style={styles.formGroup}><label style={styles.label}>Hệ số phụ thu:</label><input type="number" step="0.1" style={styles.inputModal} value={form.HeSoPhuThu || ''} onChange={e => setForm({...form, HeSoPhuThu: e.target.value})}/></div>
                        </>
                    )}
                    {activeTab === 'phuthu' && (
                        <>
                            <div style={styles.formGroup}><label style={styles.label}>Khách dư thứ:</label><input type="number" style={styles.inputModal} value={form.KhachThu} onChange={e => setForm({...form, KhachThu: e.target.value})}/></div>
                            <div style={styles.formGroup}><label style={styles.label}>Tỉ lệ (VD: 0.25 = 25%):</label><input type="number" step="0.01" style={styles.inputModal} value={form.TiLePhuThu} onChange={e => setForm({...form, TiLePhuThu: e.target.value})}/></div>
                        </>
                    )}

                    <div style={{textAlign: 'right', marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                        <button style={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                        <button style={styles.btnSaveModal} onClick={handleSave}>Lưu thông tin</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ĐƯỢC CẬP NHẬT ĐẸP HƠN ---
const styles = {
  wrapper: { width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "2rem" },
  headerRow: { marginBottom: "2rem" }, 
  title: { fontSize: "2rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.5rem" }, 
  subtitle: { color: "#64748b", fontSize: "1rem" },
  
  tabContainer: { display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '25px', gap: '20px' },
  tab: { padding: '12px 10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#64748b', fontWeight: '600', transition: '0.2s', borderBottom: '3px solid transparent' },
  tabActive: { padding: '12px 10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#3b82f6', fontWeight: 'bold', borderBottom: '3px solid #3b82f6' },
  
  card: { background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)", overflow: "hidden", border: "1px solid #e2e8f0" },
  
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" },
  tableHeader: { backgroundColor: "#f8fafc", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.5px" },
  th: { padding: "16px 24px", fontWeight: 600, color: "#475569", textAlign: "left", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "16px 24px", verticalAlign: "middle", color: "#334155" },
  
  codeBadge: { fontFamily: 'monospace', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' },

  // Nút Thêm Mới
  btnAdd: { 
      padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", 
      fontWeight: 600, fontSize: "0.95rem", boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px' 
  },
  
  // Nút Sửa (Soft Blue)
  btnEdit: { 
      background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "6px 14px", borderRadius: "8px", 
      cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px' 
  },
  
  // Nút Xóa (Soft Red)
  btnDelete: { 
      background: "#fee2e2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 14px", borderRadius: "8px", 
      cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px' 
  },

  // Tham số input styles
  paramItem: { display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 0', borderBottom: '1px dashed #e2e8f0' },
  desc: { fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' },
  inputLarge: { width: '80px', padding: '10px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1.2rem', textAlign: 'center', outline: 'none', color: '#334155', fontWeight: 'bold' },
  btnSave: { padding: "12px 30px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)' },

  // Modal Styles
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999, backdropFilter: 'blur(2px)' },
  modal: { width: "100%", maxWidth: "500px", background: "white", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", overflow: 'hidden' },
  modalHeader: { padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' },
  
  formGroup: { marginBottom: '20px' }, 
  label: { display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: '#334155' },
  inputModal: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '1rem', transition: 'border 0.2s' },
  
  btnSaveModal: { padding: "10px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer" },
  btnCancel: { padding: "10px 24px", background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" },
};

export default Settings;