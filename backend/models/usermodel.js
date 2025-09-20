const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const validator = require('validator'); // Import validator for email validation

const userschema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxLength: 50 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 8 }
}, {
    timestamps: true,
    collection: 'users'
});

// Register a new user

userSchema.statics.register = async function (name, email, password) {
    try {
        // Validate email
        if (!validator.isEmail(email)) {
            throw new Error('Invalid email format');
        }

        // Validate password strength
        if (!validator.isStrongPassword(password, { minLength: 8})) {
            throw new Error('Password is not strong enough');
        }

        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password using the salt
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user with the hashed password
        const user = new this({
            name,
            email,
            password: hashedPassword // Save the hashed password
        });

        // Save the user to the database
        const newUser = await user.save();
        return newUser;

    } catch (error) {
        throw new Error('Error registering user: ' + error.message);
    }
};


// Get all users
userschema.statics.getAllUsers = async function () {
    return await this.find();
};

// Login
const bcrypt = require('bcrypt');

userSchema.statics.login = async function (email, password) {
  try {
    // Find the user by email
    const user = await this.findOne({ email });
    if (!user) {
      throw new Error('Invalid login credentials');
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid login credentials');
    }

    // Return the user if authentication is successful
    return user;

  } catch (error) {
    throw new Error('Error logging in: ' + error.message);
  }
};


const User = mongoose.model('User', userschema);
module.exports = User;
