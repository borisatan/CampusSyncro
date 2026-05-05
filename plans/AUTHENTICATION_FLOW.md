# COMPLETE USER AUTHENTICATION FLOW DOCUMENTATION

## Overview
The app supports 4 authentication methods:
1. **Email/Password Sign Up** (with email verification)
2. **Email/Password Sign In** (with biometric option)
3. **Google OAuth** (via browser, using `expo-auth-session`)
4. **Apple Sign In** (via native credential)

### OAuth Implementation
OAuth flows use `expo-auth-session` for improved handling:
- **Package**: `expo-auth-session` (installed)
- **Purpose**: Provides better cross-platform OAuth redirect handling
- **Benefits**: Simpler code, no manual deep link parsing, better reliability
- **Reduced complexity**: OAuth code reduced from ~275 lines to ~100 lines per screen

---

## 1. EMAIL/PASSWORD SIGN UP FLOW

**File**: `app/(auth)/sign-up.tsx`

### Steps:
1. **User enters email, password, and confirms password** (lines 60-67)
   - Validates all fields are filled
   - Validates passwords match

2. **Call Supabase signup API** (lines 72-76)
   - **API**: `supabase.auth.signUp()`
   - **Params**:
     - `email`: user email
     - `password`: user password
     - `options.emailRedirectTo`: Deep link URL created via `Linking.createURL("/")`
   - **File**: `app/utils/supabase.ts:81` - Supabase client with PKCE flow

3. **Create user profile** (lines 85-86)
   - **API**: `ensureUserProfile(data.user.id)`
   - **File**: `app/services/backendService.ts:103-148`
   - **Backend**: Inserts into `Profiles` table with defaults:
     - `currency: 'USD'`
     - `use_dynamic_income: false`
     - `manual_income: 0`
     - `monthly_savings_target: 0`

4. **Analytics tracking** (lines 88-93)
   - Identifies user in analytics
   - Tracks "user_signed_up" event

5. **Two possible outcomes**:
   - **If email verification required** (lines 95-98):
     - Sets `awaitingVerification` state to true
     - Shows verification banner (lines 493-508)
     - User must check email and click verification link
   - **If no verification required** (line 100):
     - **Redirect**: `router.replace("/(tabs)/dashboard")`

### Resend Verification (lines 111-135)
- **API**: `supabase.auth.resend({ type: "signup", email })`
- Triggered by "Resend verification email" button

---

## 2. EMAIL/PASSWORD SIGN IN FLOW

**File**: `app/(auth)/sign-in.tsx`

### Steps:
1. **User enters email and password** (lines 62-68)
   - Validates both fields are filled

2. **Call Supabase sign-in API** (lines 71-74)
   - **API**: `supabase.auth.signInWithPassword({ email, password })`
   - **File**: `app/utils/supabase.ts:81` - Uses PKCE flow with AsyncStorage

3. **Store credentials for biometric auth** (lines 76-77)
   - Saves email and password to **SecureStore** for future biometric sign-ins

4. **Analytics tracking** (lines 79-83)
   - Identifies user
   - Tracks "user_signed_in" event with method

5. **Redirect on success** (line 84)
   - **Redirect**: `router.replace("/(tabs)/dashboard")`

### Biometric Sign In (lines 44-60)
**Requirements**:
- Hardware support checked on mount (lines 34-42)
- Previously saved credentials in SecureStore

**Flow**:
1. Retrieves saved email/password from SecureStore
2. Prompts for biometric authentication (Face ID/Touch ID)
3. If successful, calls regular `handleSignIn()` with saved credentials

---

## 3. GOOGLE OAUTH FLOW

**Files**:
- `app/(auth)/sign-in.tsx:98-197`
- `app/(auth)/sign-up.tsx:115-214` (identical implementation)

**Uses**: `expo-auth-session` for better OAuth handling

### Detailed Steps:

#### Phase 1: OAuth URL Generation
1. **Generate redirect URI using AuthSession** (line 108)
   - `AuthSession.makeRedirectUri({ path: "auth/callback" })`
   - Generates platform-specific redirect URI
   - Example: `perfin://auth/callback`
   - **Configured in**: `app.json:6` - scheme: "perfin"
   - **Why AuthSession?**: Provides better cross-platform redirect URI handling

