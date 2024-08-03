const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

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

// GET /api/expenses: Retrieve all expenses for a user
app.get('/api/expenses', (req, res) => {
  const userExpenses = expenses.filter(expense => expense.user === req.query.user);
  res.json(userExpenses);
});

// POST /api/expenses: Add a new expense for a user
app.post('/api/expenses', (req, res) => {
  const { user, description, amount } = req.body;
  const newExpense = {
    id: expenses.length + 1,
    user,
    description,
    amount,
  };
  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

// PUT /api/expenses/:id: Update an existing expense
app.put('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const { description, amount } = req.body;
  const expense = expenses.find(exp => exp.id === parseInt(id));

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  expense.description = description || expense.description;
  expense.amount = amount || expense.amount;

  res.json(expense);
});

// DELETE /api/expenses/:id: Delete an existing expense
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  expenses = expenses.filter(exp => exp.id !== parseInt(id));
  res.status(204).send();
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
