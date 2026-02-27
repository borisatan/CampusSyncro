# PostHog Analytics Setup

PostHog has been successfully integrated into your Perfin app for tracking user analytics and events.

## Getting Started

### 1. Get Your PostHog API Key

1. Sign up or log in at [PostHog](https://posthog.com)
2. Create a new project or use an existing one
3. Go to Project Settings to find your API key
4. Copy the API key

### 2. Configure Environment Variables

Edit the `.env` file in the root directory and add your PostHog API key:

```env
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_actual_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Note:** If you're using PostHog EU Cloud, change the host to `https://eu.i.posthog.com`

### 3. Restart Your Development Server

After adding your API key, restart the Expo development server:

```bash
npm start
```

## Usage

### Using the Analytics Hook

The easiest way to track events is using the `useAnalytics` hook:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent, trackScreen, identifyUser } = useAnalytics();

  // Track a custom event
  const handleButtonClick = () => {
    trackEvent('button_clicked', {
      button_name: 'add_transaction',
      screen: 'dashboard'
    });
  };

  // Track screen views
  useEffect(() => {
    trackScreen('Dashboard');
  }, []);

  // Identify user after login
  const handleLogin = (userId: string, email: string) => {
    identifyUser(userId, {
      email,
      plan: 'free'
    });
  };

  return <Button onPress={handleButtonClick}>Add Transaction</Button>;
}
```

### Available Methods

- `trackEvent(eventName, properties)` - Track custom events
- `trackScreen(screenName, properties)` - Track screen views
- `identifyUser(userId, properties)` - Identify users
- `resetUser()` - Clear user identity (useful on logout)
- `setUserProperties(properties)` - Set user properties

### Using PostHog Directly

You can also access the PostHog client directly:

```typescript
import { usePostHog } from '@/context/PostHogContext';

function MyComponent() {
  const { posthog, isReady } = usePostHog();

  if (!isReady || !posthog) {
    return null;
  }

  // Use posthog directly
  posthog.capture('custom_event', { property: 'value' });
}
```

## Common Events to Track

Here are some suggested events for a finance app:

- **User Actions**
  - `transaction_created`
  - `transaction_edited`
  - `transaction_deleted`
  - `account_created`
  - `budget_set`
  - `category_created`

- **Screen Views**
  - `dashboard_viewed`
  - `transactions_viewed`
  - `accounts_viewed`
  - `analytics_viewed`

- **User Lifecycle**
  - `user_signed_up`
  - `user_logged_in`
  - `user_logged_out`
  - `onboarding_completed`

## Example: Track Transaction Creation

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function AddTransactionScreen() {
  const { trackEvent } = useAnalytics();

  const handleCreateTransaction = async (transaction: Transaction) => {
    // Create transaction...
    await createTransaction(transaction);

    // Track the event
    trackEvent('transaction_created', {
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
      account: transaction.account
    });
  };
}
```

## Automatic Tracking

PostHog is configured to automatically track:
- Application lifecycle events (app open, close, background)
- Deep links

## Privacy Considerations

- Make sure to review PostHog's privacy settings in your dashboard
- Consider implementing opt-in/opt-out for analytics
- Don't track sensitive financial data (account numbers, passwords, etc.)
- Only track aggregated amounts and categories, not specific transaction details

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog React Native SDK](https://posthog.com/docs/libraries/react-native)
- [Event naming conventions](https://posthog.com/docs/data/events)
