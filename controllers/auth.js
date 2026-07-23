const bcrypt = require("bcrypt");
const { pool } = require("../config/db.js");
const ExpressError = require("../utils/ExpressError.js");

function cleanUserPayload(payload) {
  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone && payload.phone.trim() ? payload.phone.trim() : null,
  };
}

function createSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);

      req.session.user = {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function handleDuplicateEmail(err) {
  if (err.code === "ER_DUP_ENTRY") {
    throw new ExpressError(400, "An account with this email already exists.");
  }

  throw err;
}

module.exports.renderRegister = (req, res) => {
  res.render("./auth/register.ejs");
};

module.exports.register = async (req, res) => {
  const user = cleanUserPayload(req.body.user);
  const passwordHash = await bcrypt.hash(req.body.user.password, 12);

  try {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password, role)
      VALUES (?, ?, ?, ?, 'customer')`,
      [user.name, user.email, user.phone, passwordHash]
    );

    await createSession(req, {
      user_id: result.insertId,
      name: user.name,
      email: user.email,
      role: "customer",
    });
    req.flash("success", "Registration successful. Welcome to WanderLust.");
    res.redirect("/customer/dashboard");
  } catch (err) {
    handleDuplicateEmail(err);
  }
};

module.exports.renderCustomerLogin = (req, res) => {
  res.render("./auth/customer-login.ejs");
};

module.exports.customerLogin = async (req, res) => {
  const email = req.body.credentials.email.trim().toLowerCase();
  const { password } = req.body.credentials;
  const [users] = await pool.query(
    `SELECT user_id, name, email, password, role
    FROM users
    WHERE email = ? AND role = 'customer'`,
    [email]
  );

  if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
    req.flash("error", "Invalid customer email or password.");
    return res.redirect("/auth/login");
  }

  await createSession(req, users[0]);
  req.flash("success", `Welcome back, ${users[0].name}.`);
  res.redirect("/customer/dashboard");
};

module.exports.renderAdminLogin = (req, res) => {
  res.render("./admin/login.ejs");
};

module.exports.adminLogin = async (req, res) => {
  const email = req.body.credentials.email.trim().toLowerCase();
  const { password } = req.body.credentials;
  const [users] = await pool.query(
    `SELECT user_id, name, email, password, role
    FROM users
    WHERE email = ? AND role = 'admin'`,
    [email]
  );

  if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
    req.flash("error", "Invalid administrator email or password.");
    return res.redirect("/admin/login");
  }

  await createSession(req, users[0]);
  req.flash("success", `Welcome back, ${users[0].name}.`);
  res.redirect("/admin/dashboard");
};

module.exports.customerLogout = async (req, res) => {
  await destroySession(req);
  res.clearCookie("connect.sid");
  res.redirect("/listings");
};

module.exports.adminLogout = async (req, res) => {
  await destroySession(req);
  res.clearCookie("connect.sid");
  res.redirect("/admin/login");
};
