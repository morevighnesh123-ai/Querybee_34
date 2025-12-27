const { SessionsClient } = require('@google-cloud/dialogflow');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
require('dotenv').config();

// Dialogflow configuration
const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID;
const KNOWLEDGE_BASE_ID = process.env.DIALOGFLOW_KNOWLEDGE_BASE_ID;
const USE_REST_API = !!process.env.DIALOGFLOW_ACCESS_TOKEN;

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
  tokenExpiry = Date.now() + (55 * 60 * 1000);
  
  return cachedToken;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
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
      const client = new SessionsClient({
        projectId: PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
      });
      
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
};
