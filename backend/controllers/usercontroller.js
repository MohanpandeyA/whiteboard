const User = require('../models/usermodel');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_here';

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

    // Create a JWT token
    const token = jwt.sign(
      { email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return response with token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: token
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the authorization header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Validate the token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.email) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get the user’s profile using the email from the token
    const user = await userModel.getUser(decoded.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user profile
    return res.status(200).json({
      message: 'User profile retrieved successfully',
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};