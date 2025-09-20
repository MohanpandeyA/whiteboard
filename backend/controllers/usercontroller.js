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
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use the model's static login method
    const user = await User.login(email, password);

    // Return response in the format from the image
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: error.message });
  }
};


module.exports = {
    registerUser,
    loginUser,
};