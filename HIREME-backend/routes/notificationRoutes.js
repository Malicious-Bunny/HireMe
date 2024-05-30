const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route for getting notifications
router.get('/', authMiddleware, notificationController.getNotifications);

// Route for marking a notification as read
router.put('/:notification_id/read', authMiddleware, notificationController.markAsRead);

module.exports = router;
