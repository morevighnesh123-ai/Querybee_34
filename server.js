const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Dialogflow API endpoint
app.post('/api/dialogflow', async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Import Dialogflow client
    const { SessionsClient } = require('@google-cloud/dialogflow').v2;
    
    // Initialize Dialogflow client
    const dialogflowClient = new SessionsClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'querybee-key.json'
    });

    const sessionPath = dialogflowClient.projectAgentSessionPath(
      process.env.DIALOGFLOW_PROJECT_ID || 'querybee-project',
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
          languageCode: 'en-US',
        },
      },
    };

    const responses = await dialogflowClient.detectIntent(request);
    const result = responses[0].queryResult;
    
    const responseText = result.fulfillmentText || 'Sorry, I didn\'t understand that.';
    
    res.json({ 
      response: responseText,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Dialogflow API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`QueryBee API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
