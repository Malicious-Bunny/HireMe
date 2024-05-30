const Profile = require('./models/Profile');

// Create a new profile
exports.createProfile = async (req, res) => {
  const { bio, skills, experience, project_links, social_media_links } = req.body;
  try {
    const profile = new Profile({
      user_id: req.user.id,
      bio,
      skills,
      experience,
      project_links,
      social_media_links
    });

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Retrieve a user's profile by ID
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update a profile
exports.updateProfile = async (req, res) => {
  const { bio, skills, experience, project_links, social_media_links } = req.body;
  const profileFields = { bio, skills, experience, project_links, social_media_links };
  try {
    let profile = await Profile.findOne({ user_id: req.user.id });
    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user_id: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }
    res.status(404).json({ msg: 'Profile not found' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a profile
exports.deleteProfile = async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user_id: req.user.id });
    res.json({ msg: 'Profile deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
