const Item = require("../models/Item");
const { cloudinary } = require('../config/cloudinary');

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
      imageUrls = req.files.map(file => file.path); // Cloudinary URL
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
      // Delete old images if they exist on Cloudinary
      const existingImages = item.images && item.images.length > 0 ? item.images : [];
      for (const imgUrl of existingImages) {
        if (imgUrl.includes('cloudinary.com')) {
          // Extract public_id from Cloudinary URL
          const parts = imgUrl.split('/');
          const filename = parts.pop().split('.')[0];
          const folder = parts.pop();
          const publicId = `${folder}/${filename}`;
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Error deleting old image from Cloudinary:", err);
          }
        }
      }
      updateData.images = req.files.map(file => file.path); // Cloudinary URL
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

    // Delete all associated images from Cloudinary
    const imagesToDelete = item.images && item.images.length > 0 ? item.images : [];
    for (const imgUrl of imagesToDelete) {
      if (imgUrl.includes('cloudinary.com')) {
        const parts = imgUrl.split('/');
        const filename = parts.pop().split('.')[0];
        const folder = parts.pop();
        const publicId = `${folder}/${filename}`;
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Error deleting image from Cloudinary:", err);
        }
      }
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Item removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
