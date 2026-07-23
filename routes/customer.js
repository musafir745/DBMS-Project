const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {
  requireCustomer,
  validateProfile,
  validateCustomerBooking,
} = require("../middleware.js");
const customerController = require("../controllers/customerPanel.js");

router.use(requireCustomer);

router.get("/dashboard", wrapAsync(customerController.dashboard));

router
  .route("/profile")
  .get(wrapAsync(customerController.renderProfile))
  .put(validateProfile, wrapAsync(customerController.updateProfile));

router.route("/bookings")
  .get(wrapAsync(customerController.bookings))
  .post(validateCustomerBooking, wrapAsync(customerController.createBooking));

router.get("/bookings/new", wrapAsync(customerController.renderNewBooking));
router.put("/bookings/:id/cancel", wrapAsync(customerController.cancelBooking));

module.exports = router;
