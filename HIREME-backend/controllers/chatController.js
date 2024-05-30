const Chat = require('./models/Chat');
const Message = require('./models/Message');

// Initiate a new chat
exports.initiateChat = async (req, res) => {
  const { participants } = req.body;
  try {
    const chat = new Chat({ participants });
    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Send a message in a chat
exports.sendMessage = async (req, res) => {
  const { chat_id, sender, content } = req.body;
  try {
    const message = new Message({ chat_id, sender, content });
    await message.save();
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get messages in a chat
exports.getChatMessages = async (req, res) => {
  const { chat_id } = req.params;
  try {
    const messages = await Message.find({ chat_id });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
