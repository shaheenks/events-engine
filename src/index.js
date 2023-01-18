require('dotenv').config();
const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP || 'DEFAULT';

const express = require('express');
const app = express();

app.use(express.json({limit: '2mb'})) // for parsing application/json

const eventsRoute = require('./routes/events');
app.use('/events', eventsRoute);

app.get('/', (req, res) => res.send( `${APP_NAME} service is running.`));

app.listen(PORT, () => {
    console.log(`[INFO_] ${new Date().toISOString()} ${APP_NAME} SYSTEM INDEX port ${PORT}`)
});