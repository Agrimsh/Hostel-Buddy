const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const multer = require("multer");
const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.route("/")
  .get(itemController.getItems)
  .post(upload.array("images", 5), itemController.createItem);

router.route("/:id")
  .put(upload.array("images", 5), itemController.updateItem)
  .delete(itemController.deleteItem);

module.exports = router;
