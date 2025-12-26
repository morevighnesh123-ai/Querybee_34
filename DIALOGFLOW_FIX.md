# Dialogflow API Error - Fix Guide

## Common Dialogflow API Errors and Solutions

### 1. "Dialogflow client not initialized" Error

**Cause:** The Dialogflow client failed to initialize, usually due to missing credentials.

**Solution:**
1. **Set up Service Account Authentication:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **IAM & Admin** → **Service Accounts**
   - Create a service account or use existing one
   - Download the JSON key file
   - Set environment variable:
     ```bash
     # Windows PowerShell
     $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\service-account-key.json"
     
     # Windows CMD
     set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\service-account-key.json
     
     # Or add to .env file
     GOOGLE_APPLICATION_CREDENTIALS=backend/service-account-key.json
     ```

2. **Or use Default Credentials:**
   - Run `gcloud auth application-default login` in your terminal
   - This will use your Google Cloud SDK credentials

### 2. Error Code 7 - Permission Denied

**Cause:** Service account doesn't have required permissions.

**Solution:**
- Grant **Dialogflow API Client** or **Dialogflow API Admin** role to your service account
- Go to Google Cloud Console → IAM & Admin → IAM
- Find your service account and add the role

### 3. Error Code 5 - Not Found

**Cause:** Project ID is incorrect or project doesn't exist.

**Solution:**
- Verify your `DF_PROJECT_ID` matches your Google Cloud project ID
- Check in `.env` file: `DF_PROJECT_ID=your-actual-project-id`
- Or verify in Dialogflow Console (shown at the top)

### 4. Error Code 3 - Invalid Argument

**Cause:** Invalid request format or missing Dialogflow agent.

**Solution:**
- Make sure you have created a Dialogflow agent in your project
- Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
- Create an agent if you haven't already

### 5. "Cannot find module '@google-cloud/dialogflow'"

**Cause:** Package not installed.

**Solution:**
```bash
npm install @google-cloud/dialogflow
```

## Quick Setup Checklist

- [ ] Dialogflow API enabled in Google Cloud Console
- [ ] Service account created with Dialogflow API Client role
- [ ] Service account JSON key file downloaded
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` environment variable set
- [ ] `DF_PROJECT_ID` set correctly in `.env` file
- [ ] Dialogflow agent created in Dialogflow Console
- [ ] At least one intent created in Dialogflow agent

## Testing Dialogflow Connection

Run the test script:
```bash
node backend/df-text.js
```

If successful, you should see:
```
Authenticated with project: your-project-id
```

## Current Configuration

- **Project ID:** Set via `DF_PROJECT_ID` environment variable (default: "querybee-owui")
- **Credentials:** Set via `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- **Language:** English (en-US)

## Need Help?

1. Check server console for detailed error messages
2. Verify all environment variables are set correctly
3. Test authentication with `node backend/df-text.js`
4. Check Google Cloud Console for API enablement and permissions

