const { pool } = require("../config/db.js");
const ExpressError = require("../utils/ExpressError.js");

async function getHotels() {
  const [hotels] = await pool.query(
    "SELECT hotel_id, name, location FROM hotels ORDER BY name ASC"
  );
  return hotels;
}

module.exports.index = async (req, res) => {
  const [rooms] = await pool.query(
    `SELECT r.*, h.name AS hotel_name, h.location AS hotel_location
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.hotel_id
    ORDER BY r.room_id DESC`
  );

  res.render("./rooms/index.ejs", { rooms });
};

module.exports.renderNewForm = async (req, res) => {
  const hotels = await getHotels();

  if (!hotels.length) {
    req.flash("error", "Add a hotel/listing before adding rooms.");
    return res.redirect("/listings/new");
  }

  res.render("./rooms/new.ejs", {
    hotels,
    selectedHotelId: req.query.hotel_id ? Number(req.query.hotel_id) : null,
  });
};

module.exports.createRoom = async (req, res) => {
  const { hotel_id, room_type, capacity, price, availability } = req.body.room;
  const [result] = await pool.query(
    `INSERT INTO rooms (hotel_id, room_type, capacity, price, availability)
    VALUES (?, ?, ?, ?, ?)`,
    [hotel_id, room_type.trim(), capacity, price, availability]
  );

  req.flash("success", "Room created.");
  res.redirect(`/rooms/${result.insertId}`);
};

module.exports.showRoom = async (req, res) => {
  const { id } = req.params;
  const [rooms] = await pool.query(
    `SELECT r.*, h.name AS hotel_name, h.location AS hotel_location
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.hotel_id
    WHERE r.room_id = ?`,
    [id]
  );

  if (!rooms.length) {
    req.flash("error", "Room not found.");
    return res.redirect("/rooms");
  }

  const [bookings] = await pool.query(
    `SELECT b.*, c.name AS customer_name
    FROM bookings b
    JOIN users c ON b.customer_id = c.user_id
    WHERE b.room_id = ?
    ORDER BY b.check_in_date DESC`,
    [id]
  );

  res.render("./rooms/show.ejs", { room: rooms[0], bookings });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const [rooms] = await pool.query("SELECT * FROM rooms WHERE room_id = ?", [id]);

  if (!rooms.length) {
    req.flash("error", "Room not found.");
    return res.redirect("/rooms");
  }

  const hotels = await getHotels();
  res.render("./rooms/edit.ejs", { room: rooms[0], hotels });
};

module.exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const { hotel_id, room_type, capacity, price, availability } = req.body.room;
  const [result] = await pool.query(
    `UPDATE rooms
    SET hotel_id = ?, room_type = ?, capacity = ?, price = ?, availability = ?
    WHERE room_id = ?`,
    [hotel_id, room_type.trim(), capacity, price, availability, id]
  );

  if (!result.affectedRows) {
    throw new ExpressError(404, "Room not found.");
  }

  req.flash("success", "Room updated.");
  res.redirect(`/rooms/${id}`);
};

module.exports.destroyRoom = async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query("DELETE FROM rooms WHERE room_id = ?", [id]);

  if (!result.affectedRows) {
    throw new ExpressError(404, "Room not found.");
  }

  req.flash("success", "Room deleted.");
  res.redirect("/rooms");
};
