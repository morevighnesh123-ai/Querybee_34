const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());

// Mock Dialogflow endpoint
app.post('/api/dialogflow', (req, res) => {
  const { query, sessionId } = req.body;
  let response = "I'm QueryBee! How can I help you?";
  
  if (query.toLowerCase().includes('hello')) {
    response = "Hello! Welcome to QueryBee!";
  } else if (query.toLowerCase().includes('admission')) {
    response = "For admission info, please visit the college office.";
  } else if (query.toLowerCase().includes('course')) {
    response = "We offer various courses in Engineering, Science, and Management.";
  } else if (query.toLowerCase().includes('fee')) {
    response = "Please contact the accounts department for fee information.";
  }
  
  res.json({
    sessionId: sessionId || 'mock-session',
    query: query,
    response: response,
    intent: 'mock-intent'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: "Mock backend working!" });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
});
