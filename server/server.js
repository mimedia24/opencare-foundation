const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const donationRoutes = require('./routes/donationRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('API running...');
});

app.get('/test', (req, res) => {
  res.send('API working');
});

app.use('/api/donations', donationRoutes);

app.use('/api/expenses', expenseRoutes);

app.use('/api/stats', statsRoutes);


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});


