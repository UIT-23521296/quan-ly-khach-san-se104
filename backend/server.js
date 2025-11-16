const express = require('express');
const mysql = require('mysql2'); 

const app = express();
const port = 9999;

// 2. Tạo kết nối
const db = mysql.createConnection({
  host: 'localhost',      // Địa chỉ
  user: 'root',           // Tên đăng nhập XAMPP
  password: '',           // Mật khẩu XAMPP
  database: 'quanlykhachsan' // Tên database 
});

// 3. Thử kết nối
db.connect((err) => {
  if (err) {
    console.error('LỖI KẾT NỐI DATABASE:', err);
    return;
  }
  console.log('✅ Đã kết nối thành công tới MySQL (XAMPP)');
});

// Một API test đơn giản
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend đang chạy!' });
});

app.listen(port, () => {
  console.log(`Backend server đang chạy tại http://localhost:${port}`);
});