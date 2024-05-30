const Notification = require('./models/Notification');

// Retrieve notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id });
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  const { notification_id } = req.params;
  try {
    await Notification.findByIdAndUpdate(notification_id, { read: true });
    res.json({ msg: 'Notification marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
