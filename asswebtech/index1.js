const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Mock user data
const users = [
  {
    username: 'user1',
    password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIj.zBwxkZ7gAnr2s67o1J.K8vW2P0Sa', // hashed password for 'password123'
  },
];

// Endpoint for user login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Compare password
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({ message: 'Login successful' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
