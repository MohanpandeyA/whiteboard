// db.js
import mongoose from "mongoose";

const username = 'mohan';
const password = 'mohan123';

// URL format with username and password
const url = `mongodb+srv://${username}:${password}@m1.pdqi3fj.mongodb.net/?retryWrites=true&w=majority&appName=m1`;

const connectToDatabase = async () => {
    try {
        // Connect without deprecated options
        await mongoose.connect(url);
        console.log('Connected to the database :mongo db');
    } catch (err) {
        console.error(`Error connecting to the database: ${err}`);
    }
};

// Default export for ESM
export default connectToDatabase;
