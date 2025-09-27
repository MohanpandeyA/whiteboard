const { getUserProfile } = require('../controllers/usercontroller');
const { registerUser,loginUser } = require('./controllers/usercontroller'); 
const router = require('express').Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile',getUserProfile);

module.exports = router;
