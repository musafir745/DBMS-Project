const ExpressError = require("./utils/ExpressError.js");
const {
  hotelSchema,
  roomSchema,
  bookingSchema,
  customerBookingSchema,
  registrationSchema,
  loginSchema,
  profileSchema,
  adminUserSchema,
} = require("./schema.js");

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errMsg = error.details.map((el) => el.message).join(", ");
      throw new ExpressError(400, errMsg);
    }

    next();
  };
}

function redirectForRole(req, res) {
  if (req.session.user && req.session.user.role === "admin") {
    return res.redirect("/admin/dashboard");
  }

  return res.redirect("/customer/dashboard");
}

function requireCustomer(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Please log in as a customer to continue.");
    return res.redirect("/auth/login");
  }

  if (req.session.user.role !== "customer") {
    req.flash("error", "Customer access only.");
    return res.redirect("/admin/dashboard");
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Please log in as an administrator to continue.");
    return res.redirect("/admin/login");
  }

  if (req.session.user.role !== "admin") {
    req.flash("error", "Administrator access only.");
    return res.redirect("/customer/dashboard");
  }

  next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.user) {
    return redirectForRole(req, res);
  }

  next();
}

module.exports.validateHotel = validate(hotelSchema);
module.exports.validateRoom = validate(roomSchema);
module.exports.validateBooking = validate(bookingSchema);
module.exports.validateCustomerBooking = validate(customerBookingSchema);
module.exports.validateRegistration = validate(registrationSchema);
module.exports.validateLogin = validate(loginSchema);
module.exports.validateProfile = validate(profileSchema);
module.exports.validateAdminUser = validate(adminUserSchema);
module.exports.requireCustomer = requireCustomer;
module.exports.requireAdmin = requireAdmin;
module.exports.redirectIfAuthenticated = redirectIfAuthenticated;
