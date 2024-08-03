const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

const secretKey = 'your_secret_key'; // Use a more secure key in production

// Mock user data (password is 'password123' hashed using bcrypt)
const users = [
  {
    username: 'user1',
    password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIj.zBwxkZ7gAnr2s67o1J.K8vW2P0Sa', // hashed password for 'password123'
  },
];

// Mock expense data
let expenses = [
  { id: 1, user: 'user1', description: 'Groceries', amount: 50 },
  { id: 2, user: 'user1', description: 'Utilities', amount: 100 },
];

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.sendStatus(403);
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
};

// Endpoint for user login
app.post('/api/auth/login', [
  body('username').notEmpty().isString(),
  body('password').notEmpty().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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

  // Generate JWT
  const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });

  res.json({ message: 'Login successful', token });
});

// GET /api/expenses: Retrieve all expenses for a user
app.get('/api/expenses', authenticateJWT, (req, res) => {
  const userExpenses = expenses.filter(expense => expense.user === req.user.username);
  res.json(userExpenses);
});

// POST /api/expenses: Add a new expense for a user
app.post('/api/expenses', [
  authenticateJWT,
  body('description').notEmpty().isString(),
  body('amount').notEmpty().isFloat({ gt: 0 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { description, amount } = req.body;
  const newExpense = {
    id: expenses.length + 1,
    user: req.user.username,
    description,
    amount,
  };
  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

// PUT /api/expenses/:id: Update an existing expense
app.put('/api/expenses/:id', [
  authenticateJWT,
  body('description').optional().isString(),
  body('amount').optional().isFloat({ gt: 0 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { description, amount } = req.body;
  const expense = expenses.find(exp => exp.id === parseInt(id));

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  if (expense.user !== req.user.username) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  expense.description = description || expense.description;
  expense.amount = amount || expense.amount;

  res.json(expense);
});

// DELETE /api/expenses/:id: Delete an existing expense
app.delete('/api/expenses/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const expenseIndex = expenses.findIndex(exp => exp.id === parseInt(id));

  if (expenseIndex === -1) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  if (expenses[expenseIndex].user !== req.user.username) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  expenses.splice(expenseIndex, 1);
  res.status(204).send();
});

// GET /api/expense: Calculate the total expense for a user
app.get('/api/expense', authenticateJWT, (req, res) => {
  const userExpenses = expenses.filter(expense => expense.user === req.user.username);
  const totalAmount = userExpenses.reduce((total, expense) => total + expense.amount, 0);
  res.json({ totalExpense: totalAmount });
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
