const { pool } = require("../config/db.js");
const ExpressError = require("../utils/ExpressError.js");

async function getRooms() {
  const [rooms] = await pool.query(
    `SELECT r.room_id, r.room_type, r.capacity, r.price, r.availability,
      h.name AS hotel_name, h.location AS hotel_location
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.hotel_id
    ORDER BY h.name ASC, r.room_type ASC`
  );
  return rooms;
}

async function getCustomers() {
  const [customers] = await pool.query(
    `SELECT user_id AS customer_id, name, email, phone
    FROM users
    WHERE role = 'customer'
    ORDER BY name ASC`
  );
  return customers;
}

async function ensureBookingConflictFree(roomId, checkInDate, checkOutDate, bookingId = null) {
  const params = [roomId, checkInDate, checkOutDate];
  let sql = `
    SELECT booking_id
    FROM bookings
    WHERE room_id = ?
      AND status <> 'Cancelled'
      AND ? < check_out_date
      AND ? > check_in_date`;

  if (bookingId) {
    sql += " AND booking_id <> ?";
    params.push(bookingId);
  }

  const [conflicts] = await pool.query(sql, params);

  if (conflicts.length) {
    throw new ExpressError(
      400,
      "This room already has an active booking for the selected dates."
    );
  }
}

module.exports.index = async (req, res) => {
  const [bookings] = await pool.query(
    `SELECT b.*, c.name AS customer_name, r.room_type, h.name AS hotel_name
    FROM bookings b
    JOIN users c ON b.customer_id = c.user_id
    JOIN rooms r ON b.room_id = r.room_id
    JOIN hotels h ON r.hotel_id = h.hotel_id
    ORDER BY b.booking_id DESC`
  );

  res.render("./bookings/index.ejs", { bookings });
};

module.exports.renderNewForm = async (req, res) => {
  const rooms = await getRooms();
  const customers = await getCustomers();

  if (!rooms.length) {
    req.flash("error", "Add a room before creating bookings.");
    return res.redirect("/rooms/new");
  }

  if (!customers.length) {
    req.flash("error", "No customer accounts are available for a booking.");
    return res.redirect("/customers");
  }

  res.render("./bookings/new.ejs", {
    rooms,
    customers,
    selectedRoomId: req.query.room_id ? Number(req.query.room_id) : null,
    selectedCustomerId: req.query.customer_id ? Number(req.query.customer_id) : null,
  });
};

module.exports.createBooking = async (req, res) => {
  const { room_id, customer_id, check_in_date, check_out_date, status } = req.body.booking;
  await ensureBookingConflictFree(room_id, check_in_date, check_out_date);

  const [result] = await pool.query(
    `INSERT INTO bookings (room_id, customer_id, check_in_date, check_out_date, status)
    VALUES (?, ?, ?, ?, ?)`,
    [room_id, customer_id, check_in_date, check_out_date, status]
  );

  req.flash("success", "Booking created.");
  res.redirect(`/bookings/${result.insertId}`);
};

module.exports.showBooking = async (req, res) => {
  const { id } = req.params;
  const [bookings] = await pool.query(
    `SELECT b.*, c.name AS customer_name, c.email, c.phone,
      r.room_type, r.capacity, r.price,
      h.hotel_id, h.name AS hotel_name, h.location AS hotel_location
    FROM bookings b
    JOIN users c ON b.customer_id = c.user_id
    JOIN rooms r ON b.room_id = r.room_id
    JOIN hotels h ON r.hotel_id = h.hotel_id
    WHERE b.booking_id = ?`,
    [id]
  );

  if (!bookings.length) {
    req.flash("error", "Booking not found.");
    return res.redirect("/bookings");
  }

  res.render("./bookings/show.ejs", { booking: bookings[0] });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const [bookings] = await pool.query("SELECT * FROM bookings WHERE booking_id = ?", [id]);

  if (!bookings.length) {
    req.flash("error", "Booking not found.");
    return res.redirect("/bookings");
  }

  const rooms = await getRooms();
  const customers = await getCustomers();
  res.render("./bookings/edit.ejs", { booking: bookings[0], rooms, customers });
};

module.exports.updateBooking = async (req, res) => {
  const { id } = req.params;
  const { room_id, customer_id, check_in_date, check_out_date, status } = req.body.booking;
  await ensureBookingConflictFree(room_id, check_in_date, check_out_date, id);

  const [result] = await pool.query(
    `UPDATE bookings
    SET room_id = ?, customer_id = ?, check_in_date = ?, check_out_date = ?, status = ?
    WHERE booking_id = ?`,
    [room_id, customer_id, check_in_date, check_out_date, status, id]
  );

  if (!result.affectedRows) {
    throw new ExpressError(404, "Booking not found.");
  }

  req.flash("success", "Booking updated.");
  res.redirect(`/bookings/${id}`);
};

module.exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query(
    "UPDATE bookings SET status = 'Cancelled' WHERE booking_id = ?",
    [id]
  );

  if (!result.affectedRows) {
    throw new ExpressError(404, "Booking not found.");
  }

  req.flash("success", "Booking cancelled.");
  res.redirect(`/bookings/${id}`);
};

module.exports.destroyBooking = async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query("DELETE FROM bookings WHERE booking_id = ?", [id]);

  if (!result.affectedRows) {
    throw new ExpressError(404, "Booking not found.");
  }

  req.flash("success", "Booking deleted.");
  res.redirect("/bookings");
};
