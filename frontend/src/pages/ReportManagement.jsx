import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { Navigate } from "react-router-dom";

const ReportManagement = () => {
  // ✅ CHẶN USER NGAY TRÊN ĐẦU (trước mọi hook)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user?.vaiTro !== "Admin") return <Navigate to="/" replace />;

  const [activeTab, setActiveTab] = useState("create"); // 'create' | 'saved'

  // --- STATE TAB 1: LẬP BÁO CÁO (CREATE) ---
  const [reportType, setReportType] = useState("month");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [liveData, setLiveData] = useState(null);
  const [liveTotal, setLiveTotal] = useState(0);

  // --- STATE TAB 2: QUẢN LÝ ĐÃ LƯU (SAVED) ---
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailTotal, setDetailTotal] = useState(0);

  // --- BỘ LỌC CHO DANH SÁCH LỊCH SỬ ---
  const [filterType, setFilterType] = useState("month"); // 'month' | 'year'
  const [filterSavedMonth, setFilterSavedMonth] = useState("ALL");
  const [filterSavedYear, setFilterSavedYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);

  // --- HELPER: HIỂN THỊ THỜI GIAN THÔNG MINH ---
  const renderTimeText = (rptMonth, rptYear) => {
    if (!rptMonth || rptMonth === "ALL") return `(Số liệu cả năm tài chính ${rptYear})`;

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const m = Number(rptMonth);
    const y = Number(rptYear);
    const fmt = (d) => String(d).padStart(2, "0");

    if (m === currentMonth && y === currentYear) {
      const currentDay = today.getDate();
      return `(Số liệu tính đến ngày: ${fmt(currentDay)}/${fmt(m)}/${y})`;
    }

    const lastDay = new Date(y, m, 0).getDate();
    return `(Từ ngày 01/${fmt(m)}/${y} đến ngày ${lastDay}/${fmt(m)}/${y})`;
  };

  // --- CHỨC NĂNG IN ẤN ---
  const handlePrint = (title, timeText, data, total) => {
    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) {
      alert("Trình duyệt đã chặn cửa sổ in. Hãy cho phép pop-up để in báo cáo.");
      return;
    }

    const safeData = Array.isArray(data) ? data : [];

    const htmlContent = `
      <html>
        <head>
          <title>In Báo Cáo</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; text-transform: uppercase; font-size: 24px; }
            .header p { margin: 5px 0; font-style: italic; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: center; font-size: 14px; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; padding-right: 15px; }
            .text-left { text-align: left; padding-left: 15px; }
            .total-row { font-weight: bold; font-size: 16px; background-color: #fafafa; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>${timeText}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%">STT</th>
                <th style="width: 40%">Loại Phòng</th>
                <th style="width: 30%">Doanh Thu</th>
                <th style="width: 20%">Tỷ Lệ</th>
              </tr>
            </thead>
            <tbody>
              ${safeData
                .map((item, index) => {
                  const doanhThu = Number(item?.DoanhThu || 0);
                  const percent = total > 0 ? ((doanhThu / total) * 100).toFixed(2) : 0;
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="text-left">${item?.TenLoaiPhong || item?.MaLoaiPhong || ""}</td>
                      <td class="text-right">${doanhThu.toLocaleString("vi-VN")} đ</td>
                      <td>${percent}%</td>
                    </tr>
                  `;
                })
                .join("")}
              <tr class="total-row">
                <td colspan="2">TỔNG CỘNG</td>
                <td class="text-right">${Number(total || 0).toLocaleString("vi-VN")} đ</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
             <div style="width: 40%">
                <p>Người lập biểu</p>
                <p style="margin-top: 60px; font-style: italic;">(Ký và ghi rõ họ tên)</p>
             </div>
             <div style="width: 40%">
                <p>Ngày ...... tháng ...... năm ......</p>
                <p>Giám đốc</p>
                <p style="margin-top: 60px; font-style: italic;">(Ký và đóng dấu)</p>
             </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // --- API HANDLERS (TAB 1: CREATE) ---
  const handlePreview = async () => {
    setLoading(true);
    try {
      const y = Number(year);
      const m = Number(month);

      let url = `/baocao/doanhthu?nam=${y}`;
      if (reportType === "month") url += `&thang=${m}`;

      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : [];

      setLiveTotal(data.reduce((sum, item) => sum + Number(item?.DoanhThu || 0), 0));
      setLiveData(data);
    } catch (err) {
      alert("Lỗi: " + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedReports = useCallback(async () => {
    try {
      const y = Number(filterSavedYear);

      let url = `/baocao/list?nam=${y}`;
      if (filterType === "year") {
        url += `&type=year`;
      } else {
        url += `&type=month`;
        if (filterSavedMonth !== "ALL") url += `&thang=${Number(filterSavedMonth)}`;
      }

      const res = await api.get(url);
      setSavedReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, [filterSavedYear, filterSavedMonth, filterType]);

  const handleSave = async () => {
    if (!liveData) return;
    if (!window.confirm("Lưu báo cáo này lại?")) return;

    try {
      const payload = {
        thang: reportType === "month" ? Number(month) : "ALL",
        nam: Number(year),
      };
      await api.post("/baocao/save", payload);

      alert("✅ Lưu thành công!");
      setLiveData(null);
      setLiveTotal(0);

      // nếu đang ở tab saved thì refresh
      fetchSavedReports();
    } catch (err) {
      alert("Lỗi lưu: " + (err?.response?.data?.message || err.message));
    }
  };

  // Tự động tải lại khi đổi Tab hoặc đổi bộ lọc
  useEffect(() => {
    if (activeTab === "saved") fetchSavedReports();
  }, [activeTab, fetchSavedReports]);

  const handleViewDetail = async (report) => {
    setLoading(true);
    try {
      const res = await api.get(`/baocao/detail/${report.MaBaoCao}`);
      const data = Array.isArray(res.data) ? res.data : [];

      setDetailData(data);
      setDetailTotal(data.reduce((sum, item) => sum + Number(item?.DoanhThu || 0), 0));
      setSelectedReport(report);
    } catch (err) {
      alert("Lỗi tải chi tiết: " + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa vĩnh viễn báo cáo này?")) return;

    try {
      await api.delete(`/baocao/${id}`);
      alert("✅ Đã xóa!");
      fetchSavedReports();

      if (selectedReport?.MaBaoCao === id) {
        setSelectedReport(null);
        setDetailData(null);
        setDetailTotal(0);
      }
    } catch (err) {
      alert("Lỗi xóa: " + (err?.response?.data?.message || err.message));
    }
  };

  // --- RENDER BẢNG DỮ LIỆU ---
  const renderTable = (data, total) => (
    <div style={styles.tableCard}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>STT</th>
            <th style={styles.th}>Loại Phòng</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Doanh Thu</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Tỷ Lệ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const doanhThu = Number(item?.DoanhThu || 0);
            const percent = total > 0 ? ((doanhThu / total) * 100).toFixed(2) : 0;
            return (
              <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={styles.td}>{index + 1}</td>
                <td style={{ ...styles.td, fontWeight: "600" }}>
                  {item.TenLoaiPhong || item.MaLoaiPhong}
                </td>
                <td style={{ ...styles.td, textAlign: "right", color: "#2563eb", fontWeight: "bold" }}>
                  {doanhThu.toLocaleString("vi-VN")} đ
                </td>
                <td style={{ ...styles.td, textAlign: "right" }}>{percent}%</td>
              </tr>
            );
          })}
          <tr style={{ background: "#f8fafc", borderTop: "2px solid #334155" }}>
            <td colSpan={2} style={{ padding: "15px", fontWeight: "bold" }}>
              TỔNG CỘNG
            </td>
            <td
              style={{
                padding: "15px",
                textAlign: "right",
                fontWeight: "bold",
                color: "#dc2626",
                fontSize: "18px",
              }}
            >
              {Number(total || 0).toLocaleString("vi-VN")} đ
            </td>
            <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold" }}>100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>📈 Báo cáo doanh thu</h1>

      {/* TABS */}
      <div style={styles.tabContainer}>
        <button
          style={activeTab === "create" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("create")}
        >
          📝 Lập báo cáo mới
        </button>
        <button
          style={activeTab === "saved" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("saved")}
        >
          📂 Danh sách đã lưu
        </button>
      </div>

      {/* --- CONTENT TAB 1: LẬP BÁO CÁO --- */}
      {activeTab === "create" && (
        <div style={{ animation: "fadeIn 0.3s" }}>
          <div style={styles.filterCard}>
            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={reportType === "month"}
                  onChange={() => setReportType("month")}
                />{" "}
                Theo Tháng
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={reportType === "year"}
                  onChange={() => setReportType("year")}
                />{" "}
                Theo Năm
              </label>
            </div>

            <div style={styles.filterRow}>
              {reportType === "month" && (
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  style={styles.select}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={styles.input}
                placeholder="Năm"
              />

              <button onClick={handlePreview} style={styles.btnPrimary} disabled={loading}>
                {loading ? "..." : "Xem trước"}
              </button>
            </div>
          </div>

          {liveData && (
            <div>
              <div style={styles.resultHeader}>
                <div>
                  <h3 style={{ margin: 0, color: "#1e293b" }}>KẾT QUẢ TẠM TÍNH</h3>
                  <p style={styles.timeText}>
                    {renderTimeText(reportType === "month" ? month : "ALL", year)}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() =>
                      handlePrint(
                        `Báo cáo doanh thu (Tạm tính)`,
                        renderTimeText(reportType === "month" ? month : "ALL", year),
                        liveData,
                        liveTotal
                      )
                    }
                    style={styles.btnPrint}
                  >
                    🖨️ In Báo Cáo
                  </button>

                  <button onClick={handleSave} style={styles.btnSuccess}>
                    💾 Lưu vào hệ thống
                  </button>
                </div>
              </div>

              {renderTable(liveData, liveTotal)}
            </div>
          )}
        </div>
      )}

      {/* --- CONTENT TAB 2: DANH SÁCH ĐÃ LƯU --- */}
      {activeTab === "saved" && (
        <div style={{ display: "flex", gap: "20px", animation: "fadeIn 0.3s" }}>
          {/* SIDEBAR: BỘ LỌC + DANH SÁCH */}
          <div
            style={{
              width: "350px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "15px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: "bold", color: "#334155", marginBottom: "10px" }}>
                Lịch sử báo cáo
              </div>

              <div style={{ display: "flex", gap: "15px", marginBottom: "10px", fontSize: "13px" }}>
                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <input type="radio" checked={filterType === "month"} onChange={() => setFilterType("month")} /> Theo Tháng
                </label>
                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <input type="radio" checked={filterType === "year"} onChange={() => setFilterType("year")} /> Theo Năm
                </label>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {filterType === "month" && (
                  <select
                    value={filterSavedMonth}
                    onChange={(e) => setFilterSavedMonth(e.target.value)}
                    style={{ ...styles.selectSmall, flex: 1 }}
                  >
                    <option value="ALL">Tất cả tháng</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="number"
                  value={filterSavedYear}
                  onChange={(e) => setFilterSavedYear(Number(e.target.value))}
                  placeholder="Năm"
                  style={{
                    ...styles.inputSmall,
                    flex: filterType === "year" ? 1 : "unset",
                    width: filterType === "year" ? "100%" : "80px",
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {savedReports.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                  Không tìm thấy báo cáo nào.
                </div>
              ) : (
                savedReports.map((rpt) => (
                  <div
                    key={rpt.MaBaoCao}
                    onClick={() => handleViewDetail(rpt)}
                    style={{
                      padding: "15px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      background: selectedReport?.MaBaoCao === rpt.MaBaoCao ? "#eff6ff" : "white",
                      transition: "0.2s",
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "6px", fontSize: "14px" }}>
                      {rpt.TenBaoCao}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                          📅 {new Date(rpt.NgayTao).toLocaleDateString("vi-VN")}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic", marginTop: "2px" }}>
                          ⏰ Lập lúc:{" "}
                          {new Date(rpt.NgayTao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>

                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(rpt.MaBaoCao);
                        }}
                        style={styles.deleteIcon}
                        title="Xóa báo cáo này"
                      >
                        ✕ Xóa
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MAIN: CHI TIẾT BÁO CÁO */}
          <div style={{ flex: 1 }}>
            {selectedReport && detailData ? (
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                <div style={styles.resultHeader}>
                  <div>
                    <h2 style={{ margin: "0 0 5px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                      {selectedReport.TenBaoCao}
                    </h2>
                    <p style={styles.timeText}>{renderTimeText(selectedReport.Thang, selectedReport.Nam)}</p>
                  </div>

                  <button
                    onClick={() =>
                      handlePrint(
                        selectedReport.TenBaoCao,
                        renderTimeText(selectedReport.Thang, selectedReport.Nam),
                        detailData,
                        detailTotal
                      )
                    }
                    style={styles.btnPrint}
                  >
                    🖨️ In Báo Cáo
                  </button>
                </div>

                {loading ? <p>⏳ Đang tải...</p> : renderTable(detailData, detailTotal)}
              </div>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  border: "2px dashed #e2e8f0",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                Chọn một báo cáo bên trái để xem chi tiết
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- CSS STYLES ---
const styles = {
  wrapper: { padding: "2rem 3rem", background: "#F5F8FF", minHeight: "100vh" },
  title: { fontSize: "2rem", fontWeight: "700", color: "#1F2A40", marginBottom: "1.5rem" },

  tabContainer: { display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #e2e8f0" },
  tab: { padding: "10px 20px", border: "none", background: "transparent", cursor: "pointer", color: "#64748b", fontWeight: "600", fontSize: "15px" },
  tabActive: {
    padding: "10px 20px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#3b82f6",
    fontWeight: "bold",
    fontSize: "15px",
    borderBottom: "3px solid #3b82f6",
    marginBottom: "-2px",
  },

  filterCard: { background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "20px" },
  filterRow: { display: "flex", gap: "10px" },
  radioLabel: { cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" },
  select: { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100px" },

  selectSmall: { padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" },
  inputSmall: { padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" },

  btnPrimary: { padding: "10px 20px", background: "#3A7DFF", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  btnSuccess: { padding: "8px 16px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  btnPrint: { padding: "8px 16px", background: "#64748b", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },

  deleteIcon: { color: "#ef4444", fontWeight: "bold", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", background: "#fee2e2" },

  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "2px solid #e2e8f0", paddingBottom: "15px" },
  timeText: { margin: "5px 0 0 0", color: "#64748b", fontStyle: "italic", fontSize: "14px" },

  tableCard: { background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#f1f5f9" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#475569", textTransform: "uppercase" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#334155" },
};

export default ReportManagement;
