const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route for creating a profile
router.post('/', authMiddleware, profileController.createProfile);

// Route for getting a profile
router.get('/', authMiddleware, profileController.getProfile);

// Route for updating a profile
router.put('/', authMiddleware, profileController.updateProfile);

// Route for deleting a profile
router.delete('/', authMiddleware, profileController.deleteProfile);

module.exports = router;
