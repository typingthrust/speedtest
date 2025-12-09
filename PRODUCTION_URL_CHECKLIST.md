# Production URL Configuration Checklist

## ✅ Code Status
**Good News:** Your code uses `window.location.origin` dynamically, so **no code changes needed**. The app automatically detects the correct URL.

## 🔴 REQUIRED: Supabase Dashboard Updates

### 1. Site URL Configuration
**Location:** Supabase Dashboard → Authentication → URL Configuration

**Update to:**
```
Site URL: https://speedtest-two-delta.vercel.app
```

### 2. Redirect URLs
**Location:** Same section (Authentication → URL Configuration)

**Add these URLs:**
```
https://speedtest-two-delta.vercel.app
https://speedtest-two-delta.vercel.app/**
https://speedtest-two-delta.vercel.app/reset-password
http://localhost:3000 (keep for local development)
http://localhost:3001 (keep for local development)
http://localhost:3000/reset-password (keep for local development)
http://localhost:3001/reset-password (keep for local development)
```

**Note:** The `/**` wildcard allows all paths on your domain. Make sure to include `/reset-password` specifically for password reset functionality.

### 3. OAuth Providers (If Using Google/GitHub)
**Location:** Supabase Dashboard → Authentication → Providers

**For Google OAuth:**
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Add authorized redirect URI: `https://speedtest-two-delta.vercel.app`
- Ensure Supabase redirect URL includes: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

**For GitHub OAuth:**
- Go to GitHub Settings → Developer settings → OAuth Apps
- Add callback URL: `https://speedtest-two-delta.vercel.app`

## ✅ Vercel Environment Variables

Verify these are set in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** These should already be set if your app is working. Double-check they're correct.

## 📝 Optional: Documentation Files

These files mention localhost but are just documentation (not critical):
- `SETUP.md`
- `QUICKSTART.md`
- `SUPABASE_EMAIL_SETUP.md`
- `BUYER_SETUP_GUIDE.md`

You can update these later if you want, but they don't affect functionality.

## 🧪 Testing Checklist

After updating Supabase:

1. ✅ Test email signup - confirmation email should redirect correctly
2. ✅ Test password reset - reset link should redirect to `/reset-password` page
3. ✅ Test password reset flow:
   - Click "Forgot password?" in sign-in form
   - Enter email and send reset link
   - Check email for reset link (check spam folder)
   - Click reset link - should redirect to `https://speedtest-two-delta.vercel.app/reset-password`
   - Set new password and verify it works
4. ✅ Test Google/GitHub OAuth (if enabled) - should redirect back correctly
5. ✅ Test authentication flow end-to-end
6. ✅ Check browser console for any redirect errors

## 🔍 How to Verify

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for any redirect errors

2. **Test Authentication:**
   - Try signing up with a test email
   - Check if confirmation email redirects to your production URL
   - Verify password reset emails work

3. **Check Browser Console:**
   - Open your production site
   - Open browser DevTools → Console
   - Look for any authentication errors

## ⚠️ Important Notes

- **Keep localhost URLs** in Supabase for local development
- **Code doesn't need changes** - it uses `window.location.origin` automatically
- **Environment variables** in Vercel should already be set
- **Most critical:** Update Supabase Site URL and Redirect URLs

## 📞 Quick Reference

**Your Production URL:**
```
https://speedtest-two-delta.vercel.app
```

**Supabase Dashboard:**
```
https://app.supabase.com
```

**Vercel Dashboard:**
```
https://vercel.com
```

---

**Last Updated:** Based on current codebase analysis
**Status:** Code is production-ready, Supabase configuration needs updates

