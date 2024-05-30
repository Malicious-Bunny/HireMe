const mongoose = require('mongoose');
const ProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String },
  skills: { type: [String] },
  experience: { type: String },
  project_links: { type: [String] },
  social_media_links: { type: [String] }
});
module.exports = mongoose.model('Profile', ProfileSchema);
