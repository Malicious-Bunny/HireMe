const User = require('./models/User');

const bindUser = async (req, res, next) => {
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
    next();
};

const ensureAuthenticated = (req, res, next) => {
    if (req.user) {
        return next();
    }
    res.redirect('/login');  // Adjust this if you have a different login path
};

const checkRole = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
        return next();
    }
    res.status(403).send('Access denied.');
};

module.exports = { bindUser, ensureAuthenticated, checkRole };
