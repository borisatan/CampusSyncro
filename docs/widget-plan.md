# Monelo iOS & Android Widget Implementation Plan

## Context

Monelo is a personal finance app (React Native, Expo SDK 54, bare workflow with existing `ios/` and `android/` folders). The goal is to add home screen widgets for both iOS and Android so users can glance at key financial data — balance, spending, and goals — without opening the app.

iOS widgets **must** be written in Swift/SwiftUI (WidgetKit requirement — no React Native bridge available in widget extensions). Android widgets can be written using the `react-native-android-widget` library, which wraps Android `RemoteViews` with a JSX-like API.

Data is shared from the main app to the widget via a shared storage container (App Groups on iOS, SharedPreferences on Android), populated whenever the app runs or refreshes.

---

## Widget Content

### Proposed Widget Types (both platforms)

| Widget | Size | Content |
|--------|------|---------|
| **Balance Overview** | Small / Medium | Total balance, currency symbol |
| **Spending Summary** | Medium | Month-to-date expenses vs income |
| **Top Categories** | Medium / Large | Top 3 spending categories with amounts |
| **Savings Goals** | Medium | 1–3 goals with progress bars |

Data sources (already available in `app/services/backendService.ts`):
- Total balance → `fetchTotalBalance()` RPC
- MTD expenses → `fetchTotalExpenses(startOfMonth, today)`
- MTD income → `fetchTotalIncome(startOfMonth, today)`
- Category breakdown → `fetchCategoryAggregates(startOfMonth, today)`
- Goals → `fetchGoals()`
- Currency → `useCurrencyStore` / `getUserCurrency()`

---

## Architecture Overview

```
Main App (React Native)
    │
    ├─ Writes widget data to shared storage on app launch / data refresh
    │       iOS  → NSUserDefaults (App Groups)
    │       Android → SharedPreferences (accessible across processes)
    │
iOS Widget Extension (Swift/SwiftUI)
    │   Reads from shared NSUserDefaults
    │   WidgetKit TimelineProvider refreshes every ~15–30 min
    │   UI: SwiftUI views per widget type
    │
Android Widget (react-native-android-widget)
        Reads from SharedPreferences via native module
        AppWidgetProvider triggers JS bundle on update
        UI: JSX components converted to RemoteViews
```

---

## Phase 1 — iOS Widget

### 1.1 App Groups (Data Sharing)

1. In Xcode, enable **App Groups** capability on the main app target:
   - Group ID: `group.com.borisatanassov.Monelo`
2. Create a new **Widget Extension** target in Xcode:
   - Product name: `MoneloWidget`
   - Bundle ID: `com.borisatanassov.Monelo.MoneloWidget`
   - Enable the same App Group on this target
3. The main RN app writes data to the shared container via `react-native-shared-group-preferences`, which writes JSON to `NSUserDefaults(suiteName: "group.com.borisatanassov.Monelo")`

### 1.2 Data Write (React Native side)

Create `app/utils/widgetBridge.ts`:
```ts
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

const APP_GROUP = 'group.com.borisatanassov.Monelo';

export interface WidgetData {
  totalBalance: number;
  currencySymbol: string;
  mtdExpenses: number;
  mtdIncome: number;
  topCategories: { name: string; amount: number }[];
  goals: { name: string; current: number; target: number }[];
  lastUpdated: string;
}

export async function syncWidgetData(data: WidgetData) {
  if (Platform.OS === 'ios') {
    await SharedGroupPreferences.setItem('widgetData', data, APP_GROUP);
  } else {
    await requestWidgetUpdate({
      widgetName: 'MoneloWidget',
      renderWidget: () => null, // replaced by actual component at call site
    });
  }
}
```

Call `syncWidgetData()` from:
- `app/hooks/useDashboardData.ts` — after data loads
- After any transaction is added/modified

### 1.3 Widget Extension Files (Swift)

**File structure** inside `ios/MoneloWidget/`:
```
MoneloWidget.swift          — entry point + widget bundle registration
WidgetDataModel.swift       — Codable structs mirroring widgetData JSON
TimelineProvider.swift      — reads shared UserDefaults, builds Timeline<WidgetEntry>
BalanceWidgetView.swift     — SwiftUI view for balance widget
SpendingWidgetView.swift    — SwiftUI view for spending/income widget
CategoryWidgetView.swift    — SwiftUI view for top categories
GoalsWidgetView.swift       — SwiftUI view for savings goals
```

