const { pool } = require("../config/db.js");
const ExpressError = require("../utils/ExpressError.js");

function cleanUserPayload(payload) {
  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone && payload.phone.trim() ? payload.phone.trim() : null,
    role: payload.role,
  };
}

async function getUserOrFail(id) {
  const [users] = await pool.query(
    "SELECT user_id, name, email, phone, role, created_at FROM users WHERE user_id = ?",
    [id]
  );

  if (!users.length) {
    throw new ExpressError(404, "User not found.");
  }

  return users[0];
}

async function ensureAdminRemains(user, nextRole = user.role) {
  if (user.role !== "admin" || nextRole === "admin") return;

  const [[result]] = await pool.query(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
  );

  if (result.count <= 1) {
    throw new ExpressError(400, "The last administrator account cannot be removed or demoted.");
  }
}

module.exports.index = async (req, res) => {
  const [users] = await pool.query(
    `SELECT
      u.user_id, u.name, u.email, u.phone, u.role, u.created_at,
      (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = u.user_id) AS booking_count
    FROM users u
    ORDER BY u.role ASC, u.user_id DESC`
  );

  res.render("./customers/index.ejs", { users });
};

module.exports.showCustomer = async (req, res) => {
  const user = await getUserOrFail(req.params.id);
  const [bookings] = await pool.query(
    `SELECT b.*, r.room_type, h.name AS hotel_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.room_id
    JOIN hotels h ON r.hotel_id = h.hotel_id
    WHERE b.customer_id = ?
    ORDER BY b.check_in_date DESC`,
    [user.user_id]
  );

  res.render("./customers/show.ejs", { user, bookings });
};

module.exports.renderEditForm = async (req, res) => {
  const user = await getUserOrFail(req.params.id);
  res.render("./customers/edit.ejs", { user });
};

module.exports.updateCustomer = async (req, res) => {
  const user = await getUserOrFail(req.params.id);
  const updatedUser = cleanUserPayload(req.body.user);

  if (user.user_id === req.session.user.id && updatedUser.role !== "admin") {
    throw new ExpressError(400, "You cannot remove your own administrator access.");
  }

  await ensureAdminRemains(user, updatedUser.role);

  try {
    await pool.query(
      `UPDATE users
      SET name = ?, email = ?, phone = ?, role = ?
      WHERE user_id = ?`,
      [updatedUser.name, updatedUser.email, updatedUser.phone, updatedUser.role, user.user_id]
    );

    if (user.user_id === req.session.user.id) {
      req.session.user.name = updatedUser.name;
      req.session.user.email = updatedUser.email;
    }

    req.flash("success", "User updated.");
    res.redirect(`/customers/${user.user_id}`);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ExpressError(400, "An account with this email already exists.");
    }
    throw err;
  }
};

module.exports.destroyCustomer = async (req, res) => {
  const user = await getUserOrFail(req.params.id);

  if (user.user_id === req.session.user.id) {
    throw new ExpressError(400, "You cannot delete your own administrator account.");
  }

  await ensureAdminRemains(user, "customer");
  await pool.query("DELETE FROM users WHERE user_id = ?", [user.user_id]);

  req.flash("success", "User deleted. Their related bookings were removed as well.");
  res.redirect("/customers");
};
