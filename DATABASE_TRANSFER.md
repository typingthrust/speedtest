# Database Transfer Guide

This guide explains how to transfer the TypingThrust database from seller to buyer.

## 🎯 Transfer Options

### Option 1: Supabase Project Transfer (Recommended)

**Easiest method - transfers entire Supabase project including database, auth, and storage.**

#### For Seller:

1. Go to Supabase Dashboard → Your Project
2. Navigate to **Settings** → **General**
3. Scroll to **Project Transfer**
4. Enter buyer's email address
5. Click **Transfer Project**
6. Buyer will receive email invitation

#### For Buyer:

1. Check email for Supabase transfer invitation
2. Click **Accept Transfer**
3. Sign in to Supabase (or create account)
4. Project now appears in your dashboard
5. Update environment variables with new project URL/key (if changed)

**✅ Advantages:**
- No data migration needed
- All settings preserved
- Instant transfer
- No downtime

**⚠️ Note:** After transfer, seller loses access. Make sure to export any needed data first.

---

### Option 2: Database Export/Import

**Use this if buyer wants to use their own Supabase account.**

#### Step 1: Export Database Schema

**Seller provides:**
- `supabase-schema.sql` file (already included in project)

**Or export manually:**
1. Supabase Dashboard → SQL Editor
2. Run: `pg_dump --schema-only` (or use Supabase CLI)
3. Save SQL file

#### Step 2: Export Database Data (Optional)

**If buyer wants existing data:**

1. Supabase Dashboard → Database → Backups
2. Create manual backup
3. Download backup file
4. Share with buyer

**Or export specific tables:**
```sql
-- Export test_results
COPY test_results TO '/path/to/test_results.csv' CSV HEADER;

-- Export user_gamification
COPY user_gamification TO '/path/to/user_gamification.csv' CSV HEADER;

-- Export user_stats
COPY user_stats TO '/path/to/user_stats.csv' CSV HEADER;

-- Export leaderboard
COPY leaderboard TO '/path/to/leaderboard.csv' CSV HEADER;
```

#### Step 3: Buyer Creates New Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Wait for project to initialize (~2 minutes)
4. Note down Project URL and anon key

#### Step 4: Import Schema

1. Supabase Dashboard → SQL Editor
2. Open `supabase-schema.sql` file
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Verify all tables created (Table Editor)

#### Step 5: Import Data (If Provided)

**Method A: Using Supabase Dashboard**
1. Table Editor → Select table
2. Click **Insert** → **Import data from CSV**
3. Upload CSV file
4. Map columns correctly
5. Import

**Method B: Using SQL**
```sql
-- Import test_results
COPY test_results FROM '/path/to/test_results.csv' CSV HEADER;

-- Repeat for other tables
```

#### Step 6: Update Application

1. Update `.env` file with new Supabase credentials:
```env
VITE_SUPABASE_URL=new_project_url
VITE_SUPABASE_ANON_KEY=new_anon_key
```

2. Restart application
3. Test database connection

---

### Option 3: Fresh Start (Recommended for New Buyers)

**Buyer starts with empty database - cleanest option.**

#### Steps:

1. Buyer creates new Supabase project
2. Buyer runs `supabase-schema.sql` to create tables
3. Buyer configures authentication providers
4. Buyer starts with clean database
5. No data migration needed

**✅ Advantages:**
- Clean start
- No legacy data
- Easier setup
- Better for new deployments

---

## 🔐 Authentication Transfer

### Email/Password Auth

**No transfer needed:**
- Buyer enables Email provider in their Supabase project
- Settings → Authentication → Providers → Email
- Toggle **Enable Email provider**

### Google OAuth

**Buyer needs to set up:**
1. Create Google OAuth app at https://console.cloud.google.com
2. Get Client ID and Client Secret
3. Add redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Add credentials to Supabase:
   - Settings → Authentication → Providers → Google
   - Enter Client ID and Secret
   - Save

### Other OAuth Providers

