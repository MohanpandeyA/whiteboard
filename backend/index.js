const express = require('express');
const app = express();
const connecttodb = require('./db');
const cors = require('cors');

const PORT = 3030;

connecttodb();
app.use(cors());
app.use(express.json());

// Uncomment these only when the files actually exist
// const userroutes = require('./routes/userRoutes');
// const registerroutes = require('./routes/registreroutes');
// const postRoutes = require('./routes/postroutes');

// app.use('/api/register', registerroutes);
// app.use('/api/post', postRoutes);
// app.use('/user', userroutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
