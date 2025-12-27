const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { SessionsClient } = require('@google-cloud/dialogflow');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

// Auto token generation for REST API
let cachedToken = null;
let tokenExpiry = null;
let authClientPromise = null;

async function getAccessToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  
  if (!authClientPromise) {
    authClientPromise = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    }).getClient();
  }
  
  const authClient = await authClientPromise;
  const token = await authClient.getAccessToken();
  
  cachedToken = token;
  tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes
  
  return cachedToken;
}

// Dialogflow configuration
const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID || 'your-project-id';
const KNOWLEDGE_BASE_ID = process.env.DIALOGFLOW_KNOWLEDGE_BASE_ID || 'your-knowledge-base-id';
const USE_REST_API = !!process.env.DIALOGFLOW_ACCESS_TOKEN;

// Initialize Dialogflow client
let client = null;
if (!USE_REST_API) {
  try {
    client = new SessionsClient({
      projectId: PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
    });
  } catch (error) {
    console.error('Error initializing Dialogflow client:', error.message);
  }
}

// Create Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all routes
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Dialogflow API endpoint
app.post('/dialogflow', async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query || !sessionId) {
      return res.status(400).json({ error: 'Query and sessionId are required' });
    }

    let response;
    
    if (USE_REST_API) {
      // Use REST API
      const accessToken = await getAccessToken();
      const apiUrl = `https://dialogflow.googleapis.com/v2/projects/${PROJECT_ID}/agent/sessions/${sessionId}:detectIntent`;
      
      const requestBody = {
        query_input: {
          text: {
            text: query,
            language_code: 'en'
          }
        }
      };
      
      if (KNOWLEDGE_BASE_ID && KNOWLEDGE_BASE_ID !== 'your-knowledge-base-id') {
        requestBody.query_input.knowledge_base_names = [`projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`];
      }
      
      const axiosResponse = await axios.post(apiUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      response = axiosResponse.data;
    } else {
      // Use client library
      if (!client) {
        return res.status(500).json({ error: 'Dialogflow client not initialized' });
      }
      
      const sessionPath = client.projectAgentSessionPath(PROJECT_ID, sessionId);
      
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: query,
            languageCode: 'en'
          }
        }
      };
      
      if (KNOWLEDGE_BASE_ID && KNOWLEDGE_BASE_ID !== 'your-knowledge-base-id') {
        request.queryInput.knowledgeBaseNames = [`projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`];
      }
      
      const [response_data] = await client.detectIntent(request);
      response = response_data;
    }
    
    const fulfillmentText = response.queryResult?.fulfillmentText || 'Sorry, I could not understand your request.';
    
    res.json({
      response: fulfillmentText,
      intent: response.queryResult?.intent?.displayName || 'Unknown',
      sessionId: sessionId
    });
    
  } catch (error) {
    console.error('Dialogflow API error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
});

// Export for Vercel
module.exports = app;
