# CampusBuddy Chatbot - Frontend & Backend

This project consists of a Node.js/Express backend server and a frontend chatbot interface.

## Project Structure

```
backend2/
├── backend/
│   └── server.js          # Express server
├── public/
│   ├── index.html          # Frontend HTML
│   ├── script.js           # Frontend JavaScript
│   └── style.css           # Frontend CSS
├── package.json
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Option 1: Run Backend Only (Serves Frontend Automatically)

The backend server is configured to serve the frontend static files automatically. Simply run:

```bash
npm start
```

Or:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Option 2: Run Backend and Frontend Separately (if needed)

If you want to run them separately (for development purposes):

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
The frontend is automatically served by the backend at `http://localhost:3000`

## Accessing the Application

Once the server is running, open your browser and navigate to:

```
http://localhost:3000
```

You should see the CampusBuddy chatbot interface.

## Dialogflow Integration

This chatbot is integrated with Google Dialogflow for natural language processing.

### Setup Dialogflow

1. **Create a `.env` file** in the root directory with the following:
   ```env
   DIALOGFLOW_PROJECT_ID=your-project-id
   DIALOGFLOW_SESSION_ID=default-session
   DIALOGFLOW_LANGUAGE_CODE=en
   DIALOGFLOW_ACCESS_TOKEN=your-access-token
   ```

2. **Get your Dialogflow credentials:**
   - See [DIALOGFLOW_SETUP.md](./DIALOGFLOW_SETUP.md) for detailed setup instructions
   - You'll need a Google Cloud Project with Dialogflow API enabled
   - Get an access token or set up a service account

3. **Create intents in Dialogflow Console:**
   - Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
   - Create intents with training phrases and responses

For complete setup instructions, see [DIALOGFLOW_SETUP.md](./DIALOGFLOW_SETUP.md)

## API Endpoints

- `GET /api/data` - Test endpoint that returns a greeting message
- `GET /api/dialogflow?query=<your-query>` - Chat endpoint that sends queries to Dialogflow and returns responses
- `POST /api/dialogflow` - Alternative POST endpoint for Dialogflow queries

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it in `backend/server.js`:

```javascript
const port = 3000; // Change this to another port (e.g., 3001)
```

And update the frontend fetch URL in `public/script.js`:

```javascript
fetch(`http://localhost:3000/api/dialogflow?query=...`) // Update port here too
```

### Connection Issues

1. Make sure the backend server is running before using the chatbot
2. Check the browser console (F12) for any error messages
3. Verify that the server is listening on the correct port

## Features

- ✅ CORS enabled for cross-origin requests
- ✅ Static file serving for frontend
- ✅ RESTful API endpoints
- ✅ Google Dialogflow integration for natural language processing
- ✅ Chatbot interface with typing indicators
- ✅ Draggable chat widget
- ✅ Environment variable configuration for secure credentials

