import React, { useState, useEffect } from "react";
import api from "../services/api";

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchCustomers();
  }, []);

  const fetchBookings = async () => {
    // GET /api/bookings
  };

  const fetchRooms = async () => {
    // GET /api/rooms-empty (chỉ lấy phòng trống)
  };

  const fetchCustomers = async () => {
    // GET /api/customers
  };

  return (
    <div style={styles.container}>
      <h1>Thuê phòng</h1>
      <p>Quản lý phiếu thuê phòng và khách thuê.</p>

      <button style={styles.addBtn} onClick={() => setShowModal(true)}>
        + Thuê phòng
      </button>

      {/* TABLE HIỂN THỊ PHIẾU THUÊ */}

      {showModal && (
        <BookingModal
          rooms={rooms}
          customers={customers}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default BookingManagement;
