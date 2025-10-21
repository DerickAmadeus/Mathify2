const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/user');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Serve static files from the `public` folder (change if your static files are elsewhere)
app.use(express.static(path.join(__dirname, 'public')));

// Root: redirect to login or other entry page
app.get('/', (req, res) => {
  res.redirect('/calculator.html');
});

// Simple API to test DB
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to MongoDB using MONGO_URI from .env or fallback to local
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mydatabase';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');

  // Start server only after DB connects
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
  // Still start server so static files are available even if DB is down
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port} (DB not connected)`);
  });
});