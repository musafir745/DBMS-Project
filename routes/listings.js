const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { validateHotel } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

router.route("/")
  .get(wrapAsync(listingController.index))
  .post(validateHotel, wrapAsync(listingController.createListing));

router.get("/new", listingController.renderNewForm);

router.route("/:id")
  .get(wrapAsync(listingController.showListings))
  .put(validateHotel, wrapAsync(listingController.updateListing))
  .delete(wrapAsync(listingController.destroyListing));

router.get("/:id/edit", wrapAsync(listingController.renderEditForm));

module.exports = router;
