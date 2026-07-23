const { pool } = require("../config/db.js");
const ExpressError = require("../utils/ExpressError.js");

function cleanProfilePayload(payload) {
  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone && payload.phone.trim() ? payload.phone.trim() : null,
  };
}

async function ensureBookingConflictFree(roomId, checkInDate, checkOutDate) {
  const [conflicts] = await pool.query(
    `SELECT booking_id
    FROM bookings
    WHERE room_id = ?
      AND status <> 'Cancelled'
      AND ? < check_out_date
      AND ? > check_in_date`,
    [roomId, checkInDate, checkOutDate]
  );

  if (conflicts.length) {
    throw new ExpressError(
      400,
      "This room already has an active booking for the selected dates."
    );
  }
}

async function getCustomerBookings(customerId, limit = null) {
  let sql = `
    SELECT b.*, r.room_type, r.price, h.hotel_id, h.name AS hotel_name, h.location AS hotel_location
    FROM bookings b
    JOIN rooms r ON b.room_id = r.room_id
    JOIN hotels h ON r.hotel_id = h.hotel_id
    WHERE b.customer_id = ?
    ORDER BY b.check_in_date DESC`;

  const params = [customerId];
  if (limit) {
    sql += " LIMIT ?";
    params.push(limit);
  }

  const [bookings] = await pool.query(sql, params);
  return bookings;
}

module.exports.dashboard = async (req, res) => {
  const customerId = req.session.user.id;
  const [[stats]] = await pool.query(
    `SELECT
      COUNT(*) AS total_bookings,
      COALESCE(SUM(status = 'Pending'), 0) AS pending_bookings,
      COALESCE(SUM(status = 'Confirmed'), 0) AS confirmed_bookings,
      COALESCE(SUM(status = 'Completed'), 0) AS completed_bookings
    FROM bookings
    WHERE customer_id = ?`,
    [customerId]
  );
  const bookings = await getCustomerBookings(customerId, 5);

  res.render("./customer/dashboard.ejs", { stats, bookings });
};

module.exports.renderProfile = async (req, res) => {
  const [users] = await pool.query(
    "SELECT user_id, name, email, phone FROM users WHERE user_id = ? AND role = 'customer'",
    [req.session.user.id]
  );

  if (!users.length) {
    throw new ExpressError(404, "Customer profile not found.");
  }

  res.render("./customer/profile.ejs", { user: users[0] });
};

module.exports.updateProfile = async (req, res) => {
  const user = cleanProfilePayload(req.body.user);

  try {
    const [result] = await pool.query(
      `UPDATE users
      SET name = ?, email = ?, phone = ?
      WHERE user_id = ? AND role = 'customer'`,
      [user.name, user.email, user.phone, req.session.user.id]
    );

    if (!result.affectedRows) {
      throw new ExpressError(404, "Customer profile not found.");
    }

    req.session.user.name = user.name;
    req.session.user.email = user.email;
    req.flash("success", "Profile updated.");
    res.redirect("/customer/profile");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ExpressError(400, "An account with this email already exists.");
    }
    throw err;
  }
};

module.exports.bookings = async (req, res) => {
  const bookings = await getCustomerBookings(req.session.user.id);
  res.render("./customer/bookings.ejs", { bookings });
};

module.exports.renderNewBooking = async (req, res) => {
  const [rooms] = await pool.query(
    `SELECT r.room_id, r.room_type, r.capacity, r.price,
      h.name AS hotel_name, h.location AS hotel_location
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.hotel_id
    WHERE r.availability = 'Available'
    ORDER BY h.name ASC, r.room_type ASC`
  );

  if (!rooms.length) {
    req.flash("error", "No available rooms can be booked right now.");
    return res.redirect("/listings");
  }

  res.render("./customer/new-booking.ejs", {
    rooms,
    selectedRoomId: req.query.room_id ? Number(req.query.room_id) : null,
  });
};

module.exports.createBooking = async (req, res) => {
  const { room_id, check_in_date, check_out_date } = req.body.booking;
  const [rooms] = await pool.query(
    "SELECT room_id FROM rooms WHERE room_id = ? AND availability = 'Available'",
    [room_id]
  );

  if (!rooms.length) {
    throw new ExpressError(400, "The selected room is unavailable.");
  }

  await ensureBookingConflictFree(room_id, check_in_date, check_out_date);
  await pool.query(
    `INSERT INTO bookings (room_id, customer_id, check_in_date, check_out_date, status)
    VALUES (?, ?, ?, ?, 'Pending')`,
    [room_id, req.session.user.id, check_in_date, check_out_date]
  );

  req.flash("success", "Booking request created and is pending confirmation.");
  res.redirect("/customer/bookings");
};

module.exports.cancelBooking = async (req, res) => {
  const [result] = await pool.query(
    `UPDATE bookings
    SET status = 'Cancelled'
    WHERE booking_id = ?
      AND customer_id = ?
      AND status IN ('Pending', 'Confirmed')`,
    [req.params.id, req.session.user.id]
  );

  if (!result.affectedRows) {
    throw new ExpressError(
      404,
      "This booking cannot be cancelled or does not belong to your account."
    );
  }

  req.flash("success", "Booking cancelled.");
  res.redirect("/customer/bookings");
};
