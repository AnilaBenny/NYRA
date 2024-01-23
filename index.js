
const express = require('express');
const path = require('path');
const userRoute = require('./routes/userRoute'); 

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/', userRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/login`);
});
