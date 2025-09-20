const User = require('../models/usermodel'); // Assuming you have a User model

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const newUser = await User.registeruser({ name, email, password });
        res.status(201).json({
            success: true,
            data: newUser,
        })
    }
    catch (error) {
        res.status(400).json({ 'message:': error.message });
    }
}

module.exports = {
    registerUser
};