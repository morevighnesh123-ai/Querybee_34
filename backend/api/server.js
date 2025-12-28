const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { SessionsClient } = require('@google-cloud/dialogflow');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { GoogleAuth } = require('google-auth-library');
if (!process.env.VERCEL) {
  require('dotenv').config();
}

// Auto token generation for REST API
let cachedToken = null;
let tokenExpiry = null;
let authClientPromise = null;
 const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

async function getAccessToken() {
  if (cachedToken && tokenExpiry && Date.now() < (tokenExpiry - TOKEN_EXPIRY_BUFFER_MS)) {
    return cachedToken;
  }
  
  if (!authClientPromise) {
    const envCreds = process.env.GOOGLE_CREDS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log('GOOGLE_APPLICATION_CREDENTIALS length:', envCreds ? envCreds.length : 'undefined');
    console.log('GOOGLE_APPLICATION_CREDENTIALS first 100 chars:', envCreds ? envCreds.slice(0, 100) : 'undefined');
    if (!envCreds) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDS_JSON environment variable not set');
    }
    let credentials;
    if (envCreds.trim().startsWith('{')) {
      credentials = JSON.parse(envCreds.trim());
      console.log('Using service account JSON from env var');
    } else {
      throw new Error('Service account credentials must be a JSON object string in env var. Set GOOGLE_CREDS_JSON on Vercel.');
    }
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    authClientPromise = auth.getClient();
  }

  const client = await authClientPromise;
  const accessTokenResult = await client.getAccessToken();
  const token =
    typeof accessTokenResult === 'string'
      ? accessTokenResult
      : accessTokenResult && typeof accessTokenResult.token === 'string'
        ? accessTokenResult.token
        : null;

  if (!token) {
    throw new Error('Failed to acquire OAuth access token from service account');
  }

  cachedToken = token;
  tokenExpiry = Date.now() + (55 * 60 * 1000);
  return cachedToken;
}

// Vercel helper: if GOOGLE_APPLICATION_CREDENTIALS is a JSON string, write to temp file for GoogleAuth
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const envCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
  console.log('GOOGLE_APPLICATION_CREDENTIALS starts with {:', envCreds.startsWith('{'));
  if (envCreds.startsWith('{')) {
    const tmpPath = path.join(os.tmpdir(), 'querybee-service-account.json');
    fs.writeFileSync(tmpPath, envCreds, 'utf8');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    console.log('Wrote service-account JSON from env var to temp file:', tmpPath);
  } else {
    console.log('GOOGLE_APPLICATION_CREDENTIALS is a file path:', envCreds);
  }
} else {
  console.log('GOOGLE_APPLICATION_CREDENTIALS not set');
}

const app = express();
const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID || "querybee-owui";
const ACCESS_TOKEN = process.env.DIALOGFLOW_ACCESS_TOKEN;
const KNOWLEDGE_BASE_ID = process.env.DIALOGFLOW_KNOWLEDGE_BASE_ID || "MTU3Nzc5ODcxODU2NjExODE5NTM";

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

app.get('/api/test', (req, res) => {
  res.json({ message: "Backend working fine!" });
});

app.get('/api/token', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ accessToken: token });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/token-status', async (req, res) => {
  try {
    const hasManualToken = !!(process.env.DIALOGFLOW_ACCESS_TOKEN && process.env.DIALOGFLOW_ACCESS_TOKEN.trim());
    const hasServiceAccountJson = !!(process.env.GOOGLE_CREDS_JSON && process.env.GOOGLE_CREDS_JSON.trim().startsWith('{'));
    const hasGoogleAppCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const status = {
      projectId: PROJECT_ID,
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      hasManualToken,
      hasServiceAccountJson,
      hasGoogleAppCreds,
      cachedToken: !!cachedToken,
      tokenExpiryMs: tokenExpiry,
      tokenExpiresInSeconds: tokenExpiry ? Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000)) : null,
    };

    if (!hasManualToken) {
      await getAccessToken();
      status.cachedToken = !!cachedToken;
      status.tokenExpiryMs = tokenExpiry;
      status.tokenExpiresInSeconds = tokenExpiry ? Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000)) : null;
    }

    res.json({ status: 'ok', ...status });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/dialogflow', async (req, res) => {
  try {
    const userQuery = req.body.query;
    const sessionId = req.body.sessionId || uuidv4();
    if (!userQuery) {
      return res.status(400).json({ error: "Missing 'query' in request body" });
    }

    const hasManualToken = !!(ACCESS_TOKEN && ACCESS_TOKEN.trim().length > 0);
    const manualToken = hasManualToken ? ACCESS_TOKEN.trim() : null;
    const initialToken = hasManualToken
      ? (console.log('Using manual DIALOGFLOW_ACCESS_TOKEN'), manualToken)
      : (console.log('Using auto-generated token from service account'), await getAccessToken());

    const dialogflowUrl = `https://dialogflow.googleapis.com/v2beta1/projects/${PROJECT_ID}/agent/sessions/${sessionId}:detectIntent`;
    const kbPath = `projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`;

    const requestBody = {
      queryInput: {
        text: { text: userQuery, languageCode: 'en' }
      },
      queryParams: { knowledgeBaseNames: [kbPath] }
    };

    const doRequest = async (tokenToUse) => {
      return axios.post(dialogflowUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });
    };

    let response;
    try {
      response = await doRequest(initialToken);
    } catch (err) {
      const status = err?.response?.status;
      if (hasManualToken && (status === 401 || status === 403)) {
        console.log('Manual token rejected, retrying with service-account token');
        const serviceToken = await getAccessToken();
        response = await doRequest(serviceToken);
      } else {
        throw err;
      }
    }

    const result = response.data.queryResult;
    const reply = result.fulfillmentText || result.queryText || "Sorry, I didn't understand that.";
    res.json({
      sessionId,
      query: userQuery,
      response: reply,
      intent: result.intent?.displayName || 'unknown'
    });
  } catch (error) {
    console.error('Dialogflow error:', error);
    res.status(500).json({
      error: "Dialogflow API Error",
      response: error.response?.data?.error?.message || error.message,
      message: error.message,
      code: error.code || error.response?.status
    });
  }
});

module.exports = app;
