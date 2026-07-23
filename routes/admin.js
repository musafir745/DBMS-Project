const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {
  redirectIfAuthenticated,
  requireAdmin,
  validateLogin,
} = require("../middleware.js");
const authController = require("../controllers/auth.js");
const adminController = require("../controllers/admin.js");

router
  .route("/login")
  .get(redirectIfAuthenticated, authController.renderAdminLogin)
  .post(redirectIfAuthenticated, validateLogin, wrapAsync(authController.adminLogin));

router.get("/dashboard", requireAdmin, wrapAsync(adminController.dashboard));
router.post("/logout", requireAdmin, wrapAsync(authController.adminLogout));

module.exports = router;
