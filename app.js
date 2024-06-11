const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fs = require('fs').promises;
const app = express();

const Profile = require('./models/Profile');
const User = require('./models/User');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'D5BF2488EE739F9DCDF9447F7FBA9',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/' }),
}));

// Authentication Middleware
const authenticate = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Access denied. No session found.' });
  }
  next();
};

// Middleware to Inject User Data
const injectUserData = async (req, res, next) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user.id);
      const profile = await Profile.findOne({ userId: req.session.user.id });

      if (user && profile) {
        const filePath = path.join(__dirname, 'public', req.path);
        const fileExists = await fs.stat(filePath).catch(() => false);

        if (fileExists && fileExists.isFile()) {
          const data = await fs.readFile(filePath, 'utf-8');
          let content = data.replace('{%NAME%}', user.name).replace('{%PICTURE%}', profile.profilePicture);
          return res.send(content);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }
  next();
};

// Route Handlers
app.post('/signup', upload.single('profile-picture'), async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : '';
    const user = new User({ name, email, password: hashedPassword, role, profilePicture });
    await user.save();
    req.session.user = { id: user._id, role: user.role };
    res.status(201).json({ message: 'User created successfully', redirectUrl: role === 'recruiter' ? '/recruiter-dashboard' : '/employee-dashboard' });
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    req.session.user = { id: user._id, role: user.role };
    res.status(200).json({ message: 'Login successful', redirectUrl: user.role === 'recruiter' ? '/recruiter-dashboard' : '/employee-dashboard' });
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed, please try again' });
    }
    res.redirect('/login');
  });
});

app.post('/save-profile', authenticate, upload.single('picture'), async (req, res) => {
  try {
    const { name, dob, pob, gender, location, experience, skills, socialLinks } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : '';

    let profile = await Profile.findOne({ userId: req.session.user.id });
    if (!profile) {
      profile = new Profile({ userId: req.session.user.id });
    }

    profile.name = name;
    profile.dob = dob;
    profile.pob = pob;
    profile.gender = gender;
    profile.location = location;
    profile.experience = experience;
    profile.skills = JSON.parse(skills);
    profile.socialLinks = JSON.parse(socialLinks);
    profile.profilePicture = profilePicture;

    await profile.save();
    console.log('Profile saved successfully:', profile);
    res.status(200).json({ success: true, message: 'Profile saved successfully' });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ success: false, message: 'Error saving profile' });
  }
});


const deleteAttempts = {};

app.post('/delete-profile', authenticate, async (req, res) => {
  const userId = req.session.user.id;
  const { password } = req.body;

  if (!deleteAttempts[userId]) {
    deleteAttempts[userId] = { attempts: 0, cooldown: null };
  }

  if (deleteAttempts[userId].cooldown && deleteAttempts[userId].cooldown > Date.now()) {
    return res.status(403).json({ success: false, message: 'Too many attempts. Try again later.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      deleteAttempts[userId].attempts += 1;
      if (deleteAttempts[userId].attempts >= 5) {
        deleteAttempts[userId].cooldown = Date.now() + 30 * 60 * 1000; // 30 minutes
      }
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    await User.findByIdAndDelete(userId);
    await Profile.findOneAndDelete({ userId });
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error deleting profile' });
      }
      res.status(200).json({ success: true, message: 'Profile deleted successfully', redirectUrl: '/login' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting profile' });
  }
});

// Frontend Routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/recruiter-dashboard', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'recruiter-dashboard.html')));
app.get('/browse-profiles', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'browseProfile-template.html')));
app.get('/notifications', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'notification.html')));
app.get('/chats', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat-template.html')));
app.get('/hire', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'hire.html')));
app.get('/employee-dashboard', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html')));
app.get('/manage-profiles', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'manage-profile.html')));
app.get('/notification', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'notification.html')));
app.get('/job-request', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'job-request.html')));
app.get('/chat', authenticate, injectUserData, (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat-template.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
