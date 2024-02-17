import express from "express";
import { APP_PORT, DB_URL } from "./config/index.js";
import routes from './routes/index.js';
import errorHandler from "./middlewares/errorHandler.js";
import mongoose from "mongoose";

//path module
import path from 'path';
import {fileURLToPath} from 'url';

const app = express();

// Database connection
mongoose.connect(DB_URL);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('DB connected');
});


// global varibale && // use path module in ES6 in node && express
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
global.appRoot = path.resolve(__dirname);

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use('/api', routes);
app.use('/uploads', express.static('uploads'));

app.use(errorHandler);
app.listen(APP_PORT, () => console.log(`Listening the port ${APP_PORT}`));