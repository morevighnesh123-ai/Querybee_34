# How to Get Google Access Token for Dialogflow

This guide will walk you through getting an access token from Google to use with Dialogflow.

## Method 1: Using OAuth 2.0 Playground (Easiest - For Testing)

### Step 1: Enable Dialogflow API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Library**
4. Search for **"Dialogflow API"**
5. Click on it and press **"Enable"**

### Step 2: Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: "CampusBuddy" (or any name)
     - User support email: Your email
     - Developer contact: Your email
   - Click **"Save and Continue"**
   - On Scopes page, click **"Save and Continue"**
   - On Test users page, click **"Save and Continue"**
   - Click **"Back to Dashboard"**

5. Now create OAuth Client ID:
   - Application type: **"Web application"**
   - Name: "Dialogflow Access Token" (or any name)
   - **Authorized redirect URIs**: Add this exact URL:
     ```
     https://developers.google.com/oauthplayground
     ```
   - Click **"Create"**
   - **IMPORTANT**: Copy the **Client ID** and **Client Secret** (you'll need these)

### Step 3: Get Access Token from OAuth Playground

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

2. Click the **gear icon (⚙️)** in the top right corner

3. Check the box: **"Use your own OAuth credentials"**

4. Enter your credentials:
   - **OAuth Client ID**: Paste your Client ID from Step 2
   - **OAuth Client secret**: Paste your Client Secret from Step 2
   - Click **"Close"**

5. In the left panel, find and select this scope:
   ```
   https://www.googleapis.com/auth/cloud-platform
   ```
   (You can search for "cloud-platform" in the search box)

6. Click **"Authorize APIs"** button
   - You'll be redirected to Google sign-in
   - Sign in with your Google account
   - Click **"Allow"** to grant permissions

7. After authorization, you'll see an authorization code
   - Click **"Exchange authorization code for tokens"** button

8. You'll see the tokens:
   - **Access token**: This is what you need! Copy this token
   - **Refresh token**: You can use this to get new access tokens later

9. **Copy the Access token** and paste it into your `.env` file:
   ```env
   DIALOGFLOW_ACCESS_TOKEN=paste-your-access-token-here
   ```

### ⚠️ Important Notes:

- **Access tokens expire after 1 hour**
- You'll need to get a new token when it expires
- For production, consider using Service Account (Method 2 below)

---

## Method 2: Using Service Account (Recommended for Production)

This method is more secure and doesn't require manual token refresh.

### Step 1: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Click **"+ CREATE SERVICE ACCOUNT"**
4. Fill in:
   - **Service account name**: `dialogflow-service`
   - **Service account ID**: (auto-filled)
   - **Description**: "Service account for Dialogflow API access"
5. Click **"CREATE AND CONTINUE"**

### Step 2: Grant Permissions

1. In **"Grant this service account access to project"**:
   - Role: Select **"Dialogflow API Client"** or **"Dialogflow API Admin"**
2. Click **"CONTINUE"**
3. Click **"DONE"**

### Step 3: Create and Download Key

1. Click on the service account you just created
2. Go to **"KEYS"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. Choose **"JSON"** format
5. Click **"CREATE"**
6. The JSON file will download automatically
7. **Save this file securely** (e.g., `backend/service-account-key.json`)

### Step 4: Update Your Code

If using service account, you'll need to update `backend/server.js` to use the service account instead of access token. The service account JSON file contains all the credentials needed.

### Step 5: Update .env File

```env
# Instead of DIALOGFLOW_ACCESS_TOKEN, use:
GOOGLE_APPLICATION_CREDENTIALS=backend/service-account-key.json
```

---

## Quick Reference: What Goes in .env

### For Access Token Method:
```env
DIALOGFLOW_PROJECT_ID=your-project-id
DIALOGFLOW_SESSION_ID=default-session
DIALOGFLOW_LANGUAGE_CODE=en
DIALOGFLOW_ACCESS_TOKEN=ya29.a0AfH6SMBx...your-token-here
```

### For Service Account Method:
```env
DIALOGFLOW_PROJECT_ID=your-project-id
DIALOGFLOW_SESSION_ID=default-session
DIALOGFLOW_LANGUAGE_CODE=en
GOOGLE_APPLICATION_CREDENTIALS=backend/service-account-key.json
```

---

## Troubleshooting

### "Invalid Credentials" Error
- Make sure you copied the entire access token (they're long!)
- Check that the token hasn't expired (they last 1 hour)
- Verify your OAuth client credentials are correct

### "Access Denied" Error
- Make sure Dialogflow API is enabled in Google Cloud Console
- Verify you selected the correct scope: `cloud-platform`
- Check that you authorized the correct Google account

### "Project Not Found" Error
- Verify your `DIALOGFLOW_PROJECT_ID` matches your Google Cloud Project ID
- Make sure the project has Dialogflow API enabled

### Token Expired
- Access tokens expire after 1 hour
- Get a new token from OAuth Playground
- Or switch to Service Account method (tokens auto-refresh)

---

## Video Tutorial Links

- [OAuth 2.0 Playground Tutorial](https://developers.google.com/identity/protocols/oauth2)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts)

---

## Need Help?

If you're stuck:
1. Check the browser console (F12) for error messages
2. Check the server console for backend errors
3. Verify all steps were completed correctly
4. Make sure your Google Cloud project has billing enabled (free tier is usually enough)


