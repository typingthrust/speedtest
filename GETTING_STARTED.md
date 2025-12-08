# Getting Started with TypingThrust

## ✅ What I've Set Up For You

I've prepared the following files to help you get the project running:

1. **`supabase-schema.sql`** - Complete database schema with all required tables
2. **`SETUP.md`** - Detailed setup instructions
3. **`QUICKSTART.md`** - Quick 5-minute setup guide
4. **`.gitignore`** - Updated to ignore `.env` files

## 🚀 To Run the Project Now

### Option 1: Quick Start (Recommended)
Follow the steps in **`QUICKSTART.md`** - it's the fastest way to get running.

### Option 2: Detailed Setup
Follow the steps in **`SETUP.md`** for comprehensive instructions.

## 📋 Quick Checklist

- [ ] Run `npm install` to install dependencies
- [ ] Create a Supabase project at https://supabase.com
- [ ] Run the SQL from `supabase-schema.sql` in Supabase SQL Editor
- [ ] Create `.env` file with your Supabase credentials
- [ ] Enable Email authentication in Supabase
- [ ] Run `npm run dev` to start the app

## 🔑 Required Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🗄️ Database Tables Created

The SQL schema creates these tables:
- `test_results` - Stores typing test results
- `user_gamification` - Stores XP, levels, badges, streaks
- `user_stats` - Stores user typing statistics
- `leaderboard` - Stores leaderboard entries

All tables include proper RLS (Row Level Security) policies.

## ⚠️ Important Notes

1. **Never commit `.env`** - It's already in `.gitignore`
2. **Use the anon key, not service_role** - For security
3. **Guest mode works** - You can test without authentication
4. **Authentication required** - For saving stats and leaderboard

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Supabase environment variables are not set" | Create `.env` file with correct variables |
| "relation does not exist" | Run `supabase-schema.sql` in Supabase SQL Editor |
| Can't sign up/login | Enable Email provider in Supabase Authentication |
| Port 3000 in use | Change port in `vite.config.ts` |

## 📚 Next Steps After Setup

1. Test the typing test functionality
2. Try signing up/logging in
3. Check that test results are being saved
4. View your profile and stats
5. Check the leaderboard

## 🎯 What Works Out of the Box

✅ Typing test with multiple modes (time, words, coding, quotes, etc.)  
✅ Multi-language support (20+ languages)  
✅ Real-time WPM and accuracy tracking  
✅ Guest mode (no login required)  
✅ Authentication (email/password, Google OAuth)  
✅ Gamification (XP, levels, badges, streaks)  
✅ Leaderboard system  
✅ Profile with stats and charts  
✅ Result screen with analytics  

## 🎨 Customization

- Modify typing content in `src/pages/Index.tsx`
- Adjust gamification rules in `src/components/GamificationProvider.tsx`
- Customize UI components in `src/components/ui/`
- Update styling in `tailwind.config.ts`

---

**Ready to start?** Open `QUICKSTART.md` and follow the steps!

