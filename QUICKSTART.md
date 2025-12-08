# Quick Start Guide

Get TypingThrust running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase (2 minutes)

1. Go to https://supabase.com and create a free account
2. Click "New Project"
3. Fill in project name and password, click "Create"
4. Wait 2 minutes for project to initialize

## Step 3: Get Your Credentials

1. In Supabase dashboard → **Settings** → **API**
2. Copy **Project URL** and **anon public** key

## Step 4: Create Database Tables

1. In Supabase dashboard → **SQL Editor**
2. Click "New query"
3. Open `supabase-schema.sql` from this project
4. Copy ALL the SQL and paste it into the editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success" messages

## Step 5: Create .env File

Create a file named `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from Step 3.

## Step 6: Enable Authentication

1. In Supabase dashboard → **Authentication** → **Providers**
2. Enable **Email** provider (it's usually enabled by default)
3. **Optional but recommended:** Customize email templates to reduce spam:
   - Go to **Authentication** → **Email Templates**
   - Update "Confirm signup" template with your app name
   - See [SUPABASE_EMAIL_SETUP.md](./SUPABASE_EMAIL_SETUP.md) for details
4. Save

## Step 7: Run the App!

```bash
npm run dev
```

Open http://localhost:3000 in your browser 🎉

## Troubleshooting

**Error: "Supabase environment variables are not set"**
- Make sure `.env` file exists in the root directory
- Check that both variables are set correctly
- Restart the dev server after creating `.env`

**Error: "relation does not exist"**
- Make sure you ran the SQL schema (Step 4)
- Check that all tables were created in Supabase dashboard → Table Editor

**Can't sign up/login**
- Make sure Email provider is enabled in Authentication → Providers
- Check browser console for errors

## That's it!

The app should now be running. You can:
- Type tests without signing in (guest mode)
- Sign up to save your progress
- View leaderboards and stats

For more details, see [SETUP.md](./SETUP.md)

