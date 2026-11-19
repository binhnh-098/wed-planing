require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const weddingRoutes = require('./routes/weddings');
const taskRoutes = require('./routes/tasks');
const budgetRoutes = require('./routes/budget');
const guestRoutes = require('./routes/guests');
const vendorRoutes = require('./routes/vendors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/weddings', weddingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/vendors', vendorRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Wedding Planner API listening on port ${port}`);
});