**WidgetDataModel.swift** — mirrors the JSON shape written from RN:
```swift
struct WidgetData: Codable {
    var totalBalance: Double
    var currencySymbol: String
    var mtdExpenses: Double
    var mtdIncome: Double
    var topCategories: [CategoryItem]
    var goals: [GoalItem]
    var lastUpdated: String
}
struct CategoryItem: Codable { var name: String; var amount: Double }
struct GoalItem: Codable { var name: String; var current: Double; var target: Double }

struct WidgetEntry: TimelineEntry {
    var date: Date
    var data: WidgetData?
}
```

**TimelineProvider.swift** — reads from App Group:
```swift
struct MoneloTimelineProvider: TimelineProvider {
    func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
        completion(WidgetEntry(date: Date(), data: loadWidgetData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
        let entry = WidgetEntry(date: Date(), data: loadWidgetData())
        let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }

    private func loadWidgetData() -> WidgetData? {
        let defaults = UserDefaults(suiteName: "group.com.borisatanassov.Monelo")
        guard let raw = defaults?.string(forKey: "widgetData"),
              let json = raw.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetData.self, from: json)
    }
}
```

**MoneloWidget.swift** — register all widget types:
```swift
@main
struct MoneloWidgetBundle: WidgetBundle {
    var body: some Widget {
        BalanceWidget()
        SpendingWidget()
        GoalsWidget()
    }
}
```

### 1.4 Xcode Project Integration Steps

1. Open `ios/Monelo.xcworkspace` in Xcode
2. **File → New → Target → Widget Extension** → name it `MoneloWidget`
3. In the main app target → **Signing & Capabilities** → **+ Capability** → **App Groups** → add `group.com.borisatanassov.Monelo`
4. Repeat step 3 on the `MoneloWidget` target with the same group ID
5. Replace the generated Swift files with the files described in §1.3
6. Add `MoneloWidget` as an **Embedded Extension** under the main target's **Build Phases → Embed App Extensions**
7. Set deployment target to **iOS 16+** (for dynamic island / interactive widgets) or **iOS 14+** (static only)
8. In Apple Developer Portal: register a new App ID for `com.borisatanassov.Monelo.MoneloWidget` with App Groups entitlement

---

## Phase 2 — Android Widget

### 2.1 Library Setup

```bash
npm install react-native-android-widget
```

Add to `android/app/src/main/AndroidManifest.xml` (inside `<application>`):
```xml
<receiver android:name=".MoneloWidgetProvider" android:exported="true">
  <intent-filter>
    <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
  </intent-filter>
  <meta-data
    android:name="android.appwidget.provider"
    android:resource="@xml/monelo_widget_info" />
</receiver>

<!-- Required by react-native-android-widget -->
<service
  android:name=".WidgetTaskService"
  android:permission="android.permission.BIND_JOB_SERVICE"
  android:exported="true" />
```

Create `android/app/src/main/res/xml/monelo_widget_info.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="110dp"
  android:minHeight="40dp"
  android:updatePeriodMillis="1800000"
  android:initialLayout="@layout/widget_loading"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen" />
```

### 2.2 Widget Components (React Native JSX)

Create `app/widgets/` directory:

**`app/widgets/MoneloBalanceWidget.tsx`**:
```tsx
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetData } from '../utils/widgetBridge';

export function MoneloBalanceWidget({ data }: { data: WidgetData }) {
  return (
    <FlexWidget style={{ flexDirection: 'column', backgroundColor: '#1a1a2e', borderRadius: 16, padding: 12, width: 'match_parent', height: 'match_parent' }}>
      <TextWidget text="Total Balance" style={{ color: '#888888', fontSize: 12 }} />
      <TextWidget
        text={`${data.currencySymbol}${data.totalBalance.toFixed(2)}`}
        style={{ color: '#ffffff', fontSize: 22, fontWeight: 'bold' }}
      />
      <TextWidget text={`Updated ${data.lastUpdated}`} style={{ color: '#555555', fontSize: 10 }} />
    </FlexWidget>
  );
}
```

**`app/widgets/MoneloSpendingWidget.tsx`** — MTD expenses vs income bar  
**`app/widgets/MoneloGoalsWidget.tsx`** — goals with `ProgressWidget`

### 2.3 Widget Provider (Kotlin)

