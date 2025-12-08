# Environment Variables Setup Guide

## 📋 Required Environment Variables

Your project needs these 2 environment variables to connect to Supabase:

1. `VITE_SUPABASE_URL` - Your Supabase project URL
2. `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

---

## 🔑 How to Get Your Supabase Credentials

### Step 1: Go to Supabase Dashboard
1. Log in to https://app.supabase.com
2. Select your project

### Step 2: Get Your Project URL
1. Go to **Settings** → **API**
2. Find **Project URL** (under "Project URL")
3. Copy the URL (looks like: `https://abcdefghijklmnop.supabase.co`)

### Step 3: Get Your Anon Key
1. Still in **Settings** → **API**
2. Find **anon public** key (under "Project API keys")
3. Copy the key (long string starting with `eyJ...`)

---

## 📝 Setting Up .env File

### Option 1: Edit Existing .env File
1. Open `.env` file in project root
2. Replace placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Option 2: Create New .env File
1. Copy `.env.example` to `.env`
2. Fill in your actual values

---

## ✅ Example .env File

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

---

## ⚠️ Important Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use anon key, not service_role key** - For security
3. **Restart dev server** - After creating/updating `.env`, restart with `npm run dev`
4. **No quotes needed** - Don't wrap values in quotes

---

## 🧪 Testing Your Setup

After setting up `.env`:

1. Start dev server: `npm run dev`
2. Open browser console
3. Check for errors
4. Try signing up/login
5. If no errors, setup is correct!

---

## 🐛 Troubleshooting

### Error: "Supabase environment variables are not set"
- Make sure `.env` file exists in project root
- Check file is named exactly `.env` (not `.env.txt`)
- Verify both variables are set
- Restart dev server

### Error: "Failed to fetch"
- Check Supabase URL is correct
- Check anon key is correct
- Verify project is active (not paused)
- Check browser console for specific error

---

## 📍 File Location

Your `.env` file should be in the project root:
```
TypingThrust/
├── .env          ← Here
├── package.json
├── src/
└── ...
```

---

## 🔒 Security Reminder

- ✅ `.env` is in `.gitignore` (won't be committed)
- ✅ Use anon key (safe for frontend)
- ❌ Never share your service_role key
- ❌ Never commit `.env` to git

---

**After setting up `.env`, restart your dev server and you're ready to go!**

