const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { validateBooking, requireAdmin } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

router.use(requireAdmin);

router.route("/")
  .get(wrapAsync(bookingController.index))
  .post(validateBooking, wrapAsync(bookingController.createBooking));

router.get("/new", wrapAsync(bookingController.renderNewForm));

router.put("/:id/cancel", wrapAsync(bookingController.cancelBooking));

router.route("/:id")
  .get(wrapAsync(bookingController.showBooking))
  .put(validateBooking, wrapAsync(bookingController.updateBooking))
  .delete(wrapAsync(bookingController.destroyBooking));

router.get("/:id/edit", wrapAsync(bookingController.renderEditForm));

module.exports = router;
