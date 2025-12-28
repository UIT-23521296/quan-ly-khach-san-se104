import React from "react";

const Navbar = () => {
  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Map vai trò sang tiếng Việt
  const roleDisplay = {
    Admin: "Quản trị viên",
    Manage: "Quản lý",
    User: "Lễ tân",
  
  };

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.title}>🏨 Quản Lý Khách Sạn</h2>

      <div style={styles.userInfo}>
        <span style={styles.userName}>👤 {user.hoTen || "User"}</span>
        <span style={styles.role}>
          {roleDisplay[user.vaiTro] || user.vaiTro}
        </span>
        <button
          style={styles.logoutBtn}
          onClick={() => {
            if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
              localStorage.clear();
              window.location.href = "/login";
            }
          }}
        >
          Đăng xuất
        </button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#1F2A40",
    color: "white",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userName: {
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  role: {
    padding: "0.3rem 0.8rem",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "6px",
    fontSize: "0.85rem",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#FF6B6B",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default Navbar;
