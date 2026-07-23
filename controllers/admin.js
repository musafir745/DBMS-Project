const { pool } = require("../config/db.js");

module.exports.dashboard = async (req, res) => {
  const [hotelResult, roomResult, customerResult, bookingResult, pendingResult, recentResult] =
    await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM hotels"),
      pool.query("SELECT COUNT(*) AS count FROM rooms"),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'"),
      pool.query("SELECT COUNT(*) AS count FROM bookings"),
      pool.query("SELECT COUNT(*) AS count FROM bookings WHERE status = 'Pending'"),
      pool.query(
        `SELECT b.booking_id, b.check_in_date, b.check_out_date, b.status,
          u.name AS customer_name, r.room_type, h.name AS hotel_name
        FROM bookings b
        JOIN users u ON b.customer_id = u.user_id
        JOIN rooms r ON b.room_id = r.room_id
        JOIN hotels h ON r.hotel_id = h.hotel_id
        ORDER BY b.booking_id DESC
        LIMIT 5`
      ),
    ]);

  const stats = {
    hotels: hotelResult[0][0].count,
    rooms: roomResult[0][0].count,
    customers: customerResult[0][0].count,
    bookings: bookingResult[0][0].count,
    pending: pendingResult[0][0].count,
  };

  res.render("./admin/dashboard.ejs", {
    stats,
    recentBookings: recentResult[0],
  });
};
