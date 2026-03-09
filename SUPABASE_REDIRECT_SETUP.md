# Supabase Redirect URL Configuration

## Critical Issue: Deep Link Not Working

Your Google OAuth is working on Google's side, but Supabase isn't redirecting back to your app. Here's how to fix it:

---

## Step 1: Check Supabase Redirect URL Allowlist

1. **Go to Supabase Dashboard**
   - Navigate to: Authentication → URL Configuration

2. **Check "Redirect URLs" section**
   - You need to add your app's deep link scheme here
   - Add these URLs to the allowlist:

   ```
   perfin://*
   perfin://auth/callback
   exp://192.168.*
   ```

   **Important**: The wildcard `perfin://*` allows all paths under your scheme.

3. **Save the configuration**

---

## Step 2: What the Redirect URL Should Be

When you run the app, check the console log for:
```
[OAuth] Step 1a: Linking scheme URL: [SOME URL]
```

This will show you the exact URL format Expo is using. It might be:
- `perfin://` (production)
- `exp://192.168.x.x` (development)
- Or something else

**Add whatever you see to the Supabase Redirect URLs allowlist.**

---

## Step 3: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", make sure you have:
   ```
   https://rrttwewkekyvwgjilrzo.supabase.co/auth/v1/callback
   ```
   (This is your Supabase callback URL - get it from Supabase Dashboard → Auth → Providers → Google)

---

## Expected Flow

1. User clicks "Continue with Google"
2. App opens browser to Google sign-in
3. User completes Google sign-in
4. **Google redirects to: `https://rrttwewkekyvwgjilrzo.supabase.co/auth/v1/callback?code=...`**
5. **Supabase processes the code**
6. **Supabase redirects to: `perfin://auth/callback?code=...` (or whatever you specified in redirectTo)**
7. **Your app intercepts the deep link**
8. App exchanges code for session
9. User is logged in

**Currently stuck at step 6-7** - Supabase isn't redirecting to your app, or your app isn't catching the deep link.

---

## Common Issues

### Issue: Redirect URL not in allowlist
**Symptom**: OAuth flow completes but app never receives callback
**Solution**: Add your deep link to Supabase Redirect URLs allowlist (Step 1)

### Issue: Wrong redirect URL format
**Symptom**: Same as above
**Solution**: Check the console log for the actual URL being used and add that exact format

### Issue: App scheme not configured
**Symptom**: Deep link never triggers
**Solution**: Already configured in app.json - should be fine

---

## What to Do Now

1. ✅ **Check Supabase Dashboard** → Authentication → URL Configuration
2. ✅ **Add redirect URLs** as described in Step 1
3. ✅ **Try Google sign-in again**
4. ✅ **Check console logs** - you'll see exactly where it fails now
5. ✅ **Share the logs** with me if it still doesn't work

---

## Expected Log Output (Success)

```
========================================
[OAuth] GOOGLE SIGN IN STARTED
========================================
[OAuth] Step 1: OAuth redirect URL: perfin://auth/callback
[OAuth] Step 1a: Linking scheme URL: perfin://
[OAuth] Starting OAuth flow at [timestamp]
[OAuth] OAuth URL generated, opening browser
[OAuth] Setting up Linking event listener...
[OAuth] Linking event listener set up successfully
[OAuth] Step 2: Opening WebBrowser...
[OAuth] Step 2a: WebBrowser expects redirect to: perfin://auth/callback
[OAuth] Step 3: WebBrowser result type: dismiss (or success)
[OAuth] Step 4: WebBrowser dismissed/cancelled - waiting for deep link...
[OAuth] Step 4a: Waiting up to 2 seconds for Linking event...
[OAuth] 🎉 Linking event FIRED! URL: perfin://auth/callback?code=...
[OAuth] Step 4b: Got callback URL from Linking event!
[OAuth] OAuth flow completed in [X]ms
[OAuth] Attempting to exchange code for session...
[OAuth] Session established successfully!
```

---

## What You're Currently Seeing (Failure)

```
[OAuth] Step 4c: Timeout - no Linking event received within 2 seconds
[OAuth] This means the deep link was never triggered
[OAuth] ❌ No callback URL received - user likely cancelled
```

This means Supabase completed the OAuth but never redirected to your app's deep link.
