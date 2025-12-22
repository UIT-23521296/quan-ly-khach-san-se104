import React, { useState } from "react";
import api from "../services/api";

const ReportManagement = () => {
  const [reportType, setReportType] = useState("month"); // 'month' hoặc 'year'
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isViewSaved, setIsViewSaved] = useState(false);
  const [savedCreatedAt, setSavedCreatedAt] = useState(null);

  const handleCreateReport = async () => {
    setLoading(true);
    try {
      let url = `/baocao/doanhthu?nam=${year}`;
      if (reportType === 'month') {
          url += `&thang=${month}`;
      }

      const res = await api.get(url);
      const data = res.data;
      const total = data.reduce((sum, item) => sum + Number(item.DoanhThu), 0);
      
      setTotalRevenue(total);
      setReportData(data);
      
      // Reset trạng thái về chế độ xem Live
      setIsViewSaved(false);
      setSavedCreatedAt(null); 

    } catch (err) {
      alert("Lỗi lập báo cáo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LƯU DB ---
  const handleSaveToDB = async () => {
    if (!reportData || reportData.length === 0) {
        alert("⚠️ Chưa có dữ liệu để lưu!");
        return;
    }
    if (!window.confirm("Bạn có chắc muốn lưu báo cáo này vào hệ thống?")) return;

    setLoading(true);
    try {
        // Gửi request lưu
        await api.post("/baocao/save", {
            thang: reportType === 'month' ? month : 'ALL',
            nam: year
        });
        alert("✅ Lưu báo cáo thành công!");
    } catch (err) {
        alert("❌ Lỗi: " + (err.response?.data?.message || "Không thể lưu báo cáo"));
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
      const confirmMsg = `⚠️ CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn báo cáo ${reportType === 'month' ? `Tháng ${month}` : 'Năm'} ${year}?\nHành động này không thể hoàn tác!`;
      if (!window.confirm(confirmMsg)) return;

      setLoading(true);
      try {
          let url = `/baocao/delete?nam=${year}`;
          if (reportType === 'month') url += `&thang=${month}`;

          await api.delete(url);
          
          alert("✅ Đã xóa báo cáo!");
          
          // Sau khi xóa xong, reset về màn hình trắng hoặc tự động load lại bản tạm tính
          setReportData(null);
          setTotalRevenue(0);
          setIsViewSaved(false); // Thoát chế độ xem đã lưu
          setSavedCreatedAt(null);

      } catch (err) {
          alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
      } finally {
          setLoading(false);
      }
  };

  // --- XEM BÁO CÁO ĐÃ LƯU ---
  const handleViewSaved = async () => {
    setLoading(true);
    try {
        let url = `/baocao/saved?nam=${year}`;
        if (reportType === 'month') {
            url += `&thang=${month}`;
        }

        const res = await api.get(url);
        const data = res.data;

        if (data.length === 0) {
            alert(`⚠️ Chưa có báo cáo nào được lưu cho ${reportType === 'month' ? `tháng ${month}` : 'năm'} ${year}.`);
            setReportData(null);
            setTotalRevenue(0);
            setSavedCreatedAt(null); // Reset nếu không có dữ liệu
        } else {
            const total = data.reduce((sum, item) => sum + Number(item.DoanhThu), 0);
            setTotalRevenue(total);
            setReportData(data);
            setIsViewSaved(true);

            // --- BỔ SUNG ĐOẠN NÀY ĐỂ LẤY NGÀY LƯU ---
            if (data.length > 0) {
                setSavedCreatedAt(data[0].NgayTao); 
            }
            // ----------------------------------------

            alert("✅ Đã tải dữ liệu từ báo cáo đã lưu.");
        }
    } catch (err) {
        alert("❌ Lỗi: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // ✅ HÀM TÍNH TOÁN DÒNG CHỮ NGÀY THÁNG (MỚI)
  const renderTimeText = () => {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const currentDay = today.getDate();

      // Format ngày dd/mm/yyyy
      const fmt = (d, m, y) => `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;

      // 1. Trường hợp theo THÁNG
      if (reportType === 'month') {
          // Nếu chọn tháng hiện tại của năm hiện tại
          if (Number(year) === currentYear && Number(month) === currentMonth) {
              return `(Tính đến ngày: ${fmt(currentDay, currentMonth, currentYear)})`;
          } 
          // Nếu chọn tháng trong quá khứ (hoặc tương lai)
          else {
              // Lấy ngày cuối cùng của tháng đó (mẹo: ngày 0 của tháng kế tiếp)
              const lastDay = new Date(year, month, 0).getDate(); 
              return `(Từ ngày 01/${month}/${year} đến ngày ${lastDay}/${month}/${year})`;
          }
      } 
      // 2. Trường hợp theo NĂM
      else {
          if (Number(year) === currentYear) {
              return `(Tính đến ngày: ${fmt(currentDay, currentMonth, currentYear)})`;
          } else {
              return `(Năm tài chính ${year})`;
          }
      }
  };

  const handlePrint = () => {
      const printContent = document.getElementById("report-print-section");
      const windowUrl = 'about:blank';
      const windowName = 'Print' + new Date().getTime();
      const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

      printWindow.document.write(`
          <html>
              <head>
                  <title>Báo Cáo Doanh Thu</title>
                  <style>
                      body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #000; padding: 10px; text-align: left; }
                      th { background-color: #f0f0f0; }
                      .text-right { text-align: right; }
                      .total-row { font-weight: bold; font-size: 1.1em; }
                      h1 { text-transform: uppercase; margin-bottom: 5px; }
                      .subtitle { font-style: italic; font-size: 14px; margin-bottom: 20px; }
                  </style>
              </head>
              <body>
                  <h1>Báo Cáo Doanh Thu</h1>
                  <p class="subtitle">
                    ${reportType === 'month' ? `Tháng ${month}` : 'Năm'} / ${year} <br/>
                    ${renderTimeText()}
                  </p>
                  ${printContent.innerHTML}
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
      <div style={styles.header}>
        <h1 style={styles.title}>📈 Báo cáo doanh thu</h1>
        <p style={styles.subtitle}>Xem doanh thu theo tháng/năm và tỷ lệ từng loại phòng</p>
      </div>

      <div style={styles.filterCard}>
        <div style={{marginBottom: '15px', display: 'flex', gap: '20px'}}>
            <label style={{cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <input type="radio" name="rptType" checked={reportType === 'month'} onChange={() => setReportType('month')}/> 
                Theo Tháng
            </label>
            <label style={{cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <input type="radio" name="rptType" checked={reportType === 'year'} onChange={() => setReportType('year')}/> 
                Theo Năm
            </label>
        </div>

        <div style={styles.filterRow}>
            {reportType === 'month' && (
                <div style={styles.formGroup}>
                    <label style={styles.label}>Tháng:</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.select}>
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                </div>
            )}

            <div style={styles.formGroup}>
                <label style={styles.label}>Năm:</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={styles.input}/>
            </div>

            <div style={{display: 'flex', gap: '10px'}}>
                {/* Nút Lập Báo Cáo (Tính toán lại từ đầu) */}
                <button 
                    onClick={() => {
                        setIsViewSaved(false); // Reset về chế độ Live
                        handleCreateReport();
                    }} 
                    style={styles.reportBtn} 
                    disabled={loading}
                >
                    {loading ? "⏳..." : "⚡ Lập báo cáo mới"}
                </button>

                {/* --- NÚT MỚI: XEM ĐÃ LƯU --- */}
                <button 
                    onClick={handleViewSaved} 
                    style={styles.viewSavedBtn} 
                    disabled={loading}
                    title="Xem lại báo cáo đã lưu trong Database"
                >
                    📂 Xem đã lưu
                </button>
            </div>
        </div>
      </div>

      {reportData && (
        <div style={styles.resultSection}>
            <div style={styles.reportHeader}>
                <div>
                    <h3 style={{margin: 0, color: '#1e293b', textTransform: 'uppercase'}}>
                        {/* Thêm label để biết đang xem loại nào */}
                        {isViewSaved ? "(BẢN ĐÃ LƯU) " : "(BẢN TẠM TÍNH) "} 
                        KẾT QUẢ: {reportType === 'month' ? `THÁNG ${month}` : 'CẢ NĂM'} / {year}
                    </h3>
                    <span style={{fontSize: '14px', color: '#64748b', fontStyle: 'italic', marginTop: '5px', display: 'block'}}>
                        {renderTimeText()}
                    </span>
                </div>
                
                <div style={{display: 'flex', gap: '10px'}}>
                    {/* Chỉ hiện nút Lưu nếu đang xem bản Tạm tính (Live) */}
                    {!isViewSaved && (
                        <button style={styles.saveBtn} onClick={handleSaveToDB}>
                            💾 Lưu Báo Cáo
                        </button>
                    )}

                    {/* 2. Nếu đang xem Saved -> Hiện nút Xóa */}
                    {isViewSaved && (
                        <button style={styles.deleteBtn} onClick={handleDeleteReport} disabled={loading}>
                            🗑️ Xóa Báo Cáo
                        </button>
                    )}
                    
                    <button style={styles.printBtn} onClick={handlePrint}>🖨️ In Báo Cáo</button>
                </div>
            </div>

            <div style={styles.tableCard} id="report-print-section">
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeader}>
                            <th style={styles.th}>STT</th>
                            <th style={styles.th}>Loại Phòng</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Doanh Thu</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Tỷ Lệ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, index) => {
                            const percent = totalRevenue > 0 
                                ? ((item.DoanhThu / totalRevenue) * 100).toFixed(2) 
                                : 0;
                            
                            return (
                                <tr key={index} style={{...styles.tr, background: index % 2 === 0 ? "#fff" : "#f8fafc"}}>
                                    <td style={styles.td}>{index + 1}</td>
                                    <td style={{...styles.td, fontWeight: '600', color: '#334155'}}>
                                        {item.TenLoaiPhong}
                                    </td>
                                    <td style={{...styles.td, textAlign: 'right', color: '#2563eb', fontWeight: 'bold'}}>
                                        {Number(item.DoanhThu).toLocaleString()} đ
                                    </td>
                                    <td style={{...styles.td, textAlign: 'right'}}>
                                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px'}}>
                                            <span>{percent}%</span>
                                            <div style={{width: '50px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden'}}>
                                                <div style={{width: `${percent}%`, height: '100%', background: '#10b981'}}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        
                        <tr style={{borderTop: '2px solid #334155', background: '#f1f5f9'}} className="total-row">
                            <td colSpan={2} style={{padding: '16px 24px', fontWeight: 'bold', fontSize: '16px'}}>TỔNG CỘNG</td>
                            <td style={{padding: '16px 24px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: '#dc2626'}}>
                                {totalRevenue.toLocaleString()} đ
                            </td>
                            <td style={{padding: '16px 24px', textAlign: 'right', fontWeight: 'bold'}}>100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { padding: "2rem 3rem", background: "#F5F8FF", minHeight: "100vh" },
  header: { marginBottom: "2rem" },
  title: { fontSize: "2rem", fontWeight: "700", color: "#1F2A40", margin: 0 },
  subtitle: { color: "#64748b", marginTop: "5px" },
  filterCard: { background: "white", padding: "20px 30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "30px", border: '1px solid #e2e8f0' },
  filterRow: { display: "flex", gap: "20px", alignItems: "flex-end" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "600", color: "#334155" },
  select: { padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", minWidth: "150px", outline: "none" },
  input: { padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", width: "100px", outline: "none" },
  reportBtn: { padding: "10px 24px", background: "#3A7DFF", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 6px rgba(58, 125, 255, 0.3)", height: "42px" },
  printBtn: { padding: "8px 16px", background: "#fff", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '5px' },
  resultSection: { animation: "fadeIn 0.5s ease-in-out" },
  reportHeader: { marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
  tableCard: { background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#718096" },
  th: { padding: "16px 24px", textAlign: "left", color: "#fff", fontWeight: "600", textTransform: "uppercase", fontSize: "13px", letterSpacing: "0.5px" },
  td: { padding: "16px 24px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontSize: "15px" },
  tr: { transition: "0.2s" },
  saveBtn: { 
      padding: "8px 16px", 
      background: "#10b981", // Màu xanh lá
      color: "white", 
      border: "none", 
      borderRadius: "6px", 
      fontSize: "14px", 
      fontWeight: "600", 
      cursor: "pointer", 
      display: 'flex', 
      alignItems: 'center', 
      gap: '5px',
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  viewSavedBtn: { 
      padding: "10px 24px", 
      background: "#fff", 
      color: "#4f46e5", // Màu tím/xanh đậm khác biệt chút
      border: "1px solid #c7d2fe", 
      borderRadius: "8px", 
      fontSize: "15px", 
      fontWeight: "600", 
      cursor: "pointer", 
      height: "42px",
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
  },
  deleteBtn: {
      padding: "8px 16px",
      background: "#fee2e2", // Đỏ nhạt
      color: "#dc2626",      // Chữ đỏ đậm
      border: "1px solid #fecaca",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
  },
};

export default ReportManagement;