const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    pob: { type: String, required: true },
    gender: { type: String, required: true },
    location: { type: String, required: true },
    experience: { type: String, required: true },
    skills: { type: [String], default: [] },
    socialLinks: { type: [String], default: [] },
    picture: { type: String }
});

const Profile = mongoose.model('Profile', ProfileSchema);

module.exports = Profile;
