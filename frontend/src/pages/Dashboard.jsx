import React, { useState } from "react";

const Dashboard = () => {
  const [stats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalRevenue: 0,
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard - Tổng quan</h1>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.card, backgroundColor: "#4A90E2" }}>
          <h3>Tổng số phòng</h3>
          <p style={styles.number}>{stats.totalRooms}</p>
        </div>

        <div style={{ ...styles.card, backgroundColor: "#7ED957" }}>
          <h3>Phòng trống</h3>
          <p style={styles.number}>{stats.availableRooms}</p>
        </div>

        <div style={{ ...styles.card, backgroundColor: "#FF6B6B" }}>
          <h3>Phòng đã thuê</h3>
          <p style={styles.number}>{stats.occupiedRooms}</p>
        </div>

        <div style={{ ...styles.card, backgroundColor: "#FFC542" }}>
          <h3>Doanh thu tháng</h3>
          <p style={styles.number}>{stats.totalRevenue} VNĐ</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    padding: "2rem 3rem",
    backgroundColor: "#F5F8FF",
  },
  title: {
    fontSize: "2.3rem",
    fontWeight: "700",
    color: "#1F2A40",
  },
  statsGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.5rem",
    marginTop: "2rem",
  },
  card: {
    padding: "2rem",
    borderRadius: "12px",
    color: "white",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  number: {
    fontSize: "2.5rem",
    marginTop: "1rem",
    fontWeight: "bold",
  },
};

export default Dashboard;
