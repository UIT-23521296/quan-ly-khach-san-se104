// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomManagement from "./pages/RoomManagement";
import BookingManagement from "./pages/BookingManagement";
import InvoiceManagement from "./pages/InvoiceManagement";
import RoomSearch from "./pages/RoomSearch";
import ReportManagement from "./pages/ReportManagement";
import Settings from "./pages/Settings";
import CustomerManagement from "./pages/CustomerManagement";
import StaffManagement from "./pages/StaffManagement";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ChatBot from "./components/ChatBot";

function PrivateLayout({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div style={styles.app}>
      <Navbar />
      <div style={styles.main}>
        <SidebarWrapper />
        <div style={styles.content}>{children}</div>
      </div>

      <ChatBot />
    </div>
  );
}

function RequireRole({ allow, children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.vaiTro; // Admin | Manage | User

  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;

  return children;
}

function SidebarWrapper() {
  const { pathname } = useLocation();

  let activeMenu = "dashboard";
  if (pathname.startsWith("/rooms")) activeMenu = "rooms";
  else if (pathname.startsWith("/phieuthue")) activeMenu = "booking";
  else if (pathname.startsWith("/invoice")) activeMenu = "invoice";
  else if (pathname.startsWith("/room-search")) activeMenu = "room-search"; // ✅ FIX
  else if (pathname.startsWith("/customers")) activeMenu = "customers";
  else if (pathname.startsWith("/staff")) activeMenu = "staff";
  else if (pathname.startsWith("/settings")) activeMenu = "settings";
  else if (pathname.startsWith("/report")) activeMenu = "report";

  return <Sidebar activeMenu={activeMenu} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />

        {/* PRIVATE */}
        <Route
          path="/"
          element={
            <PrivateLayout>
              <Dashboard />
            </PrivateLayout>
          }
        />

        <Route
          path="/rooms"
          element={
            <PrivateLayout>
              <RoomManagement />
            </PrivateLayout>
          }
        />

        <Route
          path="/phieuthue"
          element={
            <PrivateLayout>
              <BookingManagement />
            </PrivateLayout>
          }
        />

        <Route
          path="/invoice"
          element={
            <PrivateLayout>
              <InvoiceManagement />
            </PrivateLayout>
          }
        />

        <Route
          path="/room-search"
          element={
            <PrivateLayout>
              <RoomSearch />
            </PrivateLayout>
          }
        />

        {/* Report: Admin + Manage */}
        <Route
          path="/report"
          element={
            <PrivateLayout>
              <RequireRole allow={["Admin", "Manage"]}>
                <ReportManagement />
              </RequireRole>
            </PrivateLayout>
          }
        />

        {/* Settings: ai cũng xem; quyền sửa chặn trong Settings.jsx */}
        <Route
          path="/settings"
          element={
            <PrivateLayout>
              <RequireRole allow={["Admin", "Manage", "User"]}>
                <Settings />
              </RequireRole>
            </PrivateLayout>
          }
        />

        <Route
          path="/customers"
          element={
            <PrivateLayout>
              <CustomerManagement />
            </PrivateLayout>
          }
        />

        <Route
          path="/staff"
          element={
            <PrivateLayout>
              <RequireRole allow={["Admin", "Manage"]}>
                <StaffManagement />
              </RequireRole>
            </PrivateLayout>
          }
        />

        {/* Not found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

const styles = {
  app: { display: "flex", flexDirection: "column", height: "100vh" },
  main: { display: "flex", flex: 1, overflow: "hidden" },
  content: { flex: 1, padding: "1rem", backgroundColor: "#F5F8FF", overflow: "auto" },
};

export default App;
