# Translation Setup Guide

This guide explains how to set up Google Cloud Translation API for English to Kannada and Hindi translation in the AI Assistant.

## Prerequisites

1. Google Cloud Account
2. Google Cloud Project with Translation API enabled
3. Service Account with Translation API permissions

## Setup Steps

### 1. Enable Google Cloud Translation API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Cloud Translation API"
5. Click on it and press "Enable"

### 2. Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name like "translation-service"
4. Add the "Cloud Translation API User" role
5. Create and download the JSON key file

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend-next` directory:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Alternative: Use API Key (less secure but easier for development)
GOOGLE_TRANSLATE_API_KEY=your-api-key
```

### 4. Install Dependencies

The Google Cloud Translation library is already installed:

```bash
npm install @google-cloud/translate
```

## Usage

### In AI Assistant

The AI Assistant automatically translates responses to Kannada and Hindi when:
- The user asks a question in English
- The AI generates a response
- Translations are displayed alongside the English response

### API Endpoints

#### POST /api/translate
```json
{
  "text": "Your English text here",
  "targetLanguage": "kn" // or "hi"
}
```

#### GET /api/translate?text=...&targetLanguage=...
```
/api/translate?text=Hello world&targetLanguage=kn
```

### Testing

1. Visit `/translation-test` to test translations independently
2. Visit `/ai-test` to test AI assistant with translations
3. Use the sample questions to see translations in action

## Supported Languages

- **Source**: English (en)
- **Target**: 
  - Kannada (kn)
  - Hindi (hi)

## Fallback Behavior

If Google Cloud Translation API is not configured:
- Mock translations are used for development
- Common phrases are pre-translated
- Unknown text shows a placeholder translation

## Troubleshooting

### Common Issues

1. **"Translation failed" error**
   - Check if Translation API is enabled
   - Verify service account permissions
   - Ensure credentials file path is correct

2. **"Project not found" error**
   - Verify GOOGLE_CLOUD_PROJECT_ID is correct
   - Check if project exists and you have access

3. **"Authentication failed" error**
   - Verify service account key file path
   - Check if key file is valid JSON
   - Ensure service account has Translation API permissions

### Development Mode

For development without Google Cloud:
- The system automatically falls back to mock translations
- No configuration required
- Sample translations are provided for common phrases

## Cost Considerations

- Google Cloud Translation API charges per character translated
- First 500,000 characters per month are free
- After that, approximately $20 per million characters
- Monitor usage in Google Cloud Console

## Security Notes

- Never commit service account keys to version control
- Use environment variables for sensitive configuration
- Consider using API keys for development (less secure but easier)
- Rotate service account keys regularly 