require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
// app.use(mongoSanitize()); // Incompatible with Express 5 req.query getter

// Rate Limiting
const limiter = rateLimit({
  max: 100, // Limit per IP per hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leethelper')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const problemRoutes = require('./routes/problems');
app.use('/api', problemRoutes);

// Handle Unhandled Routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

// Health Check Endpoint
app.use('/api/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Keep-Alive for Render (Free Tier)
  if (process.env.NODE_ENV === 'production') {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`; 

    if (process.env.SERVER_URL) {
        setInterval(() => {
        fetch(`${SERVER_URL}/api/health`)
            .then(() => console.log('Keep-alive ping successful'))
            .catch(err => console.error('Keep-alive ping failed:', err.message));
        }, 14 * 60 * 1000); // Ping every 14m
    }
  }
});
