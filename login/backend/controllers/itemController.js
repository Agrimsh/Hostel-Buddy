const Item = require("../models/Item");
const fs = require('fs');
const path = require('path');

// @desc    Get all items
// @route   GET /api/items
// @access  Public (or protected, depending on requirements)
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Create a new item
// @route   POST /api/items
// @access  Public (or protected)
exports.createItem = async (req, res) => {
  try {
    const { title, price, category, condition, seller } = req.body;
    
    let imageUrl = "";
    if (req.file) {
      // The file is uploaded to the 'uploads' folder
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const newItem = await Item.create({
      title,
      price: Number(price),
      category,
      condition,
      seller,
      image: imageUrl,
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating item", error: error.message });
  }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Public (or protected)
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Optional: Delete the image file from server if it exists
    if (item.image) {
      const imagePath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Item removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
