const mongoose = require('mongoose');

const username = 'mohan';
const password = 'mohan123';

// URL format with username and password
const url = `mongodb+srv://${username}:${password}@m1.pdqi3fj.mongodb.net/?retryWrites=true&w=majority&appName=m1`;


const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const connectToDatabase = async () => {
    try {
        await mongoose.connect(url, connectionParams);
        console.log('Connected to the database');
    } catch (err) {
        console.error(`Error connecting to the database: ${err}`);
    }
};

module.exports = connectToDatabase;
