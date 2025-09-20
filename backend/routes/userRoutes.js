const { registerUser } = require('./controllers/usercontroller'); 
const router = require('express').Router();

router.post('/register', registerUser);

module.exports = router;
