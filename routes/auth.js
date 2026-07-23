const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {
  redirectIfAuthenticated,
  requireCustomer,
  validateRegistration,
  validateLogin,
} = require("../middleware.js");
const authController = require("../controllers/auth.js");

router
  .route("/register")
  .get(redirectIfAuthenticated, authController.renderRegister)
  .post(redirectIfAuthenticated, validateRegistration, wrapAsync(authController.register));

router
  .route("/login")
  .get(redirectIfAuthenticated, authController.renderCustomerLogin)
  .post(redirectIfAuthenticated, validateLogin, wrapAsync(authController.customerLogin));

router.post("/logout", requireCustomer, wrapAsync(authController.customerLogout));

module.exports = router;
