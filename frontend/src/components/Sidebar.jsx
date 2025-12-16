// src/components/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", icon: "📊", label: "Tổng quan", path: "/" },
    { id: "rooms", icon: "🛏️", label: "Danh mục phòng", path: "/rooms" },
    { id: "booking", icon: "📝", label: "Thuê phòng", path: "/phieuthue" },
    { id: "invoice", icon: "💵", label: "Hóa đơn", path: "/invoice" },
    { id: "report", icon: "📈", label: "Báo cáo doanh thu", path: "/report" },
    { id: "settings", icon: "⚙️", label: "Qui định", path: "/settings" },
  ];

  return (
    <div style={styles.sidebar}>
      {menuItems.map((item) => (
        <div
          key={item.id}
          style={{
            ...styles.menuItem,
            backgroundColor: activeMenu === item.id ? "#3A7DFF" : "transparent",
          }}
          onClick={() => {
            setActiveMenu(item.id);
            navigate(item.path); // 👉 điều hướng route
          }}
        >
          <span style={styles.icon}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
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
    transition: "0.3s",
  },
  icon: {
    marginRight: "1rem",
    fontSize: "1.2rem",
  },
};

export default Sidebar;
