# Google OAuth Not Creating Users - Debug Checklist

## Issue
Google OAuth flow completes in the app but doesn't create records in Supabase `auth.users` table.

---

## ✅ Step 1: Check Supabase Dashboard Configuration

### Go to Supabase Dashboard → Authentication → Providers

1. **Is Google provider ENABLED?**
   - [ ] Toggle is turned ON

2. **Are credentials filled in?**
   - [ ] Client ID (from Google Cloud Console)
   - [ ] Client Secret (from Google Cloud Console)

3. **Copy the Supabase Redirect URL**
   - Should look like: `https://rrttwewkekyvwgjilrzo.supabase.co/auth/v1/callback`
   - You'll need this for Step 2

---

## ✅ Step 2: Check Google Cloud Console Configuration

### Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

1. **Select your project**
   - [ ] Correct project is selected

2. **Find your OAuth 2.0 Client ID**
   - [ ] Click on your OAuth 2.0 Client ID

3. **Check Authorized redirect URIs**
   - [ ] Must include: `https://rrttwewkekyvwgjilrzo.supabase.co/auth/v1/callback`
   - [ ] Save changes if you added it

4. **Check Application type**
   - [ ] Should be "Web application" (not Android/iOS)

5. **Optional: Check Authorized JavaScript origins**
   - [ ] Can add: `https://rrttwewkekyvwgjilrzo.supabase.co`

---

## ✅ Step 3: Verify Your App Configuration

### Check app.json / app.config.js

Look for the deep link scheme:

```json
{
  "expo": {
    "scheme": "perfin"
  }
}
```

- [ ] Scheme matches the redirect URL in your code (`perfin://auth/callback`)

---

## ✅ Step 4: Test the OAuth Flow

### Try signing in with Google and watch the console logs:

**Look for these log messages:**

1. `[OAuth] Starting OAuth flow at [timestamp]`
2. `[OAuth] OAuth URL generated, opening browser`
3. `[OAuth] WebBrowser result: { type: 'success' or 'dismiss' }`
4. `[OAuth] Raw callback URL: perfin://auth/callback?code=...`
5. `[OAuth] Attempting to exchange code for session...`
6. `[OAuth] exchangeCodeForSession response: { hasData, hasSession, hasUser, error }`

**What to check:**

- [ ] Does step 6 show `hasSession: true` and `hasUser: true`?
- [ ] Is there an error in step 6?
- [ ] What does the error message say?

---

## ✅ Step 5: Common Issues and Solutions

### Issue: "Invalid grant" or "Code already used"
**Solution**: The authorization code can only be used once. Try the flow again with a fresh attempt.

### Issue: "Invalid redirect URI"
**Solution**:
- The redirect URI in Google Cloud Console must EXACTLY match Supabase's callback URL
- No trailing slashes, case-sensitive

### Issue: "Missing state parameter"
**Solution**: This is often OK - Supabase can handle missing state in some cases

### Issue: No error but no session either
**Solution**: Check Supabase logs in Dashboard → Logs → Auth Logs

### Issue: User created in Google but not in Supabase
**Solution**: Check if:
- [ ] Supabase project is on a paid plan (free tier has limits)
- [ ] Check Supabase Dashboard → Authentication → Users (is it empty?)
- [ ] Check Supabase Dashboard → Logs for any errors

---

## ✅ Step 6: Check Supabase Auth Logs

1. Go to Supabase Dashboard → Logs → Auth Logs
2. Filter by "Recent"
3. Look for entries around the time you tried to sign in
4. **What errors do you see?**

Common errors:
- "Invalid provider" → Provider not enabled
- "Invalid credentials" → Client ID/Secret wrong
- "Invalid redirect URI" → Mismatch between Google and Supabase

---

## ✅ Step 7: Verify in Supabase SQL Editor

Run this query to check if users exist:

```sql
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

- [ ] Any users showing up?
- [ ] If yes, do they have Google email addresses?

---

## 🔍 What to Share with Developer

If none of the above works, share:

1. Console logs from the OAuth flow (all `[OAuth]` messages)
2. Error message from `exchangeCodeForSession`
3. Screenshot of Supabase → Authentication → Providers → Google settings (hide secrets!)
4. Screenshot of Google Cloud Console OAuth Client ID configuration
5. Any errors from Supabase Auth Logs

---

## 🚨 Nuclear Option: Start Fresh

If nothing works:

1. Create a NEW OAuth 2.0 Client ID in Google Cloud Console
2. Update Supabase with new Client ID and Secret
3. Make sure redirect URI is correct
4. Try again

---

## Expected Working Flow

When everything is configured correctly:

1. User clicks "Continue with Google"
2. Browser opens with Google sign-in
3. User authorizes the app
4. Browser closes, app receives callback URL
5. App exchanges code for session with Supabase
6. **Supabase creates user in `auth.users`**
7. **Supabase creates profile in `Profiles` (via trigger)**
8. User is redirected to dashboard

If step 6 doesn't happen, the issue is in Supabase OAuth configuration (Steps 1-2 above).
