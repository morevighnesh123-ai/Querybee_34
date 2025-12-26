# Dialogflow Setup Guide

This guide will help you set up Google Dialogflow integration for the CampusBuddy chatbot.

## Prerequisites

1. A Google Cloud account
2. A Dialogflow agent created in Google Cloud Console

## Step 1: Create a Dialogflow Agent

1. Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
2. Click "Create Agent"
3. Fill in:
   - **Agent Name**: CampusBuddy (or your preferred name)
   - **Default Language**: English (or your preferred language)
   - **Google Cloud Project**: Create a new project or select existing
   - **Default Time Zone**: Your timezone
4. Click "Create"

## Step 2: Get Your Project ID

1. In the Dialogflow Console, note your **Project ID** (shown at the top)
2. Or go to [Google Cloud Console](https://console.cloud.google.com/) → Your Project → Project Settings

## Step 3: Get Access Token (Option 1 - Quick Setup)

### Using OAuth 2.0 Playground

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Get your OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `https://developers.google.com/oauthplayground`
   - Copy the Client ID and Client Secret
5. In OAuth Playground:
   - Paste your Client ID and Client Secret
   - In "Step 1", find and select: `https://www.googleapis.com/auth/cloud-platform`
   - Click "Authorize APIs"
   - Click "Exchange authorization code for tokens"
   - Copy the **Access token** (valid for 1 hour)

## Step 4: Set Up Service Account (Option 2 - Recommended for Production)

### Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" → "Service Accounts"
3. Click "Create Service Account"
4. Fill in:
   - **Name**: dialogflow-service
   - **Description**: Service account for Dialogflow API
5. Click "Create and Continue"
6. Grant role: **Dialogflow API Client** or **Dialogflow API Admin**
7. Click "Done"

### Create and Download Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Download the JSON file
6. Save it securely (e.g., `backend/service-account-key.json`)

### Enable Dialogflow API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Library"
3. Search for "Dialogflow API"
4. Click "Enable"

## Step 5: Configure Environment Variables

1. Create a `.env` file in the root directory (same level as `package.json`)
2. Add the following variables:

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=your-project-id-here
DIALOGFLOW_SESSION_ID=default-session
DIALOGFLOW_LANGUAGE_CODE=en

# Option 1: Use Access Token (temporary, expires after 1 hour)
DIALOGFLOW_ACCESS_TOKEN=your-access-token-here

# Option 2: Use Service Account (recommended for production)
# Uncomment and set the path to your service account JSON file
# GOOGLE_APPLICATION_CREDENTIALS=backend/service-account-key.json
```

3. Replace `your-project-id-here` with your actual Dialogflow Project ID
4. Replace `your-access-token-here` with your access token (if using Option 1)

## Step 6: Update Backend Code (If Using Service Account)

If you're using service account authentication, you'll need to install the Google Cloud SDK:

```bash
npm install @google-cloud/dialogflow
```

Then update `backend/server.js` to use service account authentication instead of access token.

## Step 7: Test Your Setup

1. Start the server:
   ```bash
   npm start
   ```

2. Open `http://localhost:3000` in your browser

3. Try sending a message in the chat

4. Check the server console for any errors

## Troubleshooting

### Error: "Dialogflow not configured"
- Make sure you created the `.env` file
- Verify `DIALOGFLOW_PROJECT_ID` is set correctly

### Error: "Dialogflow access token not configured"
- If using access token: Make sure `DIALOGFLOW_ACCESS_TOKEN` is set (note: tokens expire after 1 hour)
- If using service account: Make sure the service account JSON file path is correct

### Error: "401 Unauthorized"
- Your access token may have expired (get a new one from OAuth Playground)
- Or your service account doesn't have the correct permissions

### Error: "403 Forbidden"
- Make sure Dialogflow API is enabled in Google Cloud Console
- Verify your service account has Dialogflow API Client role

### Error: "404 Not Found"
- Check that your Project ID is correct
- Verify the Dialogflow agent exists in that project

## Creating Intents in Dialogflow

1. Go to your Dialogflow Console
2. Click "Intents" in the left menu
3. Click "Create Intent"
4. Add training phrases (what users might say)
5. Add responses (what the bot should reply)
6. Click "Save"

## Example Intent Setup

**Intent Name**: `welcome`

**Training Phrases**:
- "Hello"
- "Hi"
- "Hey"
- "Good morning"

**Responses**:
- "Hello! How can I help you today?"
- "Hi there! What would you like to know?"

## Security Notes

- **Never commit** your `.env` file or service account JSON files to version control
- Add `.env` and `*.json` (service account keys) to `.gitignore`
- For production, use environment variables or a secure secrets management service
- Access tokens expire after 1 hour - use service accounts for production

## Next Steps

- Create more intents for different user queries
- Add entities to extract specific information
- Set up fulfillment to connect to external APIs or databases
- Configure webhooks for advanced integrations


