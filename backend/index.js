
const express = require('express');
const app = express();
const connecttodb = require('./db');
const cors=require('cors');
const PORT = 3030;
const userroutes = require('backend/routes/userRoutes');
// const registerroutes=require('./routes/registreroutes');
// const postRoutes=require('./routes/postroutes')


connecttodb();
app.use(cors());
app.use(express.json());


//app.use('/api/register',registerroutes);
// app.use('/api/post',postRoutes);
app.use('/user',userroutes);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});