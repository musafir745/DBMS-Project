const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { validateRoom, requireAdmin } = require("../middleware.js");
const roomController = require("../controllers/rooms.js");

router.use(requireAdmin);

router.route("/")
  .get(wrapAsync(roomController.index))
  .post(validateRoom, wrapAsync(roomController.createRoom));

router.get("/new", wrapAsync(roomController.renderNewForm));

router.route("/:id")
  .get(wrapAsync(roomController.showRoom))
  .put(validateRoom, wrapAsync(roomController.updateRoom))
  .delete(wrapAsync(roomController.destroyRoom));

router.get("/:id/edit", wrapAsync(roomController.renderEditForm));

module.exports = router;