2. **Call Supabase OAuth API**
   - **API**: `supabase.auth.signInWithOAuth()`
   - **Params**:
     - `provider: "google"`
     - `options.redirectTo`: The AuthSession redirect URI
     - `options.skipBrowserRedirect: false` - Let WebBrowser handle redirect
     - `options.queryParams`: `{ access_type: 'offline', prompt: 'consent' }`
   - **Returns**: OAuth authorization URL from Google

#### Phase 2: Browser Authentication
3. **WebBrowser completion setup** (top of file)
   - `WebBrowser.maybeCompleteAuthSession()` called at module level
   - Ensures proper handling of auth session completion

4. **Open browser for authentication**
   - **API**: `WebBrowser.openAuthSessionAsync(data.url, redirectTo)`
   - Opens system browser with Google OAuth page
   - User authenticates with Google account
   - Google redirects to: `perfin://auth/callback?code=...&state=...`
   - **Simplified**: No manual deep link listeners needed - AuthSession handles this

5. **Handle browser result**
   - **Success**: Browser returns result with URL
   - **Cancel/Dismiss**: User cancelled, return silently
   - **No manual URL parsing**: AuthSession handles redirect properly

#### Phase 3: Code Exchange
6. **Exchange code for session**
   - **API**: `supabase.auth.exchangeCodeForSession(result.url)`
   - **Backend**: Supabase validates the authorization code with Google
   - **Returns**: Full session with access token and user data
   - **Simpler**: Direct exchange without manual code extraction

7. **Session persistence**
   - Waits 100ms for AsyncStorage persistence
   - **Storage**: `app/utils/supabase.ts:32-79` - Custom AsyncStorage adapter

#### Phase 4: Profile & Redirect
8. **Ensure profile exists**
   - **API**: `ensureUserProfile(sessionData.user.id)`
   - Creates profile in `Profiles` table if doesn't exist

9. **Analytics tracking**
    - Identifies user
    - Tracks "user_authenticated" event with method: "google"

10. **Redirect on success**
    - **Redirect**: `router.replace("/(tabs)/dashboard")`

---

## 4. APPLE SIGN IN FLOW

**File**: `app/(auth)/sign-in.tsx:333-368`

### Steps:
1. **Request Apple credentials** (lines 336-341)
   - **API**: `AppleAuthentication.signInAsync()`
   - **Scopes**: FULL_NAME, EMAIL
   - Shows native Apple Sign In sheet
   - **Returns**: Identity token

2. **Sign in with identity token** (lines 344-347)
   - **API**: `supabase.auth.signInWithIdToken({ provider: "apple", token })`
   - Validates token with Apple backend

3. **Create profile** (lines 350-354)
   - **API**: `ensureUserProfile(data.user.id)`
   - Same as other flows

4. **Analytics & redirect** (lines 356-357)
   - Tracks "user_authenticated" with method: "apple"
   - **Redirect**: `router.replace("/(tabs)/dashboard")`

---

## 5. SESSION MANAGEMENT

### Session Loading (Initial App Load)
**File**: `app/index.tsx:8-53`

1. **Check for existing session** (lines 13-28)
   - **API**: `supabase.auth.getSession()`
   - Reads from AsyncStorage via custom adapter
   - **Storage key**: Defined by Supabase (typically `sb-<project>-auth-token`)

2. **Subscribe to auth state changes** (lines 21-26)
   - **API**: `supabase.auth.onAuthStateChange()`
   - Updates local session state when auth changes

3. **Routing logic** (lines 30-52):
   - **Loading**: Show spinner while checking session and onboarding
   - **Authenticated**: Redirect to `/(tabs)/dashboard`
   - **Not onboarded**: Redirect to appropriate onboarding step
   - **Otherwise**: Redirect to `/(auth)/sign-in`

### Auth Context Provider
**File**: `app/context/AuthContext.tsx:1-55`

1. **Initial load** (lines 19-31)
   - **API**: `supabase.auth.getUser()` - Validates with server
   - Sets `userId` state
   - Sets `isLoading: false`

