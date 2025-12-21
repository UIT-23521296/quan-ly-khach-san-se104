// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomManagement from "./pages/RoomManagement";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import BookingManagement from "./pages/BookingManagement";
import InvoiceManagement from "./pages/InvoiceManagement";
import RoomSearch from "./pages/RoomSearch";
import ReportManagement from "./pages/ReportManagement";
import Settings from "./pages/Settings";

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
    </div>
  );
}

function SidebarWrapper() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  return <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />

        {/* PRIVATE ROUTES */}
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

        <Route
          path="/report"
          element={
            <PrivateLayout>
              <ReportManagement />
            </PrivateLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateLayout>
              <Settings />
            </PrivateLayout>
          }
        />
      </Routes>
    </Router>
  );
}

const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: "1rem",
    backgroundColor: "#F5F8FF",
    overflow: "auto",
  },
};

export default App;
