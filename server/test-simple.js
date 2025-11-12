// Simple test server - to check if Railway works at all
import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple test server is running',
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.send('Test server is working!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
});
