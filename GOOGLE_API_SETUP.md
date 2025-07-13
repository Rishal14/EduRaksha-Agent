# Google Cloud Translation API Setup Guide

This guide will walk you through setting up Google Cloud Translation API using an API key for easy authentication.

## Step 1: Create Google Cloud Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept the terms of service

## Step 2: Create a New Project

1. Click on the project dropdown at the top of the page
2. Click "New Project"
3. Enter a project name (e.g., "eduraksha-translation")
4. Click "Create"
5. Wait for the project to be created and select it

## Step 3: Enable Translation API

1. In the left sidebar, click "APIs & Services" > "Library"
2. Search for "Cloud Translation API"
3. Click on "Cloud Translation API"
4. Click "Enable" button
5. Wait for the API to be enabled

## Step 4: Create API Key

1. In the left sidebar, click "APIs & Services" > "Credentials"
2. Click "Create Credentials" at the top
3. Select "API key" from the dropdown
4. Your new API key will be displayed
5. **IMPORTANT**: Copy the API key immediately (you won't see it again)
6. Click "Restrict Key" to secure it

## Step 5: Restrict the API Key (Recommended)

1. In the "API restrictions" section, select "Restrict key"
2. Choose "Cloud Translation API" from the dropdown
3. Click "Save"
4. This prevents the key from being used for other Google services

## Step 6: Get Your Project ID

1. In the left sidebar, click on "IAM & Admin" > "Settings"
2. Copy your "Project ID" (it looks like "my-project-123456")

## Step 7: Set Up Environment Variables

### Option A: Create .env.local file (Recommended for development)

1. In your `frontend-next` directory, create a file called `.env.local`
2. Add the following content:

```bash
# Google Cloud Translation API Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_TRANSLATE_API_KEY=your-api-key-here

# Example:
# GOOGLE_CLOUD_PROJECT_ID=eduraksha-translation-123456
# GOOGLE_TRANSLATE_API_KEY=AIzaSyC...
```

### Option B: Set Environment Variables in Production

For production deployment, set these environment variables in your hosting platform:

- `GOOGLE_CLOUD_PROJECT_ID`: Your Google Cloud project ID
- `GOOGLE_TRANSLATE_API_KEY`: Your API key

## Step 8: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/translation-test`

3. Try translating some text - you should see real translations instead of mock ones

4. Check the browser console for messages like:
   - "Google Cloud Translation initialized with API key" ✅
   - "No Google Cloud credentials found. Using mock translations." ❌

## Step 9: Monitor Usage and Costs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Billing" in the left sidebar
3. Select your billing account
4. Click "Reports" to monitor API usage
5. Set up billing alerts if needed

## Troubleshooting

### "Translation failed" Error

1. **Check API Key**: Make sure your API key is correct and not restricted too much
2. **Check Project ID**: Verify your project ID is correct
3. **Check API Status**: Go to "APIs & Services" > "Dashboard" and ensure Translation API shows as "Enabled"
4. **Check Billing**: Ensure billing is enabled for your project

### "API key not valid" Error

1. **Regenerate Key**: Go to "APIs & Services" > "Credentials"
2. **Delete old key**: Click the trash icon next to your old key
3. **Create new key**: Follow Step 4 above
4. **Update .env.local**: Replace the old key with the new one

### "Quota exceeded" Error

1. **Check Usage**: Go to "APIs & Services" > "Dashboard" > "Cloud Translation API"
2. **View Quotas**: Click on "Quotas" tab
3. **Request Increase**: If needed, request a quota increase

## Cost Information

- **Free Tier**: 500,000 characters per month
- **Paid Tier**: $20 per million characters after free tier
- **Monitoring**: Set up billing alerts to avoid unexpected charges

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use .env.local** for local development (already in .gitignore)
3. **Restrict API keys** to only Translation API
4. **Rotate keys regularly** for production applications
5. **Monitor usage** to detect unauthorized access

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GOOGLE_CLOUD_PROJECT_ID` | Your Google Cloud project ID | Yes | `eduraksha-translation-123456` |
| `GOOGLE_TRANSLATE_API_KEY` | Your API key for authentication | Yes | `AIzaSyC...` |

## Next Steps

Once you have the API key working:

1. Test with the `/translation-test` page
2. Test with the `/ai-test` page to see translations in the AI assistant
3. Monitor your usage in Google Cloud Console
4. Set up billing alerts if needed

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the Translation API is enabled in your Google Cloud project
4. Check that billing is enabled for your project 