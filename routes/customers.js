const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { validateCustomer } = require("../middleware.js");
const customerController = require("../controllers/customers.js");

router.route("/")
  .get(wrapAsync(customerController.index))
  .post(validateCustomer, wrapAsync(customerController.createCustomer));

router.get("/new", customerController.renderNewForm);

router.route("/:id")
  .get(wrapAsync(customerController.showCustomer))
  .put(validateCustomer, wrapAsync(customerController.updateCustomer))
  .delete(wrapAsync(customerController.destroyCustomer));

router.get("/:id/edit", wrapAsync(customerController.renderEditForm));

module.exports = router;
