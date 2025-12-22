import React, { useEffect, useState } from "react";
import api from "../services/api";

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
        setLoading(true);
        const res = await api.get("/hoadon");
        setInvoices(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleViewDetail = async (soHoaDon) => {
      try {
          const res = await api.get(`/hoadon/${soHoaDon}`);
          setSelectedInvoice(res.data);
          setIsModalOpen(true);
      } catch (err) {
          alert("Không thể tải chi tiết hóa đơn");
      }
  };

  // Hàm xử lý xóa hóa đơn
  const handleDelete = async (soHoaDon) => {
    if (!window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn hóa đơn ${soHoaDon}?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/hoadon/${soHoaDon}`); // Gọi API vừa tạo
      alert("✅ Đã xóa hóa đơn thành công!");
      fetchInvoices(); // Tải lại danh sách
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi: " + (err.response?.data?.message || "Không thể xóa hóa đơn"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ HÀM XỬ LÝ IN HÓA ĐƠN
  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-section");
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    // CSS cho trang in (Để đảm bảo in ra đẹp như hóa đơn thật)
    const printStyles = `
        <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: #000; }
            .header-print { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header-print h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .header-print p { margin: 5px 0; font-size: 14px; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 20px; font-size: 14px; }
            .info-row { margin-bottom: 5px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
            th { border-bottom: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; }
            td { border-bottom: 1px dashed #ccc; padding: 8px; }
            .text-right { text-align: right; }
            .total-row td { border-top: 2px solid #000; border-bottom: none; font-weight: bold; font-size: 16px; padding-top: 15px; }
            
            .footer-print { margin-top: 40px; text-align: center; font-size: 14px; display: flex; justify-content: space-between; padding: 0 50px; }
        </style>
    `;

    // Nội dung HTML để in
    printWindow.document.write(`
        <html>
            <head>
                <title>In Hóa Đơn ${selectedInvoice.SoHoaDon}</title>
                ${printStyles}
            </head>
            <body>
                <div class="header-print">
                    <h1>Khách Sạn SE104</h1>
                    <p>Địa chỉ: Khu phố 6, Linh Trung, Thủ Đức, TP.HCM</p>
                    <p>Hotline: 0909 123 456</p>
                </div>
                
                ${printContent.innerHTML}

                <div class="footer-print">
                    <div>
                        <p>Khách hàng</p>
                        <p style="margin-top: 40px; font-style: italic;">(Ký tên)</p>
                    </div>
                    <div>
                        <p>Người lập phiếu</p>
                        <p style="margin-top: 40px; font-style: italic;">(Ký tên)</p>
                    </div>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>🧾 Quản lý Hóa đơn & Doanh thu</h1>
      <div style={styles.tableCard}>
        {loading ? <p style={{padding: '20px'}}>⏳ Đang tải...</p> : (
        <table style={styles.table}>
            <thead>
                <tr style={styles.tableHeader}>
                    <th style={styles.th}>Số Hóa Đơn</th>
                    <th style={styles.th}>Phòng</th>
                    <th style={styles.th}>Khách hàng</th>
                    <th style={styles.th}>Liên hệ (SĐT)</th> 
                    <th style={styles.th}>Ngày lập</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Trị giá</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                {invoices.map((inv, idx) => (
                    <tr key={inv.SoHoaDon} style={{...styles.tr, background: idx % 2 === 0 ? "#f8fafc" : "#ffffff"}}>
                        <td style={styles.td}><span style={styles.badge}>{inv.SoHoaDon}</span></td>
                        <td style={styles.td}><strong>{inv.TenPhong_LuuTru || "Phòng cũ"}</strong></td>
                        <td style={styles.td}><div style={{fontWeight: '600', color: '#334155'}}>{inv.TenKhachHangCoQuan}</div></td>
                        <td style={styles.td}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span style={{fontWeight: 'bold', color: '#059669', fontSize: '15px'}}>📞 {inv.SDT || "---"}</span>
                                <span style={{fontSize: '12px', color: '#94a3b8', marginTop: '4px'}}>📍 {inv.DiaChi || "---"}</span>
                            </div>
                        </td>
                        <td style={styles.td}>{new Date(inv.NgayLap).toLocaleDateString('vi-VN')}</td>
                        <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#2563eb'}}>
                            {Number(inv.TriGia).toLocaleString()} đ
                        </td>
                        <td style={{...styles.td, textAlign: 'center'}}>
                            <button 
                                style={styles.viewBtn} 
                                onClick={() => handleViewDetail(inv.SoHoaDon)}
                                title="Xem chi tiết"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#bae6fd';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#e0f2fe';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                👁️ Xem
                            </button>

                            <button     
                                style={styles.deleteBtn} 
                                onClick={() => handleDelete(inv.SoHoaDon)}
                                title="Xóa hóa đơn"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                🗑️ Xóa
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        )}
      </div>

      {/* --- MODAL XEM CHI TIẾT --- */}
      {isModalOpen && selectedInvoice && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={{...styles.modalHeader, background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                    <h2 style={{...styles.modalTitle, color: '#1e293b', fontSize: '20px'}}>
                        📄 Chi Tiết Hóa Đơn
                    </h2>
                    <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                </div>
                
                <div style={{padding: '24px'}}>
                    
                    {/* 👇 KHU VỰC SẼ ĐƯỢC IN (Bao bọc bởi ID này) */}
                    <div id="invoice-print-section">
                        {/* Thông tin chung */}
                        <div style={{background: '#fff', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1.5fr 1fr'}}>
                            <div style={{padding: '16px', borderRight: '1px solid #e2e8f0'}}>
                                <div style={{fontSize: '13px', color: '#64748b'}}>Phòng & Loại</div>
                                <div style={{fontSize: '18px', fontWeight: 'bold', color: '#2563eb'}}>
                                    {selectedInvoice.TenPhong_LuuTru} 
                                    {selectedInvoice.TenLoaiPhong && <span style={{fontSize: '14px', color: '#475569', fontWeight: 'normal'}}> - {selectedInvoice.TenLoaiPhong}</span>}
                                </div>
                                <div style={{fontSize: '13px', color: '#64748b', marginTop: '8px'}}>Khách hàng</div>
                                <div style={{fontWeight: '600', color: '#334155'}}>{selectedInvoice.TenKhachHangCoQuan}</div>
                            </div>
                            <div style={{padding: '16px', background: '#f8fafc'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                                    <span style={{color: '#64748b', fontSize: '13px'}}>Số HĐ:</span>
                                    <strong>{selectedInvoice.SoHoaDon}</strong>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                                    <span style={{color: '#64748b', fontSize: '13px'}}>Ngày lập:</span>
                                    <strong>{new Date(selectedInvoice.NgayLap).toLocaleDateString('vi-VN')}</strong>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{color: '#64748b', fontSize: '13px'}}>Địa chỉ:</span>
                                    <span style={{textAlign: 'right', fontSize: '13px'}}>{selectedInvoice.DiaChi || '---'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bảng tính tiền */}
                        <table style={{width: '100%', marginBottom: '20px', borderCollapse: 'collapse', fontSize: '14px'}}>
                            <thead>
                                <tr style={{background: '#f1f5f9', color: '#475569', textTransform: 'uppercase', fontSize: '11px'}}>
                                    <th style={{padding: '10px', textAlign: 'left'}}>Khoản mục</th>
                                    <th style={{padding: '10px', textAlign: 'right'}}>Chi tiết</th>
                                    <th style={{padding: '10px', textAlign: 'right'}} className="text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody style={{borderTop: '1px solid #e2e8f0'}}>
                                <tr>
                                    <td style={{padding: '12px', borderBottom: '1px dashed #e2e8f0'}}>
                                        <strong>Tiền thuê phòng</strong>
                                        <div style={{fontSize: '12px', color: '#64748b'}}>Đơn giá: {Number(selectedInvoice.DonGia).toLocaleString()} đ</div>
                                    </td>
                                    <td style={{padding: '12px', textAlign: 'right', borderBottom: '1px dashed #e2e8f0'}}>
                                        {selectedInvoice.SoNgayThue} ngày
                                    </td>
                                    <td style={{padding: '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px dashed #e2e8f0'}} className="text-right">
                                        {Number(selectedInvoice.DonGia * selectedInvoice.SoNgayThue).toLocaleString()}
                                    </td>
                                </tr>
                                
                                {selectedInvoice.PhuThu > 0 && (
                                    <tr style={{color: '#d97706'}}>
                                        <td style={{padding: '12px', borderBottom: '1px dashed #e2e8f0'}}>Phụ thu quá tải ({selectedInvoice.SoKhach} khách)</td>
                                        <td style={{padding: '12px', textAlign: 'right', borderBottom: '1px dashed #e2e8f0'}}>+{selectedInvoice.PhuThu * 100}%</td>
                                        <td style={{padding: '12px', textAlign: 'right', fontStyle: 'italic', borderBottom: '1px dashed #e2e8f0'}} className="text-right">
                                            (Hệ số {1 + selectedInvoice.PhuThu})
                                        </td>
                                    </tr>
                                )}

                                {selectedInvoice.KhachNuocNgoai === 1 && (
                                    <tr style={{color: '#059669'}}>
                                        <td style={{padding: '12px', borderBottom: '1px dashed #e2e8f0'}}>Hệ số khách nước ngoài</td>
                                        <td style={{padding: '12px', textAlign: 'right', borderBottom: '1px dashed #e2e8f0'}}>x 1.5</td>
                                        <td style={{padding: '12px', textAlign: 'right', borderBottom: '1px dashed #e2e8f0'}}></td>
                                    </tr>
                                )}

                                <tr style={{borderTop: '2px solid #334155'}} className="total-row">
                                    <td style={{padding: '15px', fontWeight: 'bold', color: '#dc2626', fontSize: '16px'}} colSpan={2}>TỔNG TIỀN</td>
                                    <td style={{padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626', fontSize: '18px'}} className="text-right">
                                        {Number(selectedInvoice.TriGia).toLocaleString()} VND
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* ☝️ KẾT THÚC KHU VỰC IN */}

                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                        <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Đóng</button>
                        
                        {/* 👇 NÚT IN MỚI THÊM */}
                        <button style={styles.printBtn} onClick={handlePrint}>
                            🖨️ In Hóa Đơn
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { padding: "2rem 3rem", background: "#F5F8FF", minHeight: "100vh" },
  title: { fontSize: "2rem", fontWeight: "700", color: "#1F2A40", marginBottom: "2rem" },
  tableCard: { background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#718096" },
  th: { padding: "16px 24px", textAlign: "left", color: "#fff", fontWeight: "600", fontSize: "14px", textTransform: 'uppercase', letterSpacing: "0.5px" },
  td: { padding: "16px 24px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontSize: "14px" },
  tr: { transition: "0.2s" },
  badge: { background: "#e2e8f0", padding: "4px 8px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" },
  
  viewBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      background: '#e0f2fe', 
      color: '#0284c7', 
      border: '1px solid #bae6fd', 
      borderRadius: '8px', 
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '700',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },

  deleteBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      background: '#fee2e2',  // Màu đỏ nhạt
      color: '#ef4444',       // Chữ đỏ đậm
      border: '1px solid #fecaca', 
      borderRadius: '8px', 
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '700',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginLeft: '10px',
  },
  
  // Style cho nút IN
  printBtn: {
      padding: "10px 24px",
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: "600",
      boxShadow: "0 4px 6px rgba(59, 130, 246, 0.4)"
  },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modal: { background: "#fff", borderRadius: 20, width: "90%", maxWidth: 650, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  modalHeader: { display: "flex", justifyContent: "space-between", padding: "20px 24px", alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: 24, fontWeight: 700 },
  closeBtn: { background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: '#64748b' },
  cancelBtn: { padding: "10px 24px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: 'pointer', fontWeight: '600' },
};

export default InvoiceManagement;