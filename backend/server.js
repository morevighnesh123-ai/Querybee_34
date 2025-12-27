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
    const auth = new GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    authClientPromise = auth.getClient();
  }

  const client = await authClientPromise;

  // google-auth-library versions differ:
  // - sometimes returns a string
  // - sometimes returns { token: string }
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
  tokenExpiry = Date.now() + (55 * 60 * 1000); // refresh ~5 min before typical 1h expiry

  return cachedToken;
}

// Make sure the Dialogflow service-account path is permanently configured
const SERVICE_ACCOUNT_PATH =
  'C:\\Users\\morev\\OneDrive\\Desktop\\QueryBee\\querybee-key.json';

// Vercel helper: if GOOGLE_APPLICATION_CREDENTIALS is a JSON string, write to temp file for GoogleAuth
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  const envCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
  if (envCreds.startsWith('{')) {
    const tmpPath = path.join(__dirname, 'tmp-service-account.json');
    fs.writeFileSync(tmpPath, envCreds);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    console.log('Wrote service-account JSON from env var to temp file:', tmpPath);
  }
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && SERVICE_ACCOUNT_PATH && fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = SERVICE_ACCOUNT_PATH;
  console.log(`Using Dialogflow service-account key from: ${SERVICE_ACCOUNT_PATH}`);
}

const app = express();
const port = 3000;

// Dialogflow Project ID
const PROJECT_ID = process.env.DF_PROJECT_ID || process.env.DIALOGFLOW_PROJECT_ID || "querybee-owui";
const ACCESS_TOKEN = process.env.DIALOGFLOW_ACCESS_TOKEN;
const USE_REST_API = true; // Force REST API for better KB support
const KNOWLEDGE_BASE_ID = process.env.DF_KNOWLEDGE_BASE_IDS || process.env.DIALOGFLOW_KNOWLEDGE_BASE_ID || "MTU3Nzc5ODcxODU2NjExODE5NTM";

// Log configuration on startup
console.log("\n=== Dialogflow Configuration ===");
console.log("Project ID:", PROJECT_ID);
console.log("Knowledge Base ID:", KNOWLEDGE_BASE_ID);
console.log("Using REST API:", USE_REST_API);
console.log("Service Account Path:", SERVICE_ACCOUNT_PATH);
console.log("Has DIALOGFLOW_ACCESS_TOKEN:", !!(ACCESS_TOKEN && ACCESS_TOKEN.trim().length > 0));
console.log("================================\n");

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

// Middleware
app.use(bodyParser.json());

// Dialogflow client configuration (uses service account JSON or REST API with access token)
let client;
if (!USE_REST_API) {
  try {
    // If GOOGLE_APPLICATION_CREDENTIALS is set, use it; otherwise use default credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Using service account from:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }
    client = new SessionsClient({ apiEndpoint: 'dialogflow.googleapis.com' });
    console.log('✓ Using Google Cloud Dialogflow SDK');
  } catch (error) {
    console.error('Failed to initialize Dialogflow SDK:', error.message);
    console.error('Falling back to REST API...');
    client = null;
  }
} else {
  console.log('✓ Using Dialogflow REST API');
}