2. **Subscribe to auth changes** (lines 35-41)
   - Only updates after initial server validation completes
   - Prevents flash from stale cached sessions
   - Used throughout app via `useAuth()` hook

### Session Storage Details
**File**: `app/utils/supabase.ts:32-79`

- **Web**: Uses `localStorage`
- **Mobile**: Uses `@react-native-async-storage/async-storage`
- **Storage keys**:
  - Session token: `sb-<project>-auth-token`
  - Logs all getItem/setItem/removeItem operations

### Supabase Client Configuration
**File**: `app/utils/supabase.ts:81-89`

```typescript
supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSqliteStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // Deep links handled manually
    flowType: "pkce",           // PKCE flow for OAuth
  }
})
```

---

## 6. REDIRECT & NAVIGATION SUMMARY

### After Successful Authentication:
- **All methods** → `router.replace("/(tabs)/dashboard")`
  - Replaces current screen so user can't go back to auth
  - Triggers re-check in `app/index.tsx` which confirms session and allows access

### Deep Link Scheme:
- **Scheme**: `perfin://` (defined in `app.json:6`)
- **OAuth callback**: `perfin://auth/callback`
- **Note**: No dedicated callback handler file - OAuth screens handle URL parsing directly

---

## 7. API ENDPOINTS & BACKEND CALLS

### Supabase Auth APIs Used:
1. `supabase.auth.signUp()` - Email/password registration
2. `supabase.auth.signInWithPassword()` - Email/password login
3. `supabase.auth.signInWithOAuth()` - Google OAuth initiation
4. `supabase.auth.exchangeCodeForSession()` - OAuth code exchange
5. `supabase.auth.signInWithIdToken()` - Apple Sign In
6. `supabase.auth.resend()` - Resend verification email
7. `supabase.auth.getSession()` - Get current session
8. `supabase.auth.getUser()` - Validate user with server
9. `supabase.auth.onAuthStateChange()` - Subscribe to auth events

### Database Operations:
**File**: `app/services/backendService.ts`

1. **Profile Creation** (lines 103-148)
   - **Table**: `Profiles`
   - **Operation**: INSERT if not exists
   - **Columns**: id, currency, use_dynamic_income, manual_income, monthly_savings_target, created_at, updated_at

---

## 8. ERROR HANDLING

### Email/Password Errors:
- **Sign Up** (line 78): Shows alert with error message, tracks failure event
- **Sign In** (lines 85-92): Shows alert with error message, tracks "user_sign_in_failed"

### Google OAuth Errors:
- **OAuth init failure** (lines 125-128): Thrown if no OAuth URL returned
- **Browser dismissed** (lines 190-196): User cancellation, shows info alert
- **Missing auth code** (line 250-252): Invalid callback URL
- **Session exchange error** (lines 273-282): Detailed error logging and alert
- **No session returned** (lines 285-287): Missing session after exchange
- **General errors** (lines 307-330): Comprehensive error logging and alert

### Apple Sign In Errors:
- **User cancellation** (line 359): Silently ignored (ERR_REQUEST_CANCELED)
- **Other errors** (lines 360-364): Alert and analytics tracking

---

## 9. IMPORTANT NOTES

1. **expo-auth-session Integration**: The app uses `expo-auth-session` for OAuth flows, providing:
   - Better cross-platform redirect URI generation via `AuthSession.makeRedirectUri()`
   - Simplified OAuth flow without manual deep link listeners
   - Automatic handling of platform-specific redirect behaviors
   - More reliable auth session completion via `WebBrowser.maybeCompleteAuthSession()`

2. **No dedicated OAuth callback route**: The auth screens handle OAuth callback URL parsing directly rather than using a separate route handler

3. **PKCE Flow**: Used for OAuth (configured in `app/utils/supabase.ts:87`)

4. **Credential Storage**: Email/password stored in SecureStore for biometric auth only

5. **Profile Auto-Creation**: `ensureUserProfile()` ensures every authenticated user has a profile record

6. **Simplified OAuth Code**: Reduced from ~275 lines to ~100 lines by using expo-auth-session utilities

7. **Session Validation**: Uses `getUser()` for server validation vs cached `getSession()`

