const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { validateHotel, requireAdmin } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

router.route("/")
  .get(wrapAsync(listingController.index))
  .post(requireAdmin, validateHotel, wrapAsync(listingController.createListing));

router.get("/new", requireAdmin, listingController.renderNewForm);

router.route("/:id")
  .get(wrapAsync(listingController.showListings))
  .put(requireAdmin, validateHotel, wrapAsync(listingController.updateListing))
  .delete(requireAdmin, wrapAsync(listingController.destroyListing));

router.get("/:id/edit", requireAdmin, wrapAsync(listingController.renderEditForm));

module.exports = router;
