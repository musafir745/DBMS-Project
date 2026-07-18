const { pool } = require("../config/db.js");
const ExpressError = require("../utils/ExpressError.js");

function cleanCustomerPayload(payload) {
  return {
    name: payload.name.trim(),
    email: payload.email && payload.email.trim() ? payload.email.trim() : null,
    phone: payload.phone && payload.phone.trim() ? payload.phone.trim() : null,
  };
}

function handleCustomerError(err) {
  if (err.code === "ER_DUP_ENTRY") {
    throw new ExpressError(400, "A customer with this email already exists.");
  }

  throw err;
}

module.exports.index = async (req, res) => {
  const [customers] = await pool.query(
    `SELECT
      c.*,
      (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.customer_id) AS booking_count
    FROM customers c
    ORDER BY c.customer_id DESC`
  );

  res.render("./customers/index.ejs", { customers });
};

module.exports.renderNewForm = (req, res) => {
  res.render("./customers/new.ejs");
};

module.exports.createCustomer = async (req, res) => {
  const customer = cleanCustomerPayload(req.body.customer);

  try {
    const [result] = await pool.query(
      "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
      [customer.name, customer.email, customer.phone]
    );

    req.flash("success", "Customer created.");
    res.redirect(`/customers/${result.insertId}`);
  } catch (err) {
    handleCustomerError(err);
  }
};

module.exports.showCustomer = async (req, res) => {
  const { id } = req.params;
  const [customers] = await pool.query("SELECT * FROM customers WHERE customer_id = ?", [id]);

  if (!customers.length) {
    req.flash("error", "Customer not found.");
    return res.redirect("/customers");
  }

  const [bookings] = await pool.query(
    `SELECT b.*, r.room_type, h.name AS hotel_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.room_id
    JOIN hotels h ON r.hotel_id = h.hotel_id
    WHERE b.customer_id = ?
    ORDER BY b.check_in_date DESC`,
    [id]
  );

  res.render("./customers/show.ejs", { customer: customers[0], bookings });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const [customers] = await pool.query("SELECT * FROM customers WHERE customer_id = ?", [id]);

  if (!customers.length) {
    req.flash("error", "Customer not found.");
    return res.redirect("/customers");
  }

  res.render("./customers/edit.ejs", { customer: customers[0] });
};

module.exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = cleanCustomerPayload(req.body.customer);

  try {
    const [result] = await pool.query(
      "UPDATE customers SET name = ?, email = ?, phone = ? WHERE customer_id = ?",
      [customer.name, customer.email, customer.phone, id]
    );

    if (!result.affectedRows) {
      throw new ExpressError(404, "Customer not found.");
    }

    req.flash("success", "Customer updated.");
    res.redirect(`/customers/${id}`);
  } catch (err) {
    handleCustomerError(err);
  }
};

module.exports.destroyCustomer = async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query("DELETE FROM customers WHERE customer_id = ?", [id]);

  if (!result.affectedRows) {
    throw new ExpressError(404, "Customer not found.");
  }

  req.flash("success", "Customer deleted.");
  res.redirect("/customers");
};