// Serve static files - check both backend/public and root public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// -----------------------------
// Detect Intent API (Main Route)
// -----------------------------
// Helper function to call Dialogflow using REST API
async function callDialogflowREST(userQuery, sessionId) {
  // Use v2beta1 for Dialogflow ES (Essentials) - more reliable
  const dialogflowUrl = `https://dialogflow.googleapis.com/v2beta1/projects/${PROJECT_ID}/agent/sessions/${sessionId}:detectIntent`;
  const kbPath = `projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`;

  console.log("REST API - KB Path:", kbPath);
  console.log("REST API - Project ID:", PROJECT_ID);
  console.log("REST API - KB ID:", KNOWLEDGE_BASE_ID);

  const requestBody = {
    queryInput: {
      text: {
        text: userQuery,
        languageCode: 'en'
      }
    },
    queryParams: {
      knowledgeBaseNames: [kbPath]
    }
  };

  console.log("REST API Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    // Prefer user-provided access token from .env; fall back to service-account token generation.
    const accessToken = ACCESS_TOKEN && ACCESS_TOKEN.trim().length > 0
      ? ACCESS_TOKEN.trim()
      : await getAccessToken();
    
    const response = await axios.post(dialogflowUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.queryResult;
  } catch (error) {
    // Log detailed error for debugging
    if (error.response) {
      console.error('Dialogflow REST API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw error;
  }
}

app.post('/api/dialogflow', async (req, res) => {
  console.log("Incoming request body:", req.body);

  try {
    const userQuery = req.body.query;
    const sessionId = req.body.sessionId || uuidv4();

    if (!userQuery) {
      return res.status(400).json({ error: "Missing 'query' in request body" });
    }

    let result;

    if (USE_REST_API) {
      // Use REST API with auto-generated access token
      console.log("Using REST API with auto-generated access token");
      console.log(`Project ID: ${PROJECT_ID}, Session ID: ${sessionId}`);
      result = await callDialogflowREST(userQuery, sessionId);
    } else if (client) {
      // Use SDK with service account
      console.log("Using SDK with service account");
      const sessionPath = client.projectAgentSessionPath(PROJECT_ID, sessionId);

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: userQuery,
            languageCode: 'en'
          }
        },
        knowledgeBaseNames: [
          `projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`
        ]
      };

      console.log("Sending request to Dialogflow:", JSON.stringify(request, null, 2));
      console.log("KB Path being used:", `projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`);

      const [response] = await client.detectIntent(request);
      result = response.queryResult;
    } else {
      return res.status(500).json({
        error: "Dialogflow client not configured",
        response: "Please configure Dialogflow credentials. Set either DIALOGFLOW_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS environment variable."
      });
    }

    console.log("=== FULL DIALOGFLOW RESPONSE ===");
    console.log(JSON.stringify(result, null, 2));
    console.log("================================");

    console.log("Dialogflow response:", JSON.stringify(result, null, 2));
    console.log("Knowledge Base ID being used:", KNOWLEDGE_BASE_ID);
    console.log("Project ID:", PROJECT_ID);

    // Check for Knowledge Base answers first, then fallback to fulfillment text
    let fulfillmentText = "Sorry, I didn't understand that.";
    let kbSource = false;

    // Check if answer came from Knowledge Base
    // Dialogflow KB responses can be in different structures
    if (result.knowledgeAnswers) {
      console.log("Knowledge Answers found:", JSON.stringify(result.knowledgeAnswers, null, 2));

      if (result.knowledgeAnswers.answers && result.knowledgeAnswers.answers.length > 0) {
        const kbAnswer = result.knowledgeAnswers.answers[0];
        console.log("KB Answer object:", JSON.stringify(kbAnswer, null, 2));

        // Try different possible answer fields - Dialogflow KB can return answers in various formats
        if (kbAnswer.answer) {
          // Direct answer field
          fulfillmentText = kbAnswer.answer;
          kbSource = true;
        } else if (kbAnswer.faqAnswer && kbAnswer.faqAnswer.answer) {
          // FAQ answer structure
          fulfillmentText = kbAnswer.faqAnswer.answer;
          kbSource = true;
        } else if (kbAnswer.source && kbAnswer.source) {
          // Sometimes answer is in source
          fulfillmentText = kbAnswer.source;
          kbSource = true;
        } else if (typeof kbAnswer === 'string') {
          // Answer is the string itself
          fulfillmentText = kbAnswer;
          kbSource = true;
        } else {
          // Log the full structure to help debug
          console.log("⚠️ KB answer structure not recognized. Full object:", JSON.stringify(kbAnswer, null, 2));
          console.log("⚠️ Available keys:", Object.keys(kbAnswer));
        }

        // If we still don't have an answer, check if fulfillmentText was already set by Dialogflow
        // Dialogflow ES sometimes merges KB answers directly into fulfillmentText
        if (!kbSource && result.fulfillmentText && result.fulfillmentText !== "Sorry, I didn't understand that.") {
          // If knowledgeAnswers exists, Dialogflow likely merged KB answer into fulfillmentText
          fulfillmentText = result.fulfillmentText;
          kbSource = true;
          console.log("✓ KB answer found in fulfillmentText (merged by Dialogflow):", fulfillmentText);
        } else if (kbSource) {
          console.log("✓ Answer from Knowledge Base:", fulfillmentText);
        } else {
          console.log("⚠️ KB answer found but couldn't extract text from structure");
        }
      } else {
        console.log("⚠️ knowledgeAnswers.answers is empty or missing");
      }
    } else {
      console.log("⚠️ No knowledgeAnswers in response - KB may not be enabled or query didn't match");
      // Even if no knowledgeAnswers object, Dialogflow might have merged KB answer into fulfillmentText
      if (result.fulfillmentText && result.fulfillmentText !== "Sorry, I didn't understand that.") {
        // Check if intent is a fallback - if so, might be KB answer
        if (result.intent && result.intent.displayName && result.intent.displayName.includes('Default')) {
          console.log("⚠️ Using fulfillmentText as potential KB answer (fallback intent)");
        }
      }
    }

    // Fallback to regular fulfillment text if KB didn't provide answer
    if (!kbSource) {
      fulfillmentText = result.fulfillmentText ||
        result.fulfillmentMessages?.[0]?.text?.text?.[0] ||
        fulfillmentText;
      console.log("Using intent fulfillment text:", fulfillmentText);
    }

    res.json({
      sessionId,
      query: result.queryText || userQuery,
      response: fulfillmentText,
      intent: result.intent ? result.intent.displayName : null,
      source: result.knowledgeAnswers && result.knowledgeAnswers.answers && result.knowledgeAnswers.answers.length > 0 ? "knowledge_base" : "intent"
    });
  } catch (error) {
    console.error("\n=== Dialogflow Error ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code || error.response?.status);
    console.error("Error details:", error.details || error.response?.data);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("======================\n");

    // Provide user-friendly error messages
    let errorMessage = "Sorry, I encountered an error communicating with Dialogflow.";

    if (error.response?.status === 401 || error.code === 7) {
      errorMessage = "Dialogflow authentication failed. Your access token may be expired. Please get a new token.";
    } else if (error.response?.status === 403 || error.code === 7) {
      errorMessage = "Access denied. Please check that Dialogflow API is enabled and your credentials have correct permissions.";
    } else if (error.response?.status === 404 || error.code === 5) {
      errorMessage = `Dialogflow project not found. Please verify your project ID "${PROJECT_ID}" is correct.`;
    } else if (error.response?.data?.error) {
      errorMessage = `Dialogflow error: ${error.response.data.error.message || JSON.stringify(error.response.data.error)}`;
    } else if (error.code === 3) {
      errorMessage = "Invalid request to Dialogflow. Please check your project configuration.";
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }

    res.status(500).json({
      error: "Dialogflow API Error",
      response: errorMessage, // Use 'response' to match frontend expectation
      message: error.message || "No error message provided",
      code: error.code || error.response?.status || "No code",
      details: process.env.NODE_ENV === 'development' ? (error.details || error.response?.data) : undefined
    });
  }
});

// GET endpoint for backward compatibility
app.get('/api/dialogflow', async (req, res) => {
  // Handle GET request - reuse same logic as POST
  req.body = {
    query: req.query.query,
    sessionId: req.query.sessionId || uuidv4()
  };

  // Call the POST handler logic directly
  try {
    const userQuery = req.body.query;
    const sessionId = req.body.sessionId;

    if (!userQuery) {
      return res.status(400).json({ error: "Missing 'query' in query string" });
    }

    let result;

    if (USE_REST_API) {
      result = await callDialogflowREST(userQuery, sessionId);
    } else if (client) {
      const sessionPath = client.projectAgentSessionPath(PROJECT_ID, sessionId);
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: userQuery,
            languageCode: 'en'
          }
        },
        queryParams: {
          knowledgeBaseNames: [
            `projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`
          ]
        }
      };
      const [response] = await client.detectIntent(request);
      result = response.queryResult;
    } else {
      return res.status(500).json({
        error: "Dialogflow client not configured",
        response: "Please configure Dialogflow credentials."
      });
    }

    console.log("GET - Dialogflow response:", JSON.stringify(result, null, 2));

    // Check for Knowledge Base answers first, then fallback to fulfillment text
    let fulfillmentText = "Sorry, I didn't understand that.";
    let kbSource = false;

    if (result.knowledgeAnswers) {
      console.log("GET - Knowledge Answers found:", JSON.stringify(result.knowledgeAnswers, null, 2));

      if (result.knowledgeAnswers.answers && result.knowledgeAnswers.answers.length > 0) {
        const kbAnswer = result.knowledgeAnswers.answers[0];
        fulfillmentText = kbAnswer.answer ||
          kbAnswer.faqAnswer?.answer ||
          kbAnswer.matchConfidence ||
          (typeof kbAnswer === 'string' ? kbAnswer : fulfillmentText);

        if (fulfillmentText && fulfillmentText !== "Sorry, I didn't understand that.") {
          kbSource = true;
          console.log("GET - ✓ Answer from Knowledge Base:", fulfillmentText);
        }
      }
    }

    if (!kbSource) {
      fulfillmentText = result.fulfillmentText ||
        result.fulfillmentMessages?.[0]?.text?.text?.[0] ||
        fulfillmentText;
    }

    res.json({
      sessionId,
      query: result.queryText || userQuery,
      response: fulfillmentText,
      intent: result.intent ? result.intent.displayName : null,
      source: kbSource ? "knowledge_base" : "intent",
      kbDebug: result.knowledgeAnswers ? {
        hasAnswers: !!(result.knowledgeAnswers.answers && result.knowledgeAnswers.answers.length > 0),
        answerCount: result.knowledgeAnswers.answers ? result.knowledgeAnswers.answers.length : 0
      } : null
    });
  } catch (error) {
    console.error("Dialogflow GET error:", error.message);
    res.status(500).json({
      error: "Dialogflow API Error",
      response: error.message || "An error occurred",
      code: error.code || error.response?.status
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend working fine!" });
});

// Diagnostic endpoint for KB configuration
app.get('/api/diagnose', (req, res) => {
  res.json({
    projectId: PROJECT_ID,
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    kbPath: `projects/${PROJECT_ID}/knowledgeBases/${KNOWLEDGE_BASE_ID}`,
    usingRestApi: USE_REST_API,
    hasServiceAccount: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    serviceAccountPath: SERVICE_ACCOUNT_PATH,
    envVars: {
      DIALOGFLOW_PROJECT_ID: process.env.DIALOGFLOW_PROJECT_ID || process.env.DF_PROJECT_ID,
      DIALOGFLOW_KNOWLEDGE_BASE_ID: process.env.DIALOGFLOW_KNOWLEDGE_BASE_ID || process.env.DF_KNOWLEDGE_BASE_IDS,
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET'
    }
  });
});

// Serve index.html for root route
app.get('/', (req, res) => {
  // Try both locations
  const indexPaths = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, '..', 'public', 'index.html')
  ];

  for (const indexPath of indexPaths) {
    if (require('fs').existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  res.status(404).json({ error: 'index.html not found' });
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Server running at http://localhost:${port}`);
  console.log(`📋 Dialogflow Project ID: ${PROJECT_ID}`);
  console.log(`📚 Knowledge Base ID: ${KNOWLEDGE_BASE_ID}`);
  if (USE_REST_API) {
    if (ACCESS_TOKEN && ACCESS_TOKEN.trim().length > 0) {
      console.log('✓ Authentication: Using REST API with DIALOGFLOW_ACCESS_TOKEN (.env)');
    } else {
      console.log('✓ Authentication: Using REST API with service-account generated token');
    }
  } else if (client) {
    console.log('✓ Authentication: Using Google Cloud SDK');
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('⚠️  Using default credentials. For production, set GOOGLE_APPLICATION_CREDENTIALS');
    }
  } else {
    console.error('❌ ERROR: No Dialogflow credentials configured!');
    console.error('   Set either DIALOGFLOW_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS');
  }
  console.log('');
});
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
