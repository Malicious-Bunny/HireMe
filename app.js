const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fs = require('fs').promises;

const Profile = require('./models/Profile');
const User = require('./models/User');

const app = express();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/Hireme', {
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
  secret: 'D5BF2488EE739F9DCDF9447F7FBA9',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/Hireme' }),
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

      if (user) {
        const filePath = path.join(__dirname, 'public', req.path);
        const fileExists = await fs.stat(filePath).catch(() => false);

        if (fileExists && fileExists.isFile()) {
          const data = await fs.readFile(filePath, 'utf-8');
          let content = data.replace('{%NAME%}', user.name)
                            .replace('{%PICTURE%}', profile ? profile.profilePicture : 'https://thypix.com/wp-content/uploads/2021/11/sponge-bob-profile-picture-thypix-104-408x465.jpg');
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
    console.error(error);
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
    console.error(error);
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
    profile.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    profile.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
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

  console.log('Delete request received:', req.body); // Log incoming request data

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

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
    console.error('Error deleting profile:', error);
    res.status(500).json({ success: false, message: 'Error deleting profile' });
  }
});

// Function to inject user data into templates
const injectUserDataInTemplate = async (templatePath, user, profile) => {
  let template = await fs.readFile(templatePath, 'utf-8');
  template = template.replace('{%NAME%}', user.name)
                     .replace('{%PICTURE%}', profile ? profile.profilePicture : 'https://thypix.com/wp-content/uploads/2021/11/sponge-bob-profile-picture-thypix-104-408x465.jpg');
  return template;
};

// Routes to Serve HTML Templates with User Data
const routesWithTemplates = [
  { route: '/login', template: 'login.html' },
  { route: '/recruiter-dashboard', template: 'recruiter-dashboard.html' },
  { route: '/notifications', template: 'notification.html' },
  { route: '/chats', template: 'chat-template.html' },
  { route: '/hire', template: 'hire.html' },
  { route: '/employee-dashboard', template: 'employee-dashboard.html' },
  { route: '/manage-profiles', template: 'manage-profile.html' },
  { route: '/delete-profile', template: 'delete-profile.html' },
];

routesWithTemplates.forEach(({ route, template }) => {
  app.get(route, authenticate, injectUserData, async (req, res) => {
    const templatePath = path.join(__dirname, 'public', template);
    const user = await User.findById(req.session.user.id);
    const userProfile = await Profile.findOne({ userId: req.session.user.id });

    const content = await injectUserDataInTemplate(templatePath, user, userProfile);
    res.send(content);
  });
});

app.get('/browse-profiles', authenticate, injectUserData, async (req, res) => {
  try {
    const profiles = await Profile.find({});
    const profileCards = profiles.map(profile => `
      <a href="/profile-details/${profile.userId}">
        <div class="profile-card">
          <img src="${profile.profilePicture || 'https://thypix.com/wp-content/uploads/2021/11/sponge-bob-profile-picture-thypix-104-408x465.jpg'}" alt="${profile.name}" class="profile-card__image">
          <div class="profile-card__info">
            <h2 class="profile-card__name">${profile.name}</h2>
            <p class="profile-card__details">Skills: ${profile.skills.join(', ')}</p>
            <p class="profile-card__details">Experience: ${profile.experience} years</p>
            <p class="profile-card__details">Location: ${profile.location}</p>
          </div>
        </div>
      </a>
    `).join('');

    const templatePath = path.join(__dirname, 'public', 'browseProfile-template.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = template.replace('{%PROFILES-CARDS%}', profileCards);

    const user = await User.findById(req.session.user.id);
    const userProfile = await Profile.findOne({ userId: req.session.user.id });

    const userName = user ? user.name : 'Unknown User';
    const userProfilePicture = userProfile ? userProfile.profilePicture : 'https://thypix.com/wp-content/uploads/2021/11/sponge-bob-profile-picture-thypix-104-408x465.jpg';

    template = template.replace('{%NAME%}', userName).replace('{%PICTURE%}', userProfilePicture);

    res.send(template);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

app.get('/profile-details/:userId', authenticate, injectUserData, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const templatePath = path.join(__dirname, 'public', 'profile-details.html');
    let template = await fs.readFile(templatePath, 'utf-8');

    const user = await User.findById(req.session.user.id); // Ensure user is correctly fetched
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    template = template.replace('{%NAME%}', profile.name)
                      .replace('{%NAMES%}', user.name)
                      .replace(/{%PICTURE%}/g, profile.profilePicture || 'https://www.silviatormen.com/wp-content/uploads/2022/11/avatar-1577909_1280-1024x1024.webp')
                      .replace('{%BIO%}', profile.bio || 'No bio available')
                      .replace('{%SKILLS%}', profile.skills.join(', '))
                      .replace('{%EXPERIENCE%}', profile.experience)
                      .replace('{%PROJECTLINK%}', profile.projects && profile.projects.length > 0 ? profile.projects[0].link : '#');

    res.send(template);
  } catch (error) {
    console.error('Error fetching profile details:', error);
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

// Other Routes
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