- GitHub, Discord, etc. follow same pattern
- Buyer creates OAuth apps
- Buyer adds credentials to Supabase

---

## 📊 Database Schema Details

### Tables Overview

| Table | Purpose | Size Estimate |
|-------|---------|---------------|
| `test_results` | Typing test results | Grows with usage |
| `user_gamification` | XP, levels, badges | 1 row per user |
| `user_stats` | User statistics | 1 row per user |
| `leaderboard` | Leaderboard entries | ~4 rows per user |

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only access their own data
- Leaderboard is publicly readable
- Policies are included in schema

### Indexes

Optimized indexes for:
- User lookups
- Time-based queries
- Leaderboard sorting

---

## 🔄 Migration Checklist

### Seller Checklist

- [ ] Export database schema (if needed)
- [ ] Export data (if buyer wants it)
- [ ] Document any custom configurations
- [ ] Note any manual data modifications
- [ ] Provide Supabase project access OR export files

### Buyer Checklist

- [ ] Create new Supabase project (if not receiving transfer)
- [ ] Import database schema
- [ ] Import data (if provided)
- [ ] Verify all tables created
- [ ] Test RLS policies
- [ ] Configure authentication providers
- [ ] Update environment variables
- [ ] Test application connection

---

## 🧪 Testing Database Connection

### Quick Test

1. Start application: `npm run dev`
2. Try to sign up/login
3. Complete a typing test
4. Check if results are saved
5. View profile/stats
6. Check leaderboard

### SQL Test

Run in Supabase SQL Editor:
```sql
-- Test table access
SELECT COUNT(*) FROM test_results;
SELECT COUNT(*) FROM user_gamification;
SELECT COUNT(*) FROM user_stats;
SELECT COUNT(*) FROM leaderboard;

-- Test RLS (should only see your data if logged in)
SELECT * FROM test_results LIMIT 5;
```

---

## 🚨 Common Issues

### Issue: "relation does not exist"

**Solution:**
- Make sure schema was imported
- Check Table Editor for all tables
- Re-run `supabase-schema.sql`

### Issue: "permission denied"

**Solution:**
- Check RLS policies are enabled
- Verify user is authenticated
- Check policy definitions in schema

### Issue: "connection refused"

**Solution:**
- Verify Supabase URL is correct
- Check anon key is correct
- Ensure project is active (not paused)

### Issue: "duplicate key value"

**Solution:**
- Data already exists
- Clear tables before import
- Or use UPDATE instead of INSERT

---

## 📦 Database Backup

### Regular Backups

Supabase automatically backs up:
- Daily backups (retained 7 days)
- Weekly backups (retained 4 weeks)

### Manual Backup

1. Dashboard → Database → Backups
2. Click **Create backup**
3. Download when ready
4. Store securely

### Restore Backup

1. Dashboard → Database → Backups
2. Select backup
3. Click **Restore**
4. Confirm restore

---

## 🔧 Database Maintenance

### Vacuum (Cleanup)

Supabase handles this automatically, but you can run:
```sql
VACUUM ANALYZE;
```

### Monitor Size

Dashboard → Database → Size shows:
- Database size
- Table sizes
- Index sizes

### Performance

- Indexes are optimized
- RLS policies are efficient
- Queries are indexed properly

---

## 📝 Notes for Buyer

### Starting Fresh

If starting with empty database:
- No user data exists
- No test results
- Clean leaderboard
- Fresh gamification data

### Migrating Data

If importing existing data:
- Verify data integrity
- Check foreign key constraints
- Test all relationships
- Validate RLS policies

### Custom Modifications

If modifying schema:
- Update `supabase-schema.sql`
- Document changes
- Test thoroughly
- Update application code if needed

---

## ✅ Final Verification

After transfer, verify:

- [ ] All tables exist
- [ ] RLS policies work
- [ ] Authentication works
- [ ] Data saves correctly
- [ ] Queries perform well
- [ ] No errors in logs

**Database transfer complete! 🎉**

