const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static Folders (for local uploads if still needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Registration
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/movies', require('./routes/movies'));

// Base Route
app.get('/', (req, res) => {
    res.json({ message: 'MovieApp Professional API is running...' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is active on port ${PORT}`);
    console.log(`🔗 Supabase & Cloudinary integration active.`);
});
