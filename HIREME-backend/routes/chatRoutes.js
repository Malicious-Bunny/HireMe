const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route for initiating a chat
router.post('/initiate', authMiddleware, chatController.initiateChat);

// Route for sending a message
router.post('/message', authMiddleware, chatController.sendMessage);

// Route for getting chat messages
router.get('/:chat_id/messages', authMiddleware, chatController.getChatMessages);

module.exports = router;
