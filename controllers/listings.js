const { pool } = require("../config/db.js");
const ExpressError = require("../utils/ExpressError.js");

const DEFAULT_HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

function cleanHotelPayload(payload) {
  return {
    name: payload.name.trim(),
    location: payload.location.trim(),
    description: payload.description.trim(),
    contact: payload.contact.trim(),
    image_url: payload.image_url && payload.image_url.trim()
      ? payload.image_url.trim()
      : DEFAULT_HOTEL_IMAGE,
  };
}

module.exports.index = async (req, res) => {
  const search = req.query.q ? req.query.q.trim() : "";
  const params = [];
  let whereClause = "";

  if (search) {
    whereClause = "WHERE h.name LIKE ? OR h.location LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [allListings] = await pool.query(
    `SELECT
      h.*,
      (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.hotel_id) AS room_count,
      (SELECT MIN(r.price) FROM rooms r WHERE r.hotel_id = h.hotel_id) AS starting_price
    FROM hotels h
    ${whereClause}
    ORDER BY h.hotel_id DESC`,
    params
  );

  res.render("./listings/index.ejs", { allListings, search });
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};

module.exports.showListings = async (req, res) => {
  const { id } = req.params;
  const [listings] = await pool.query(
    `SELECT
      h.*,
      (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.hotel_id) AS room_count,
      (SELECT MIN(r.price) FROM rooms r WHERE r.hotel_id = h.hotel_id) AS starting_price
    FROM hotels h
    WHERE h.hotel_id = ?`,
    [id]
  );

  if (!listings.length) {
    req.flash("error", "Hotel/listing not found.");
    return res.redirect("/listings");
  }

  const [rooms] = await pool.query(
    "SELECT * FROM rooms WHERE hotel_id = ? ORDER BY price ASC, room_id DESC",
    [id]
  );

  res.render("./listings/show.ejs", { listing: listings[0], rooms });
};

module.exports.createListing = async (req, res) => {
  const hotel = cleanHotelPayload(req.body.hotel);
  const [result] = await pool.query(
    `INSERT INTO hotels (name, location, description, contact, image_url)
    VALUES (?, ?, ?, ?, ?)`,
    [hotel.name, hotel.location, hotel.description, hotel.contact, hotel.image_url]
  );

  req.flash("success", "New hotel/listing created.");
  res.redirect(`/listings/${result.insertId}`);
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const [listings] = await pool.query("SELECT * FROM hotels WHERE hotel_id = ?", [id]);

  if (!listings.length) {
    req.flash("error", "Hotel/listing not found.");
    return res.redirect("/listings");
  }

  res.render("./listings/edit.ejs", { listing: listings[0] });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const hotel = cleanHotelPayload(req.body.hotel);
  const [result] = await pool.query(
    `UPDATE hotels
    SET name = ?, location = ?, description = ?, contact = ?, image_url = ?
    WHERE hotel_id = ?`,
    [hotel.name, hotel.location, hotel.description, hotel.contact, hotel.image_url, id]
  );

  if (!result.affectedRows) {
    throw new ExpressError(404, "Hotel/listing not found.");
  }

  req.flash("success", "Hotel/listing updated.");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query("DELETE FROM hotels WHERE hotel_id = ?", [id]);

  if (!result.affectedRows) {
    throw new ExpressError(404, "Hotel/listing not found.");
  }

  req.flash("success", "Hotel/listing deleted.");
  res.redirect("/listings");
};
