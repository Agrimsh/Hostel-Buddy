const Message = require("../models/Message");

/**
 * @desc    Get chat history between two users for a specific item
 * @route   GET /api/chat/history?sender=X&receiver=Y&itemId=Z
 * @access  Public (should be protected in production)
 */
exports.getHistory = async (req, res) => {
  try {
    const { sender, receiver, itemId } = req.query;

    if (!sender || !receiver || !itemId) {
      return res.status(400).json({
        success: false,
        message: "sender, receiver, and itemId are required",
      });
    }

    const messages = await Message.find({
      itemId,
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all conversations for a user (inbox view)
 * @route   GET /api/chat/conversations?user=X
 * @access  Public (should be protected in production)
 */
exports.getConversations = async (req, res) => {
  try {
    const { user, itemId } = req.query;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user query parameter is required",
      });
    }

    // Build match filter
    const matchFilter = {
      $or: [{ sender: user }, { receiver: user }],
    };

    // Optional: scope to a specific item
    if (itemId) {
      matchFilter.itemId = itemId;
    }

    // Aggregate to find latest message per unique conversation
    const conversations = await Message.aggregate([
      {
        $match: matchFilter,
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            itemId: "$itemId",
            // Create a canonical key so both directions group together
            participants: {
              $cond: {
                if: { $lt: ["$sender", "$receiver"] },
                then: { $concat: ["$sender", "_", "$receiver"] },
                else: { $concat: ["$receiver", "_", "$sender"] },
              },
            },
          },
          lastMessage: { $first: "$message" },
          lastTimestamp: { $first: "$createdAt" },
          sender: { $first: "$sender" },
          receiver: { $first: "$receiver" },
          itemTitle: { $first: "$itemTitle" },
          itemId: { $first: "$itemId" },
        },
      },
      { $sort: { lastTimestamp: -1 } },
    ]);

    // Map to a cleaner response shape
    const result = conversations.map((conv) => {
      const otherUser =
        conv.sender === user ? conv.receiver : conv.sender;
      return {
        otherUser,
        itemId: conv.itemId,
        itemTitle: conv.itemTitle,
        lastMessage: conv.lastMessage,
        lastTimestamp: conv.lastTimestamp,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
