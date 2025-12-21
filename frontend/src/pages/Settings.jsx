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

  const parseCurrency = (value) => {
      return value.replace(/,/g, ''); 
  };

  const handleToggleStatus = async (item, type) => {
      const newStatus = item.DangSuDung ? 0 : 1;
      const actionName = newStatus ? "Kích hoạt" : "Ngưng áp dụng";
      if(!window.confirm(`Bạn muốn ${actionName} mục này?`)) return;
      
      try {
          if (type === 'loaiphong') await api.put(`/quidinh/loaiphong/${item.MaLoaiPhong}`, { tenLoai: item.TenLoaiPhong, donGia: item.DonGia, dangSuDung: newStatus });
          if (type === 'loaikhach') await api.put(`/quidinh/loaikhach/${item.MaLoaiKhach}`, { tenLoai: item.TenLoaiKhach, heSo: item.HeSoPhuThu, dangSuDung: newStatus });
          if (type === 'phuthu') await api.post(`/quidinh/phuthu`, { khachThu: item.KhachThu, tiLe: item.TiLePhuThu, dangSuDung: newStatus });
          
          alert(`✅ Đã ${actionName} thành công!`); fetchData();
      } catch (err) { alert("Lỗi: " + err.message); }
  };

  const handleDelete = async (id, type) => {
      if(!window.confirm("⚠️ Dữ liệu này chưa được sử dụng. Bạn có chắc chắn muốn XÓA VĨNH VIỄN?")) return;
      try { await api.delete(`/quidinh/${type}/${id}`); alert("✅ Đã xóa thành công!"); fetchData(); } 
      catch (err) { alert("Lỗi: " + err.message); }
  };

  const handleSave = async () => {
      try {
          // Lưu ý: Luôn giữ nguyên trạng thái cũ (editingItem.DangSuDung) hoặc mặc định là 1 nếu thêm mới
          const currentStatus = editingItem ? editingItem.DangSuDung : 1;

          if (activeTab === 'loaiphong') {
              const payload = { maLoai: form.MaLoaiPhong, tenLoai: form.TenLoaiPhong, donGia: parseCurrency(form.DonGia.toString()), dangSuDung: currentStatus };
              if (editingItem) await api.put(`/quidinh/loaiphong/${editingItem.MaLoaiPhong}`, payload);
              else await api.post(`/quidinh/loaiphong`, payload);
          } else if (activeTab === 'loaikhach') {
              const payload = { maLoai: form.MaLoaiKhach, tenLoai: form.TenLoaiKhach, heSo: form.HeSoPhuThu, dangSuDung: currentStatus };
              if (editingItem) await api.put(`/quidinh/loaikhach/${editingItem.MaLoaiKhach}`, payload);
              else await api.post(`/quidinh/loaikhach`, payload);
          } else if (activeTab === 'phuthu') {
              await api.post(`/quidinh/phuthu`, { khachThu: form.KhachThu, tiLe: form.TiLePhuThu, dangSuDung: currentStatus });
          }
          alert("✅ Lưu dữ liệu thành công!"); setIsModalOpen(false); fetchData();
      } catch (err) { alert("❌ Lỗi: " + (err.response?.data?.message || err.message)); }
  };

  const handleSaveThamSo = async () => {
      try { await api.put(`/quidinh/thamso`, thamSo); alert("✅ Đã cập nhật tham số hệ thống!"); } catch (err) { alert("Lỗi cập nhật tham số"); }
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

  const renderActions = (item, id, type) => {
      const isStopped = item.DangSuDung === 0;
      const hasData = item.CoDuLieu > 0;
      
      if (isStopped) {
          return <button style={styles.btnActivate} onClick={() => handleToggleStatus(item, type)}>🔄 Kích hoạt</button>;
      }
      return (
          <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
              <button style={styles.btnEdit} onClick={() => openModal(item)}>Sửa</button>
              {hasData ? 
                  <button style={styles.btnStop} onClick={() => handleToggleStatus(item, type)}>⛔ Ngưng KD</button> : 
                  <button style={styles.btnDelete} onClick={() => handleDelete(id, type)}>Xóa</button>
              }
          </div>
      );
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div><h1 style={styles.title}>Cấu hình quy định</h1><p style={styles.subtitle}>Quản lý các danh mục loại phòng, loại khách và tham số hệ thống.</p></div>
      </div>
      
      <div style={styles.tabContainer}>
          <button style={activeTab === 'loaiphong' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('loaiphong')}>Loại Phòng</button>
          <button style={activeTab === 'loaikhach' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('loaikhach')}>Loại Khách</button>
          <button style={activeTab === 'phuthu' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('phuthu')}>Phụ Thu</button>
          <button style={activeTab === 'thamso' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('thamso')}>Tham Số</button>
      </div>

      <div style={styles.content}>
        {activeTab === 'loaiphong' && (
            <div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '15px'}}><button style={styles.btnAdd} onClick={() => openModal(null)}>+ Thêm Loại Phòng</button></div>
                <div style={styles.card}>
                    <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Mã Loại</th><th style={styles.th}>Tên Loại Phòng</th><th style={{...styles.th, textAlign: 'right'}}>Đơn Giá</th><th style={{...styles.th, textAlign: 'center'}}>Trạng Thái</th><th style={{...styles.th, textAlign: 'center'}}>Hành động</th></tr></thead>
                        <tbody>
                            {loaiPhongs.map(item => (
                                <tr key={item.MaLoaiPhong} style={{borderBottom: '1px solid #eee', background: item.DangSuDung ? 'white' : '#f9fafb', opacity: item.DangSuDung ? 1 : 0.7}}>
                                    <td style={styles.td}><strong>{item.MaLoaiPhong}</strong></td><td style={styles.td}>{item.TenLoaiPhong}</td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#2563eb'}}>{formatCurrency(item.DonGia)} VND</td>
                                    <td style={{...styles.td, textAlign: 'center'}}><span style={item.DangSuDung ? styles.badgeActive : styles.badgeInactive}>{item.DangSuDung ? 'Đang dùng' : 'Ngưng dùng'}</span></td>
                                    <td style={{...styles.td, textAlign: 'center'}}>{renderActions(item, item.MaLoaiPhong, 'loaiphong')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'loaikhach' && (
            <div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '15px'}}><button style={styles.btnAdd} onClick={() => openModal(null)}>+ Thêm Loại Khách</button></div>
                <div style={styles.card}>
                    <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Mã Loại</th><th style={styles.th}>Tên Loại Khách</th><th style={{...styles.th, textAlign: 'right'}}>Hệ Số Phụ Thu</th><th style={{...styles.th, textAlign: 'center'}}>Trạng Thái</th><th style={{...styles.th, textAlign: 'center'}}>Hành động</th></tr></thead>
                        <tbody>
                            {loaiKhachs.map(item => (
                                <tr key={item.MaLoaiKhach} style={{borderBottom: '1px solid #eee', background: item.DangSuDung ? 'white' : '#f9fafb', opacity: item.DangSuDung ? 1 : 0.7}}>
                                    <td style={styles.td}><strong>{item.MaLoaiKhach}</strong></td><td style={styles.td}>{item.TenLoaiKhach}</td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>x {item.HeSoPhuThu}</td>
                                    <td style={{...styles.td, textAlign: 'center'}}><span style={item.DangSuDung ? styles.badgeActive : styles.badgeInactive}>{item.DangSuDung ? 'Đang dùng' : 'Ngưng dùng'}</span></td>
                                    <td style={{...styles.td, textAlign: 'center'}}>{renderActions(item, item.MaLoaiKhach, 'loaikhach')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'phuthu' && (
            <div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '15px'}}><button style={styles.btnAdd} onClick={() => openModal(null)}>+ Thêm Mốc Phụ Thu</button></div>
                <div style={styles.card}>
                    <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Khách Dư Thứ...</th><th style={{...styles.th, textAlign: 'right'}}>Tỉ Lệ Phụ Thu</th><th style={{...styles.th, textAlign: 'center'}}>Trạng Thái</th><th style={{...styles.th, textAlign: 'center'}}>Hành động</th></tr></thead>
                        <tbody>
                            {phuThus.map(item => (
                                <tr key={item.KhachThu} style={{borderBottom: '1px solid #eee', background: item.DangSuDung ? 'white' : '#f9fafb', opacity: item.DangSuDung ? 1 : 0.7}}>
                                    <td style={styles.td}><strong>Khách thứ {item.KhachThu}</strong></td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#d97706'}}>{item.TiLePhuThu * 100}%</td>
                                    <td style={{...styles.td, textAlign: 'center'}}><span style={item.DangSuDung ? styles.badgeActive : styles.badgeInactive}>{item.DangSuDung ? 'Đang dùng' : 'Ngưng dùng'}</span></td>
                                    <td style={{...styles.td, textAlign: 'center'}}>{renderActions(item, item.KhachThu, 'phuthu')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'thamso' && (
            <div style={styles.card}>
                <div style={{padding: '40px', maxWidth: '600px', margin: '0 auto'}}>
                    <h3 style={{fontSize: '1.2rem', marginBottom: '20px', color: '#374151'}}>Quy định chung</h3>
                    <div style={styles.formGroup}><label style={styles.label}>Số khách tối đa trong 1 phòng:</label><input type="number" style={styles.inputLarge} value={thamSo.SoKhachToiDa} onChange={e => setThamSo({...thamSo, SoKhachToiDa: e.target.value})}/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Số khách tiêu chuẩn (không tính phụ thu):</label><input type="number" style={styles.inputLarge} value={thamSo.SoKhachKhongTinhPhuThu} onChange={e => setThamSo({...thamSo, SoKhachKhongTinhPhuThu: e.target.value})}/></div>
                    <div style={{textAlign: 'right', marginTop: '30px'}}><button style={styles.btnSave} onClick={handleSaveThamSo}>💾 Lưu Thay Đổi</button></div>
                </div>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <h2 style={{marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px', fontSize: '1.5rem', color: '#111827'}}>{editingItem ? "Cập nhật thông tin" : "Thêm mới"}</h2>
                
                {activeTab === 'loaiphong' && (
                    <div style={{marginTop: '20px'}}>
                        <div style={styles.formGroup}><label style={styles.label}>Mã Loại (A, B, C...):</label><input style={styles.inputModal} disabled={editingItem} value={form.MaLoaiPhong} onChange={e => setForm({...form, MaLoaiPhong: e.target.value.toUpperCase()})}/></div>
                        <div style={styles.formGroup}><label style={styles.label}>Tên Loại:</label><input style={styles.inputModal} value={form.TenLoaiPhong} onChange={e => setForm({...form, TenLoaiPhong: e.target.value})}/></div>
                        <div style={styles.formGroup}><label style={styles.label}>Đơn Giá (VND):</label><input type="text" style={styles.inputModal} value={formatCurrency(form.DonGia)} onChange={e => {const raw = e.target.value.replace(/,/g, ''); if(!isNaN(raw)) setForm({...form, DonGia: raw});}}/></div>
                    </div>
                )}
                {activeTab === 'loaikhach' && (
                    <div style={{marginTop: '20px'}}>
                        <div style={styles.formGroup}><label style={styles.label}>Mã Loại (NN, ND...):</label><input style={styles.inputModal} disabled={editingItem} value={form.MaLoaiKhach || ''} onChange={e => setForm({...form, MaLoaiKhach: e.target.value.toUpperCase()})}/></div>
                        <div style={styles.formGroup}><label style={styles.label}>Tên Loại:</label><input style={styles.inputModal} value={form.TenLoaiKhach || ''} onChange={e => setForm({...form, TenLoaiKhach: e.target.value})}/></div>
                        <div style={styles.formGroup}><label style={styles.label}>Hệ số phụ thu:</label><input type="number" step="0.1" style={styles.inputModal} value={form.HeSoPhuThu || ''} onChange={e => setForm({...form, HeSoPhuThu: e.target.value})}/></div>
                    </div>
                )}
                {activeTab === 'phuthu' && (
                    <div style={{marginTop: '20px'}}>
                        <div style={styles.formGroup}><label style={styles.label}>Khách dư thứ:</label><input type="number" style={styles.inputModal} value={form.KhachThu} onChange={e => setForm({...form, KhachThu: e.target.value})}/></div>
                        <div style={styles.formGroup}><label style={styles.label}>Tỉ lệ (VD: 0.25 = 25%):</label><input type="number" step="0.01" style={styles.inputModal} value={form.TiLePhuThu} onChange={e => setForm({...form, TiLePhuThu: e.target.value})}/></div>
                    </div>
                )}

                {/* ĐÃ XÓA SELECT TRẠNG THÁI Ở ĐÂY */}

                <div style={{textAlign: 'right', marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: '15px'}}>
                    <button style={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                    <button style={styles.btnSaveModal} onClick={handleSave}>Lưu thông tin</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  wrapper: { width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "2rem 2rem 3rem" },
  headerRow: { marginBottom: "2rem" }, title: { fontSize: "2rem", fontWeight: 700, color: "#1F2A40", marginBottom: "0.5rem" }, subtitle: { color: "#6B7280", fontSize: "1rem" },
  tabContainer: { display: 'flex', borderBottom: '2px solid #E5E7EB', marginBottom: '25px', gap: '5px' },
  tab: { padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6B7280', fontWeight: '600', transition: '0.2s', borderBottom: '3px solid transparent' },
  tabActive: { padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#3A7DFF', fontWeight: 'bold', borderBottom: '3px solid #3A7DFF' },
  card: { background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #e5e7eb" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" },
  th: { padding: "16px 24px", backgroundColor: "#F9FAFB", borderBottom: "2px solid #E5E7EB", fontWeight: 600, color: "#374151", textAlign: "left", textTransform: "uppercase", fontSize: "0.85rem" },
  td: { padding: "16px 24px", verticalAlign: "middle", color: "#1F2937", borderBottom: "1px solid #F3F4F6" },
  btnAdd: { padding: "12px 24px", backgroundColor: "#3A7DFF", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", boxShadow: '0 4px 6px rgba(58, 125, 255, 0.3)' },
  btnEdit: { background: "#3A7DFF", color: "white", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 },
  btnDelete: { background: "#EF4444", color: "white", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 },
  btnStop: { background: "#374151", color: "white", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 },
  btnActivate: { background: "#059669", color: "white", padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: "bold" },
  btnSave: { padding: "12px 30px", background: "#3A7DFF", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer" },
  btnSaveModal: { padding: "10px 24px", background: "#3A7DFF", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer" },
  btnCancel: { padding: "10px 24px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" },
  badgeActive: { display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontWeight: 600, fontSize: "0.8rem", backgroundColor: "#D1FAE5", color: "#059669" },
  badgeInactive: { display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontWeight: 600, fontSize: "0.8rem", backgroundColor: "#F3F4F6", color: "#6B7280" },
  formGroup: { marginBottom: '20px' }, label: { display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '600', color: '#374151' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none' },
  inputLarge: { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1.1rem', outline: 'none' },
  inputModal: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 },
  modal: { width: "100%", maxWidth: "500px", background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
};

export default Settings;