const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import configurations and middleware
const { connectDB } = require('./src/config/supabase');
const cleanUrlMiddleware = require('./src/middleware/cleanUrl');
const { swaggerUi, specs } = require('./src/config/swagger');


// Import routes
const usersRouter = require('./src/routes/users');
const modulesRouter = require('./src/routes/modules');
const calculatorRoutes = require('./src/routes/calculator');
const questionsRouter = require('./src/routes/questions');
const graphRoutes = require('./src/routes/graph');

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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/questions', questionsRouter);
app.use('/api/graph', graphRoutes);

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
  try {
    // Connect to Supabase
    await connectDB();

    // Start Express server
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();