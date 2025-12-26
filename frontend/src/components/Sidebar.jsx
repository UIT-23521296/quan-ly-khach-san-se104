// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ activeMenu }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.vaiTro; // Admin | Manage | User
  const isAdmin = role === "Admin";
  const isManage = role === "Manage";

  const menuItems = [
    { id: "dashboard", icon: "📊", label: "Tổng quan", path: "/" },
    { id: "room-search", icon: "🔍", label: "Tra cứu phòng", path: "/room-search" },
    { id: "rooms", icon: "🛏️", label: "Danh mục phòng", path: "/rooms" },
    { id: "booking", icon: "📝", label: "Thuê phòng", path: "/phieuthue" },
    { id: "customers", icon: "👥", label: "Khách hàng", path: "/customers" },
    { id: "invoice", icon: "💵", label: "Hóa đơn", path: "/invoice" },
    { id: "settings", icon: "⚙️", label: "Qui định", path: "/settings" },

    ...(isAdmin || isManage
      ? [
          {
            id: "staff",
            icon: "🧑‍💼",
            label: isAdmin ? "Phân quyền" : "Quản lý nhân viên",
            path: "/staff",
          },
          { id: "report", icon: "📈", label: "Báo cáo doanh thu", path: "/report" },
        ]
      : []),
  ];

  return (
    <div style={styles.sidebar}>
      {menuItems.map((item) => {
        const isActive = activeMenu === item.id;

        return (
          <Link
            key={item.id}
            to={item.path}
            style={{
              ...styles.menuItem,
              backgroundColor: isActive ? "#3A7DFF" : "transparent",
              color: isActive ? "white" : "#e5e7eb",
            }}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

const styles = {
  sidebar: {
    width: "250px",
    backgroundColor: "#1F2A40",
    color: "white",
    minHeight: "100vh",
    padding: "1rem 0",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    padding: "1rem 1.5rem",
    cursor: "pointer",
    borderRadius: "8px",
    margin: "0.3rem 0.5rem",
    transition: "0.25s",
    textDecoration: "none",
    fontWeight: 600,
  },
  icon: {
    marginRight: "1rem",
    fontSize: "1.2rem",
  },
};

export default Sidebar;
