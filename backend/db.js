// db.js
import mongoose from "mongoose";

const connectToDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        await mongoose.connect(uri, {
            tls: true,
            tlsAllowInvalidCertificates: false,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error(`Warning: Could not connect to MongoDB: ${err.message}`);
        console.error('API routes requiring DB will fail until MongoDB is reachable.');
    }
};

// Default export for ESM
export default connectToDatabase;