Create `android/app/src/main/java/com/borisatanassov/Monelo/MoneloWidgetProvider.kt`:
```kotlin
package com.borisatanassov.Monelo

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import com.reactnativeandroidwidget.RNWidgetProvider

class MoneloWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        super.onUpdate(context, manager, ids)
        RNWidgetProvider.onUpdate(context, manager, ids, "MoneloWidget")
    }
}
```

### 2.4 Triggering Widget Updates

In `app/utils/widgetBridge.ts` (Android branch):
```ts
import { requestWidgetUpdate } from 'react-native-android-widget';
import { MoneloBalanceWidget } from '../widgets/MoneloBalanceWidget';

// Android update call with actual component
await requestWidgetUpdate({
  widgetName: 'MoneloWidget',
  renderWidget: () => <MoneloBalanceWidget data={data} />,
});
```

---

## Phase 3 — EAS Build Configuration

The project already has native folders and EAS project ID `a672f513-0535-4662-9516-daa2952b6f2d`. No config plugin needed — widget code lives directly in native folders.

**iOS App Store Connect**: Register `com.borisatanassov.Monelo.MoneloWidget` as a new App ID. EAS automatically includes the widget extension when it's embedded in the Xcode project.

**`eas.json`** additions (if not present):
```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.borisatanassov.Monelo"
      },
      "android": {
        "gradleCommand": ":app:bundleRelease"
      }
    }
  }
}
```

---

## All Files to Create / Modify

| File | Action |
|------|--------|
| `app/utils/widgetBridge.ts` | Create — data sync abstraction (iOS + Android) |
| `app/hooks/useDashboardData.ts` | Modify — call `syncWidgetData()` after fetch |
| `app/widgets/MoneloBalanceWidget.tsx` | Create — Android JSX balance widget |
| `app/widgets/MoneloSpendingWidget.tsx` | Create — Android JSX spending widget |
| `app/widgets/MoneloGoalsWidget.tsx` | Create — Android JSX goals widget |
| `ios/MoneloWidget/MoneloWidget.swift` | Create — widget bundle entry point |
| `ios/MoneloWidget/WidgetDataModel.swift` | Create — Codable data structs |
| `ios/MoneloWidget/TimelineProvider.swift` | Create — WidgetKit timeline provider |
| `ios/MoneloWidget/BalanceWidgetView.swift` | Create — SwiftUI balance view |
| `ios/MoneloWidget/SpendingWidgetView.swift` | Create — SwiftUI spending view |
| `ios/MoneloWidget/GoalsWidgetView.swift` | Create — SwiftUI goals view |
| `android/app/src/main/AndroidManifest.xml` | Modify — add widget receiver + service |
| `android/app/src/main/res/xml/monelo_widget_info.xml` | Create — widget metadata |
| `android/app/src/main/java/.../MoneloWidgetProvider.kt` | Create — Android provider |
| `.gitignore` | Modify — add `docs/widget-plan.md` |

---

## Dependencies to Install

```bash
npm install react-native-shared-group-preferences   # iOS: write to App Groups UserDefaults
npm install react-native-android-widget              # Android: JSX → RemoteViews widgets
npx pod-install                                       # Link iOS native module
```

---

## Implementation Order

1. `npm install` both dependencies + `npx pod-install`
2. Open Xcode → add Widget Extension target + App Groups capability (manual, one-time)
3. Create `app/utils/widgetBridge.ts`
4. Hook `syncWidgetData()` into `useDashboardData.ts`
5. Write Swift files in `ios/MoneloWidget/`
6. Write Android JSX widget components in `app/widgets/`
7. Write Kotlin `MoneloWidgetProvider` + update `AndroidManifest.xml`
8. Test on iOS Simulator (widget timeline simulation in Xcode) and Android Emulator
9. Configure EAS / App Store Connect for widget extension bundle ID

---

## Verification Checklist

- [ ] iOS: Widget appears in "Add Widget" sheet after long-pressing home screen
- [ ] iOS: Balance value matches what's shown in the app
- [ ] iOS: Widget refreshes after opening app and returning to home screen
- [ ] Android: Widget appears in Widgets tray
- [ ] Android: Balance renders with correct currency symbol
- [ ] Both: `syncWidgetData()` is called on every dashboard data load (check logs)
- [ ] Both: Widget shows "—" or placeholder when not logged in / no data