8. **Provider Hierarchy**: AuthProvider wraps entire app in `app/_layout.tsx:58`

---

## 10. FLOW DIAGRAMS

### Email/Password Sign Up
```
User Input → Validate → supabase.auth.signUp() → Create Profile →
  ├─ Verification Required? → Show Banner → Wait for Email Click
  └─ No Verification → Redirect to Dashboard
```

### Email/Password Sign In
```
User Input → Validate → supabase.auth.signInWithPassword() →
Store Credentials → Track Analytics → Redirect to Dashboard
```

### Biometric Sign In
```
Check Hardware → Retrieve Stored Credentials → Prompt Biometric →
Success? → Call handleSignIn() → Redirect to Dashboard
```

### Google OAuth (using expo-auth-session)
```
1. Generate Redirect URI (AuthSession) → Request OAuth URL from Supabase
2. Open Browser (WebBrowser) → User Authenticates with Google → Google Redirects
3. Receive Callback URL → Exchange Code for Session (Supabase handles parsing)
4. Persist Session → Create Profile → Track Analytics → Redirect to Dashboard

Benefits: No manual deep link listeners, no manual URL parsing, ~65% less code
```

### Apple Sign In
```
Request Apple Credentials → Get Identity Token →
supabase.auth.signInWithIdToken() → Create Profile →
Track Analytics → Redirect to Dashboard
```

### Initial App Load
```
Check Session in Storage →
  ├─ Session Exists? → Redirect to Dashboard
  ├─ Not Onboarded? → Redirect to Onboarding
  └─ Neither? → Redirect to Sign In
```

---

## FILE REFERENCE INDEX

| Purpose | File Path | Key Lines |
|---------|-----------|-----------|
| Sign In Screen | `app/(auth)/sign-in.tsx` | All auth methods |
| Sign Up Screen | `app/(auth)/sign-up.tsx` | Email + OAuth signup |
| Supabase Client | `app/utils/supabase.ts` | 81-89 (config) |
| Backend Services | `app/services/backendService.ts` | 103-148 (profile) |
| Auth Context | `app/context/AuthContext.tsx` | 1-55 (provider) |
| Root Index/Router | `app/index.tsx` | 8-53 (routing logic) |
| Root Layout | `app/_layout.tsx` | 58 (AuthProvider) |
| Deep Link Config | `app.json` | 6 (scheme) |

---

## MANUAL TESTING CHECKLIST

### Email/Password Sign Up
- [ ] Enter valid email/password
- [ ] Verify password confirmation validation
- [ ] Check if verification email is sent (if required)
- [ ] Click verification link in email
- [ ] Verify redirect to dashboard after verification
- [ ] Check profile is created in database

### Email/Password Sign In
- [ ] Enter valid credentials
- [ ] Verify credentials stored in SecureStore
- [ ] Check redirect to dashboard
- [ ] Test with wrong password
- [ ] Test with non-existent email

### Biometric Sign In
- [ ] Sign in once with email/password first
- [ ] Close app and reopen
- [ ] Check biometric option appears (if hardware available)
- [ ] Test biometric authentication
- [ ] Verify automatic sign-in after biometric success

### Google OAuth
- [ ] Click "Continue with Google" button
- [ ] Verify browser opens with Google login
- [ ] Authenticate with Google account
- [ ] Check browser closes/redirects
- [ ] Watch console logs for OAuth flow steps
- [ ] Verify redirect to dashboard
- [ ] Check profile created in database
- [ ] Test cancellation (close browser mid-flow)

### Apple Sign In (iOS only)
- [ ] Click "Continue with Apple" button
- [ ] Verify native Apple Sign In sheet appears
- [ ] Authenticate with Apple ID
- [ ] Check redirect to dashboard
- [ ] Test cancellation

### Session Persistence
- [ ] Sign in with any method
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify still signed in (no auth screen shown)
- [ ] Check direct redirect to dashboard

### Error Scenarios
- [ ] Test with invalid email format
- [ ] Test with weak password
- [ ] Test network disconnection during sign-up
- [ ] Test OAuth flow cancellation
- [ ] Test expired verification link
