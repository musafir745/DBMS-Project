const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { requireAdmin, validateAdminUser } = require("../middleware.js");
const customerController = require("../controllers/customers.js");

router.use(requireAdmin);

router.route("/")
  .get(wrapAsync(customerController.index));

router.route("/:id")
  .get(wrapAsync(customerController.showCustomer))
  .put(validateAdminUser, wrapAsync(customerController.updateCustomer))
  .delete(wrapAsync(customerController.destroyCustomer));

router.get("/:id/edit", wrapAsync(customerController.renderEditForm));

module.exports = router;
