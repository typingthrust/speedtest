# Buyer Setup Guide - TypingThrust

Welcome! This guide will help you set up and run TypingThrust after purchase.

## 🎯 What You're Getting

A complete, production-ready typing speed test application with:
- Modern React frontend
- Supabase backend
- Full authentication system
- Gamification features
- Leaderboard system
- Multi-language support
- And much more!

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Node.js 18+ installed ([Download](https://nodejs.org/))
- ✅ A code editor (VS Code recommended)
- ✅ A Supabase account (free tier works) ([Sign up](https://supabase.com))
- ✅ Git installed (if using Git)

## 🚀 Quick Setup (15 minutes)

### Step 1: Get the Code

**If received via Git:**
```bash
git clone <repository-url>
cd TypingThrust
```

**If received via ZIP:**
1. Extract the ZIP file
2. Open terminal in the extracted folder
3. You're ready!

### Step 2: Install Dependencies

```bash
npm install
```

This may take 2-5 minutes. Wait for it to complete.

### Step 3: Set Up Supabase

#### 3.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name:** `typingthrust` (or your choice)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest to you
5. Click **"Create new project"**
6. Wait 2 minutes for setup

#### 3.2 Get Your Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

#### 3.3 Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from this project
4. Copy **ALL** the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see "Success" messages
8. Verify tables were created: Go to **Table Editor** - you should see 4 tables

#### 3.4 Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (usually enabled by default)
3. Click **Save**

### Step 4: Configure Environment Variables

1. In the project root, create a file named `.env`
2. Add these lines (replace with YOUR values from Step 3.2):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

### Step 5: Run the Application

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 6: Test It!

1. Open http://localhost:3000 in your browser
2. You should see the typing test interface
3. Try typing a test (works without login!)
4. Try signing up:
   - Click user icon (top right)
   - Click "Sign Up"
   - Enter email and password
   - Check email for confirmation link
   - Sign in and test saving results

## ✅ Verification Checklist

- [ ] Application runs without errors
- [ ] Can type tests (guest mode works)
- [ ] Can sign up for account
- [ ] Can sign in
- [ ] Test results are saved (check profile)
- [ ] Leaderboard works
- [ ] No errors in browser console

## 🎨 Customization (Optional)

### Change Branding

1. **Logo:** Replace `public/logo.png` with your logo
2. **Title:** Edit `index.html` - change title and meta tags
3. **Colors:** Edit `tailwind.config.ts` for theme colors

### Add Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new OAuth 2.0 credentials
3. Add redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. In Supabase: **Authentication** → **Providers** → **Google**
6. Enable and add credentials
7. Save

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended - Easiest)

1. Push code to GitHub (or GitLab)
2. Go to https://vercel.com
3. Click **"New Project"**
4. Import your repository
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **"Deploy"**
7. Done! Your app is live

### Option 2: Netlify

1. Push code to GitHub
2. Go to https://netlify.com
3. Click **"New site from Git"**
4. Connect repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables
7. Deploy!

### Option 3: Custom Domain

1. After deployment, go to domain settings
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs:
   - **Authentication** → **URL Configuration**
   - Add your domain to allowed URLs

## 🐛 Troubleshooting

### "Supabase environment variables are not set"

**Fix:**
- Make sure `.env` file exists in project root
- Check file is named exactly `.env` (not `.env.txt`)
- Verify both variables are set
- Restart dev server after creating `.env`

### "relation does not exist"

**Fix:**
- Make sure you ran `supabase-schema.sql`
- Check Supabase Table Editor - all 4 tables should exist
- Re-run the SQL if needed

### Can't sign up/login

**Fix:**
- Check Email provider is enabled in Supabase
- Verify email confirmation is set up
- Check Supabase logs for errors
- Try password reset if needed

### Port 3000 already in use

**Fix:**
- Change port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3001, // or any other port
  }
  ```

### Build errors

**Fix:**
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again
- Try `npm run build` to see specific errors

## 📚 Next Steps

### Learn the Codebase

- **Main typing test:** `src/pages/Index.tsx`
- **Authentication:** `src/components/AuthProvider.tsx`
- **Database:** `src/lib/supabaseClient.ts`
- **UI Components:** `src/components/ui/`

### Add Features

- Review existing code structure
- Follow React/TypeScript best practices
- Test thoroughly before deploying

### Monetize

- Add premium features
- Integrate payment system (Stripe, etc.)
- Add subscription tiers
- White-label options

## 🆘 Getting Help

### Documentation

- **Setup Guide:** `SETUP.md`
- **Quick Start:** `QUICKSTART.md`
- **Database Transfer:** `DATABASE_TRANSFER.md`
- **Handover Guide:** `HANDOVER_GUIDE.md`

### Resources

- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev

### Support

- Check troubleshooting sections
- Review error messages carefully
- Search Supabase/React documentation
- Contact seller for transition support (if agreed)

## ✅ You're All Set!

The application should now be running. Start customizing and building your business!

**Good luck with your new project! 🚀**

