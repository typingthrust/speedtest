# TypingThrust Setup Guide

This guide will help you get the TypingThrust project up and running.

## Prerequisites

- Node.js 18+ and npm/pnpm/bun
- A Supabase account (free tier works fine)
- Git (if cloning the repository)

## Step 1: Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm
pnpm install

# Or using bun
bun install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - Name: `typingthrust` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region
4. Click "Create new project" and wait for it to initialize

### 2.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

### 2.3 Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql` file
4. Click "Run" to execute the SQL
5. You should see success messages for all tables and policies

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory of the project:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Mac/Linux
touch .env
```

2. Add the following content to `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. Replace the placeholder values with your actual Supabase credentials from Step 2.2

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

## Step 4: Configure Supabase Authentication

### 4.1 Enable Email/Password Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. **Configure email templates** (recommended to reduce spam):
   - Go to **Authentication** → **Email Templates**
   - Customize the "Confirm signup" template with your app name
   - Use a clear subject line like "Activate your TypingThrust account"
   - See [SUPABASE_EMAIL_SETUP.md](./SUPABASE_EMAIL_SETUP.md) for detailed instructions

### 4.2 Enable Google OAuth (Optional)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. You'll need to:
   - Create a Google OAuth app at [Google Cloud Console](https://console.cloud.google.com/)
   - Add your Supabase redirect URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy your Google Client ID and Client Secret to Supabase

## Step 5: Run the Development Server

```bash
# Using npm
npm run dev

# Or using pnpm
pnpm dev

# Or using bun
bun run dev
```

The app should now be running at `http://localhost:3000` (or the port shown in your terminal).

## Step 6: Verify Everything Works

1. Open `http://localhost:3000` in your browser
2. You should see the typing test interface
3. Try typing a test - it should work even without authentication
4. Try signing up/logging in to test authentication
5. Check the browser console for any errors

## Troubleshooting

### Issue: "Supabase environment variables are not set"

**Solution:** Make sure your `.env` file exists in the root directory and contains both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Issue: "Failed to fetch" or CORS errors

**Solution:** 
- Check that your Supabase URL and key are correct
- Make sure you're using the `anon` key, not the `service_role` key
- Verify your Supabase project is active

### Issue: Database errors when saving test results

**Solution:**
- Make sure you ran the `supabase-schema.sql` script
- Check that all tables were created successfully
- Verify RLS policies are set up correctly

### Issue: Authentication not working

**Solution:**
- Verify email provider is enabled in Supabase
- Check that your redirect URLs are configured correctly
- For Google OAuth, ensure you've set up the OAuth app correctly

### Issue: Port already in use

**Solution:** Change the port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // or any other available port
}
```

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Netlify Deployment

1. Push your code to GitHub
2. Import your repository in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Netlify dashboard
6. Deploy!

## Additional Notes

- The `.env` file should **never** be committed to git (it's in `.gitignore`)
- For production, set environment variables in your hosting platform
- Guest users can use the app without authentication, but their data won't be saved
- Authenticated users get full features: saved stats, leaderboard, gamification

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the terminal for build errors
3. Verify all environment variables are set correctly
4. Ensure the database schema was created successfully

