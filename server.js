const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import configurations and middleware
const { connectDB } = require('./src/config/supabase');
const cleanUrlMiddleware = require('./src/middleware/cleanUrl');

// Import routes
const usersRouter = require('./src/routes/users');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Clean URL middleware (serve HTML without .html extension)
app.use(cleanUrlMiddleware);

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

// API Routes
app.use('/api/users', usersRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}` 
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Start server
const startServer = async () => {
  // Try to connect to MongoDB
  await connectDB();

  // Start Express server (even if DB fails)
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();