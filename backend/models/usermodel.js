const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxLength: 50 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 8 }
}, {
    timestamps: true,
    collection: 'users'
});

// Register a new user
userschema.statics.registeruser = async function (name, email, password) {
    const user = new this({ name, email, password });
    return await user.save();
};

// Get all users
userschema.statics.getAllUsers = async function () {
    return await this.find();
};

// Login
userschema.statics.login = async function (email, password) {
    const user = await this.findOne({ email, password });
    if (!user) throw new Error('Invalid login credentials');
    return user;
};

const User = mongoose.model('User', userschema);
module.exports = User;
