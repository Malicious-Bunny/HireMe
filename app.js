const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fs = require('fs');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/Hireme', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

const User = require('./models/User');  // Ensure this path is correct
const Profile = require('./models/profile.js');  // Ensure this path is correct

// Middleware to parse JSON data
app.use(express.json());

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

const { Types: { ObjectId } } = require('mongoose');

function isValidObjectId(id) {
    return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
}

function validateObjectId(req, res, next) {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }
    next();
}

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://bigouawe:Bigouawe07@niguel0.7va3loc.mongodb.net/Hireme' })
}));

// Middleware to bind user and replace placeholders
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            req.user = user;
            res.locals.user = user;
        } catch (error) {
            console.error('Error fetching user:', error);
            req.user = null;
            res.locals.user = null;
        }
    } else {
        req.user = null;
        res.locals.user = null;
    }

    const originalSend = res.send.bind(res);
    res.send = (html) => {
        if (typeof html === 'string' && req.user) {
            html = replacePlaceholders(html, {
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            });
        }
        originalSend(html);
    };
    next();
});

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Middleware to check user role
function checkRole(role) {
    return function(req, res, next) {
        if (req.user && req.user.role === role) {
            return next();
        } else {
            res.status(403).send('Forbidden');
        }
    };
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

function replacePlaceholders(html, data) {
    let replacedHtml = html;
    for (const key in data) {
        const placeholder = `{%${key.toUpperCase()}%}`;
        replacedHtml = replacedHtml.replace(new RegExp(placeholder, 'g'), data[key]);
    }
    return replacedHtml;
}

function sendHtmlWithReplacements(res, filePath, data) {
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            res.status(500).send('Error reading HTML file');
            return;
        }
        const modifiedHtml = replacePlaceholders(html, data);
        res.send(modifiedHtml);
    });
}

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const dimensions = await sizeOf(req.file.path);
        if (dimensions.width <= 300 && dimensions.height <= 300) {
            const profile = await Profile.findOneAndUpdate(
                { userId: req.session.userId },
                { picture: req.file.filename },
                { new: true }
            );
            if (!profile) {
                const newProfile = new Profile({
                    userId: req.session.userId,
                    picture: req.file.filename
                });
                await newProfile.save();
            }
            res.json({ message: 'Image uploaded successfully', filename: req.file.filename });
        } else {
            fs.unlinkSync(req.file.path);
            res.status(400).json({ error: 'Image dimensions should not exceed 300x300 pixels' });
        }
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Error processing image' });
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const newUser = await User.create({ name, email, password, role });
        req.session.userId = newUser._id;
        res.status(200).json({ redirectUrl: role === 'recruiter' ? '/recruiter-dashboard' : '/employee-dashboard' });
    } catch (error) {
        console.error('Error signing up user:', error);
        res.status(500).json({ message: 'Error signing up user', error });
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        req.session.userId = user._id;
        res.status(200).json({ redirectUrl: user.role === 'recruiter' ? '/recruiter-dashboard' : '/employee-dashboard' });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in user', error });
    }
});

app.post('/save-profile', ensureAuthenticated, async (req, res) => {
    try {
        const { name, dob, pob, gender, skills, socialLinks } = req.body;
        const userId = req.session.userId;
        const profileData = { name, dob, pob, gender, skills, socialLinks, userId };
        let profile = await Profile.findOne({ userId });
        if (profile) {
            await Profile.updateOne({ userId }, profileData);
        } else {
            profile = await Profile.create(profileData);
        }
        res.status(200).json({ message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ message: 'Error saving profile', error });
    }
});

app.post('/delete-profile', ensureAuthenticated, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.session.userId;
        const user = await User.findById(userId).select('+password');
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        await User.findByIdAndDelete(userId);
        await Profile.findOneAndDelete({ userId });
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting profile', error: err });
            }
            res.status(200).json({ redirectUrl: '/login' });
        });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ message: 'Error deleting profile', error });
    }
});

// Apply validateObjectId middleware only to routes that need it
app.get('/:userId', validateObjectId, ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        const profile = await Profile.findOne({ userId });
        if (!user || !profile) {
            return res.status(404).send('Profile not found');
        }
        const data = {
            name: user.name,
            email: user.email,
            dob: profile.dob,
            pob: profile.pob,
            gender: profile.gender,
            skills: profile.skills,
            socialLinks: profile.socialLinks
        };
        sendHtmlWithReplacements(res, path.join(__dirname, 'public', 'profile-details.html'), data);
    } catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Error loading profile');
    }
});

app.get('/recruiter-dashboard', ensureAuthenticated, checkRole('recruiter'), async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const data = { name: user.name, picture: user.picture };
        sendHtmlWithReplacements(res, path.join(__dirname, 'public', 'recruiter-dashboard.html'), data);
    } catch (error) {
        console.error('Error loading recruiter dashboard:', error);
        res.status(500).send('Error loading recruiter dashboard');
    }
});

app.get('/employee-dashboard', ensureAuthenticated, checkRole('employee'), async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const data = { name: user.name, picture: user.picture };
        sendHtmlWithReplacements(res, path.join(__dirname, 'public', 'employee-dashboard.html'), data);
    } catch (error) {
        console.error('Error loading employee dashboard:', error);
        res.status(500).send('Error loading employee dashboard');
    }
});

app.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const profile = await Profile.findOne({ userId: user._id });
        const data = { name: user.name, email: user.email, dob: profile?.dob, pob: profile?.pob, gender: profile?.gender, skills: profile?.skills, socialLinks: profile?.socialLinks };
        sendHtmlWithReplacements(res, path.join(__dirname, 'public', 'profile-details.html'), data);
    } catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Error loading profile');
    }
});

app.get('/browse-profiles', ensureAuthenticated, async (req, res) => {
    try {
        const profiles = await Profile.find();
        const profileCards = profiles.map(profile => {
            const profileHtml = fs.readFileSync(path.join(__dirname, 'public', 'profile-card-template.html'), 'utf8');
            return replacePlaceholders(profileHtml, {
                PICTURE: profile.picture,
                NAME: profile.name,
                SKILLS: profile.skills.join(', '),
                USERID: profile.userId.toString()
            });
        }).join('');
        const finalHtml = replacePlaceholders(
            fs.readFileSync(path.join(__dirname, 'public', 'browseProfile-template.html'), 'utf8'),
            { 'PROFILES-CARDS': profileCards }
        );
        res.send(finalHtml);
    } catch (error) {
        console.error('Error loading profiles:', error);
        res.status(500).send('Error loading profiles');
    }
});

// Render the login page without applying the validateObjectId middleware
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/manage-profiles', ensureAuthenticated, checkRole('talent'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manage-profile.html'));
});

app.get('/chats', ensureAuthenticated, checkRole('talent'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat-template.html'));
});

app.get('/notifications', ensureAuthenticated, checkRole('talent'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notification.html'));
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
