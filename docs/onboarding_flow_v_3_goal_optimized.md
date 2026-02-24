# Onboarding Flow v3 — Goal Optimized (Subscription Machine)

**Objective:**
Maximize trial start rate by anchoring onboarding around a Monthly Spending Target and converting at peak perceived control.

**Primary KPI:** Trial Start Rate
**Secondary KPI:** Day 1 Retention

---

# FLOW OVERVIEW

1. Outcome Preview
2. Set Monthly Target
3. Instant Dashboard Generation
4. Category Confirmation
5. Log First Transaction
6. Transformation Moment
7. Paywall Overlay

All animations must be fast, responsive, and under 900ms unless otherwise specified.
No artificial delays.
No forced pauses.

---

# SCREEN 1 — Outcome Preview

## Purpose
Show the end state before asking for user input.

## UI Layout
- Full-screen dark theme (Deep Slate #0F172A or equivalent)
- Static preview of dashboard (non-interactive)
- Slight parallax on device tilt (optional)

## Copy
Headline:
See exactly where your money goes.

Subtext:
Build your personal dashboard in under 60 seconds.

Primary CTA:
Build My Dashboard

Secondary (if login supported):
I already have an account

## Interaction Rules
- CTA enabled immediately
- No delayed fade-in
- Transition: 250ms slide-left push

## Analytics Events
- onboarding_screen_1_view
- onboarding_screen_1_cta_tap

---

# SCREEN 2 — Set Monthly Target

## Purpose
Establish a controllable anchor number with minimal friction.

## Layout
- Large bold numeric input (auto-focused)
- Currency prefix auto-detected via locale
- Quick-select chips below input:
  - $2,000
  - $3,000
  - $5,000
- Inline helper text below chips
- Fixed bottom Next button

## Copy
Headline:
Set your monthly target.

Subtext:
What would you like to spend this month?

Helper Text:
Most users start with $3,000. You can change this later.

## Input Rules
- Numeric/decimal keypad only
- Real-time formatting with commas
- Allow editing of quick-chip values
- Minimum value: 1
- No modal validation errors

## Button Logic
- Next enabled when value > 0
- Default chip selection: $3,000

## Transition
On Next tap:
- 200ms fade-out
- Immediately begin dashboard generation sequence

## Analytics Events
- target_value_selected
- target_chip_selected
- onboarding_screen_2_complete

---

# SCREEN 3 — Instant Dashboard Generation

## Purpose
Demonstrate system intelligence immediately after goal entry.

## Animation Timeline
0–400ms:
- Shimmer loading state over dashboard skeleton

400–900ms:
- Remaining Budget counter animates from $0 to [Target Value]
- Progress bar renders at 0%

At 900ms:
- Light haptic feedback (success tap)

## Copy
Budget target set at $[Target].
Dashboard ready.

## Interaction
- Auto-advance after 1200ms OR
- Continue button (A/B test)

## Analytics
- dashboard_generated
- onboarding_screen_3_complete

---

# SCREEN 4 — Category Confirmation

## Purpose
Pre-select impactful categories to reduce cognitive load.

## Layout
Grid (2x3):
- Groceries
- Eating Out
- Subscriptions
- Transport
- Shopping
- Other

All selected by default.
Soft glow/border when active.

## Copy
We’ve selected the most impactful categories.
You can edit these anytime.

## Rules
- No minimum selection requirement
- Continue always enabled

## Analytics
- categories_modified
- onboarding_screen_4_complete

---

# SCREEN 5 — Log First Transaction

## Purpose
Demonstrate real-time impact against target.

## Layout
Section 1: Quick Log Buttons
- ☕ Coffee – $5
- 🍔 Lunch – $15
- ⛽ Gas – $50

Section 2 (Visually Dominant):
CUSTOM ENTRY (Primary Button Style)

Custom opens full numeric entry sheet.

## Copy
Log your last purchase.

Subtext:
Takes 5 seconds.

## Interaction Rules
When quick-log tapped:
- Transaction saves instantly
- Remaining Budget decreases in real-time
- Progress bar fills proportionally
- Transaction slides into list
- Total animation duration: 400–600ms
- Light haptic tap

No loading screens.

## Analytics
- quick_log_used
- custom_log_used
- first_transaction_logged

---

# SCREEN 6 — Transformation Moment

## Purpose
Show user they are on track.

## Timing
600ms after transaction animation completes.

## Insight Banner (Top Slide Down)
Dynamic Copy:
At this pace, you’ll stay under budget.

Optional Secondary Line:
You have $[Remaining] left this month.

Banner includes small sparkline placeholder (flat line).

Duration on screen before paywall trigger: 800ms

## Analytics
- insight_banner_shown

---

# SCREEN 7 — Paywall Overlay

## Trigger
800–1200ms after insight banner appears.

## Visual
- Background blur (dashboard visible behind)
- Slide-up bottom sheet
- Not full screen replacement

## Copy
Headline:
Protect your $[Target] plan.

Bullet Points:
- Smart Overspend Alerts
- Subscription Finder
- Daily Spending Forecasts
- Unlimited transaction tracking

## Pricing Layout
- Annual Plan (highlighted, pre-selected)
- Monthly Plan (secondary)
- Show annual savings vs monthly

## CTAs
Primary:
Start 7-Day Free Trial

Secondary:
Continue with 5 free logs

Tertiary (small text):
Restore Purchase

## Rules
- Must be dismissible
- No dark patterns
- Trial starts immediately via native subscription flow

## Analytics
- paywall_viewed
- trial_started
- paywall_dismissed
- plan_selected

---

# PERFORMANCE REQUIREMENTS

- All animations under 900ms
- No blocking loaders longer than 400ms
- Time-to-first-transaction < 60 seconds target

---

# CORE PSYCHOLOGICAL STRUCTURE

Anchor → Visualization → Action → Reinforcement → Protection

User sets a target.
User sees framework built around target.
User logs expense.
User sees movement.
User is offered protection.

---

# EXPERIMENTATION PRIORITIES

1. Paywall after first log vs after second log
2. Auto-advance vs manual Continue on dashboard
3. Default target value ($3,000 vs personalized suggestion)
4. Annual-only vs dual pricing

---

# SUCCESS BENCHMARK TARGETS

Screen 1 → Screen 2: >85%
Target Entry Completion: >80%
First Transaction Logged: >65%
Paywall View Rate: >60%
Trial Start Rate: 35–45%

---

End of Specification
