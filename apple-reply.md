# Apple Resubmission — Steps & Reply

## App Store Connect Steps

1. **Description** — add this around line 4 of your description:
   > Full access to Monelo requires an active subscription. A 7-day free trial is available for new subscribers.

2. **App Review Information → Notes** — paste:
   > Open the app → tap 'Sign Up' → complete onboarding → subscription screen appears automatically. To test restore: sign in with a sandbox account that previously purchased, tap 'Restore Purchases' on the subscription screen.

3. **Features → In-App Purchases** — confirm all three products (Weekly / Monthly / Yearly) show **"Ready to Submit"**

4. **Business** (top nav) — confirm Paid Apps Agreement is accepted

5. Submit the new build via Xcode / EAS, attach it to the version, and click **Submit for Review**

---

## Reply to Apple (Resolution Center)

**Issue 3.1.2(c):** We've increased the billed price text in the plan selector cards so it is visually larger than the free trial callout. We also added a "then $X/period after 7-day trial" line directly below the CTA button so the billed amount is the most prominent pricing element at the point of purchase.

**Issue 2.3.2:** We have updated the App Store description to clearly state that full access to Monelo requires an active subscription and that a 7-day free trial is available for new subscribers.

**Issue 2.1(b):** We identified and fixed a bug where the restore flow was checking the wrong RevenueCat entitlement name ("premium" instead of "Monelo Pro"). This caused every restore attempt to return no active subscription even for valid subscribers. The fix has been applied to both the purchase success handler and the restore handler.
