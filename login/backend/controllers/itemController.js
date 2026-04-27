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
    const { title, price, category, condition, seller, name, roomNumber } = req.body;
    
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    const newItem = await Item.create({
      title,
      price: Number(price),
      category,
      condition,
      seller,
      name: name || seller,
      roomNumber: roomNumber || "N/A",
      images: imageUrls,
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating item", error: error.message });
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Public (or protected)
exports.updateItem = async (req, res) => {
  try {
    const { title, price, category, condition, name, roomNumber } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const updateData = {
      title: title || item.title,
      price: price ? Number(price) : item.price,
      category: category || item.category,
      condition: condition || item.condition,
      name: name || item.name,
      roomNumber: roomNumber || item.roomNumber,
    };

    if (req.files && req.files.length > 0) {
      // Delete old images if they exist
      const existingImages = item.images && item.images.length > 0 ? item.images : [];
      existingImages.forEach(img => {
        const oldImagePath = path.join(__dirname, '..', img);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      });
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating item", error: error.message });
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

    // Delete all associated images from disk
    const imagesToDelete = item.images && item.images.length > 0 ? item.images : [];
    imagesToDelete.forEach(img => {
      const imagePath = path.join(__dirname, '..', img);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Item removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
