# Dialogflow ES Integration Guide

## Overview
This guide explains how to integrate your Dialogflow ES chatbot (running on localhost:3000) with the M.L. Dahanukar College website frontend.

## Architecture
```
Frontend (Website) ←→ Backend (localhost:3000) ←→ Dialogflow ES API
```

## Files Modified
- `script.js` - Enhanced to communicate with Dialogflow backend
- `backend/server.js` - Your existing Dialogflow ES server
- `styles.css` - Styling for enhanced notifications

## Integration Features

### 1. Automatic Backend Detection
- Tests connection to localhost:3000 on page load
- Shows connection status to user
- Falls back to local responses if backend unavailable

### 2. Session Management
- Maintains unique session ID for conversation context
- Persists session across multiple messages
- Handles session initialization automatically

### 3. Error Handling
- Timeout handling (10 seconds)
- Network error recovery
- Graceful fallback to local responses
- User-friendly error messages

### 4. Enhanced UI
- Color-coded notifications (success/warning/error)
- Connection status indicators
- Typing indicators during API calls

## How to Connect Backend to Frontend

### Step 1: Start Your Backend Server
```bash
cd backend
npm start
# or
node server.js
```

### Step 2: Verify Backend is Running
Open http://localhost:3000/api/test in your browser
You should see: `{"message": "Backend working fine!"}`

### Step 3: Start Your Frontend
Open `index.html` in your browser or serve it with a web server:
```bash
# Option 1: Python server
python -m http.server 8000

# Option 2: Node.js server
npx serve .

# Option 3: Live Server in VS Code
# Use Live Server extension
```

### Step 4: Test Integration
1. Open the website in your browser
2. Scroll to the QueryBee chat section
3. You should see a green notification: "Connected to Dialogflow backend"
4. Type a message and send it
5. The chatbot should respond using your Dialogflow ES agent

## Configuration

### Backend Configuration
Your `server.js` is already configured with:
- **Project ID**: `querybee-owui`
- **Knowledge Base ID**: `MTU3Nzc5ODcxODU2NjExODE5NTM`
- **Service Account**: `querybee-key.json`
- **Port**: 3000

### Frontend Configuration
The frontend automatically connects to `http://localhost:3000/api/dialogflow`

## API Endpoint

### POST /api/dialogflow
**Request:**
```json
{
  "query": "What courses do you offer?",
  "sessionId": "session_1234567890_abc123"
}
```

**Response:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "query": "What courses do you offer?",
  "response": "We offer various courses in Commerce, Science, Arts, and Professional programs...",
  "intent": "course.inquiry",
  "source": "knowledge_base"
}
```

## Troubleshooting

### Backend Not Connected
**Problem**: Yellow notification "Using fallback responses - backend not available"
**Solution**:
1. Ensure backend server is running on port 3000
2. Check for port conflicts
3. Verify no firewall blocking localhost:3000

### CORS Issues
**Problem**: Browser console shows CORS errors
**Solution**: Your backend already has CORS enabled. If issues persist:
```javascript
// In server.js, ensure CORS headers are set correctly:
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
```

### Dialogflow Authentication Issues
**Problem**: 401/403 errors from Dialogflow
**Solution**:
1. Verify service account key file exists at the specified path
2. Check Google Cloud project permissions
3. Ensure Dialogflow API is enabled
4. Validate Project ID and Knowledge Base ID

### Timeout Issues
**Problem**: "Request timeout - please try again"
**Solution**:
1. Check internet connection
2. Verify Dialogflow service status
3. Increase timeout in `DIALOGFLOW_CONFIG.timeout`

## Development Tips

### 1. Console Logging
The frontend logs all API calls to browser console. Open Developer Tools (F12) to see:
- Outgoing requests to Dialogflow
- Incoming responses
- Error details

### 2. Testing Different Scenarios
- Test with backend online
- Test with backend offline (fallback mode)
- Test network interruptions
- Test with invalid queries

### 3. Performance Monitoring
Monitor:
- Response times
- Error rates
- Session persistence
- User experience

## Production Deployment

### When deploying to production:
1. **Update backend URL**: Change `DIALOGFLOW_CONFIG.backendUrl` in `script.js`
2. **HTTPS**: Use HTTPS for production
3. **Environment variables**: Use proper environment variables for sensitive data
4. **Security**: Implement proper authentication and rate limiting

### Example Production Config:
```javascript
const DIALOGFLOW_CONFIG = {
    backendUrl: 'https://your-domain.com/api',
    apiEndpoint: '/dialogflow',
    timeout: 15000
};
```

## Next Steps

1. **Enhance Knowledge Base**: Add more college-specific Q&A pairs
2. **Implement Features**: Voice input, file uploads, rich responses
3. **Analytics**: Track user interactions and common queries
4. **Multi-language**: Add support for multiple languages
5. **Admin Panel**: Create interface to manage chatbot responses

## Support

For issues:
1. Check browser console for errors
2. Verify backend server logs
3. Test API endpoints directly
4. Review Dialogflow configuration in Google Cloud Console

The integration is now complete and ready for use!
