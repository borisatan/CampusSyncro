<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog analytics was already partially set up (SDK installed, `PostHogContext`, `useAnalytics` hook, and full onboarding screen tracking). This session extended coverage to the two remaining critical user flows: **authentication** (sign-in and sign-up) and **core transaction tracking** (add transaction). User identification via `posthog.identify()` is now called on every successful sign-in and sign-up, correlating all subsequent events to a specific Supabase user ID.

| Event Name | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signed in (email or biometric) | `app/(auth)/sign-in.tsx` |
| `user_sign_in_failed` | Sign-in attempt failed, includes error message | `app/(auth)/sign-in.tsx` |
| `user_signed_up` | New account created, includes `requires_verification` flag | `app/(auth)/sign-up.tsx` |
| `user_sign_up_failed` | Sign-up attempt failed, includes error message | `app/(auth)/sign-up.tsx` |
| `transaction_added` | Transaction successfully added, includes type/category/amount/account | `app/(tabs)/add-transaction.tsx` |
| `transaction_add_failed` | Transaction add failed, includes transaction type and error | `app/(tabs)/add-transaction.tsx` |

**Previously instrumented (onboarding screens):**

| Event Name | Description | File |
|---|---|---|
| `onboarding_screen_viewed` | User viewed an onboarding screen | All 7 onboarding screens |
| `onboarding_screen_completed` | User advanced past an onboarding screen | All 7 onboarding screens |
| `onboarding_skipped` | User tapped Skip during onboarding | All 7 onboarding screens |
| `onboarding_category_toggled` | User toggled a spending category | `app/(onboarding)/category-autopilot.tsx` |
| `onboarding_completed` | User finished all 7 onboarding steps | `app/(onboarding)/subscription-trial.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/133151/dashboard/557636
- **Signup → Onboarding → Completion Funnel**: https://eu.posthog.com/project/133151/insights/RCNc807h
- **Daily Active Sign Ins vs Failed Sign Ins**: https://eu.posthog.com/project/133151/insights/ABe3wg8r
- **Daily Transactions Added**: https://eu.posthog.com/project/133151/insights/n1sIV1UR
- **Onboarding Skipped vs Completed**: https://eu.posthog.com/project/133151/insights/nE7B4Ic5

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
