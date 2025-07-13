# NextAuth.js Login Setup Guide

This guide will help you set up Google OAuth authentication for the EduRaksha application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Copy the Client ID and Client Secret

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the `frontend-next` directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Google OAuth (replace with your actual values)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generate a Secret Key

You can generate a secure secret key using:

```bash
openssl rand -base64 32
```

Or use any secure random string generator.

## Step 3: Install Dependencies

The required dependencies are already installed in `package.json`:

- `next-auth`: Authentication library
- `@radix-ui/react-avatar`: Avatar component
- `@radix-ui/react-dropdown-menu`: Dropdown menu component

## Step 4: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click the "Sign In" button in the navbar

4. You should be redirected to Google's OAuth consent screen

5. After successful authentication, you'll be redirected back to the application

## Features

- **Google OAuth**: Secure authentication with Google accounts
- **Session Management**: Automatic session handling with JWT tokens
- **User Profile**: Display user name, email, and profile picture
- **Sign Out**: Secure logout functionality
- **Responsive Design**: Works on desktop and mobile devices

## Customization

### Custom Sign-in Page

The application includes a custom sign-in page at `/auth/signin` with:
- Modern, responsive design
- Google OAuth button
- Loading states
- Error handling

### User Interface

The authentication UI includes:
- Sign-in button in the navbar
- User avatar with dropdown menu
- Welcome message on the home page
- Profile and security menu items

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Secret Key**: Use a strong, unique secret key in production
3. **HTTPS**: Always use HTTPS in production
4. **Domain Verification**: Verify your domain in Google Cloud Console for production

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the redirect URI in Google Cloud Console matches exactly
2. **"Client ID not found"**: Verify your environment variables are set correctly
3. **"Secret not set"**: Ensure `NEXTAUTH_SECRET` is set in your environment

### Debug Mode

To enable debug mode, add to your `.env.local`:

```env
NEXTAUTH_DEBUG=true
```

This will provide detailed logs for troubleshooting authentication issues.

## Production Deployment

For production deployment:

1. Update `NEXTAUTH_URL` to your production domain
2. Add your production domain to Google OAuth redirect URIs
3. Use a strong, unique `NEXTAUTH_SECRET`
4. Enable HTTPS
5. Consider using a database for session storage instead of JWT

## Next Steps

After setting up authentication, you can:

1. Add role-based access control
2. Implement user profile management
3. Add additional OAuth providers (GitHub, Microsoft, etc.)
4. Integrate with your backend API for user data
5. Add email verification
6. Implement password reset functionality 