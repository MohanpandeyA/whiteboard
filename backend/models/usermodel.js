// models/usermodel.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxLength: 50 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 8 }
}, {
    timestamps: true,
    collection: 'users'
});

// Register
UserSchema.statics.register = async function(name, email, password) {
    if (!validator.isEmail(email)) throw new Error('Invalid email format');
    if (!validator.isStrongPassword(password, { minLength: 8 })) throw new Error('Password is not strong enough');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new this({ name, email, password: hashedPassword });
    return await user.save();
};

// Get all users
UserSchema.statics.getAllUsers = async function() {
    return await this.find();
};

// Login
UserSchema.statics.login = async function(email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('Invalid login credentials');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid login credentials');
    return user;
};

// Get a single user
UserSchema.statics.getUser = async function(email) {
    return await this.findOne({ email });
};

// ✅ default export for ESM
export default mongoose.model("User", UserSchema);
