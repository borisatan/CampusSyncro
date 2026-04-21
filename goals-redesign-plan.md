# Plan: Redesign Savings Goals UI to Match Category Budget Cards

## Context
The savings goals section on the Budgets screen currently uses a large card with a big icon and title, displayed in a horizontal swipe carousel. The user wants these redesigned to match the compact `CategoryBudgetRow` card style — same layout, same density, purple accent instead of green — and to add a segmented progress bar that visualizes monthly contribution milestones. Monthly contribution target is set in Create/Edit modals only (not inline).

---

## Step 0: SQL Migration (run manually or via Supabase dashboard)

```sql
ALTER TABLE "Goals" ADD COLUMN IF NOT EXISTS monthly_contribution numeric DEFAULT NULL;
```

---

## Step 1: `app/types/types.ts`

Add `monthly_contribution` to the `Goal` interface:

```ts
interface Goal {
  id: number;
  user_id: string;
  account_id: string | null;
  name: string;
  target_amount: number;
  current_amount: number;
  color: string;
  icon: string;
  monthly_contribution?: number | null;  // ← ADD THIS
  created_at: string;
  updated_at: string;
}
```

---

## Step 2: `app/services/backendService.ts`

**`createGoal`** — add `monthly_contribution` to the insert payload type and the actual insert object:
```ts
// In the createGoal function's payload parameter, add:
monthly_contribution?: number | null;

// In the Supabase insert call, add:
monthly_contribution: payload.monthly_contribution ?? null,
```

**`updateGoal`** — the updates parameter is already `Partial<Goal>`, so once `Goal` has `monthly_contribution` this works automatically. No other changes needed.

---

## Step 3: `app/components/GoalsPage/GoalProgressCard.tsx` — Complete Redesign

Replace the entire file with the new compact card design:

```tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Goal } from '../../types/types';

interface GoalProgressCardProps {
  goal: Goal;
  currencySymbol: string;
  onPress?: () => void;
  isEditMode?: boolean;
}

const formatAmount = (amount: number, symbol: string) =>
  `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function GoalProgressCard({ goal, currencySymbol, onPress, isEditMode = false }: GoalProgressCardProps) {
  const accentColor = goal.color || '#a78bfa';
  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;
  const isComplete = goal.current_amount >= goal.target_amount;

  // Monthly contribution / segmented bar logic
  const hasMonthly = !!goal.monthly_contribution && goal.monthly_contribution > 0 && !isComplete;
  const totalSegments = hasMonthly
    ? Math.min(Math.ceil(goal.target_amount / goal.monthly_contribution!), 12)
    : 0;
  const fullSegments = hasMonthly
    ? Math.floor(goal.current_amount / goal.monthly_contribution!)
    : 0;
  const partialFill = hasMonthly
    ? (goal.current_amount % goal.monthly_contribution!) / goal.monthly_contribution!
    : 0;

  // Status text
  let statusText: string;
  if (isComplete) {
    statusText = 'Goal reached!';
  } else if (hasMonthly) {
    const monthsLeft = Math.ceil((goal.target_amount - goal.current_amount) / goal.monthly_contribution!);
    statusText = `${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} left`;
  } else {
    statusText = `${Math.round(progress)}% complete`;
  }
  const statusColor = isComplete ? '#22c55e' : accentColor;

  // Animated progress bar (non-segmented fallback)
  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withDelay(100, withSpring(progress / 100, { damping: 20, stiffness: 90 }));
  }, [progress]);
  const progressBarStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        className="rounded-2xl overflow-hidden border bg-surfaceDark"
        style={{ borderColor: '#2A3250' }}
      >
        {/* Top row: icon, name, amounts */}
        <View className="p-4 flex-row items-center">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: accentColor }}
          >
            <Ionicons
              name={isComplete ? 'checkmark' : (goal.icon as any) || 'flag-outline'}
              size={22}
              color="#fff"
            />
            {isEditMode && (
              <View className="absolute -top-1 -right-1 bg-white rounded-full" style={{ padding: 1 }}>
                <Ionicons name="pencil" size={9} color="#000" />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-slate50 text-[15px] font-semibold" numberOfLines={1}>
              {goal.name}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: statusColor }}>
              {statusText}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-slate50 text-base font-bold">
              {formatAmount(goal.current_amount, currencySymbol)}
            </Text>
            <Text className="text-slateMuted text-xs mt-0.5">
              / {formatAmount(goal.target_amount, currencySymbol)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="px-4 pb-3">
          {hasMonthly ? (
            // Segmented bar — each segment = 1 month's contribution
            <View className="flex-row h-1.5" style={{ gap: 3 }}>
              {Array.from({ length: totalSegments }).map((_, i) => {
                const isFull = i < fullSegments;
                const isPartial = i === fullSegments && partialFill > 0;
                return (
                  <View key={i} className="flex-1 rounded-full overflow-hidden bg-gray600">
                    {(isFull || isPartial) && (
                      <View
                        style={{
                          width: isFull ? '100%' : `${partialFill * 100}%`,
                          height: '100%',
                          backgroundColor: accentColor,
                          borderRadius: 999,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            // Regular animated bar
            <View className="h-1.5 rounded-full overflow-hidden bg-gray600">
              <Animated.View
                className="h-full rounded-full"
                style={[{ backgroundColor: isComplete ? '#22c55e' : accentColor }, progressBarStyle]}
              />
            </View>
          )}
          <View className="flex-row justify-end mt-1">
            <Text className="text-[11px] font-semibold" style={{ color: isComplete ? '#22c55e' : accentColor }}>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
```

**Remove** the `compact` and `noBg` props — no longer used after the budgets.tsx refactor.

---

## Step 4: `app/components/GoalsPage/CreateGoalModal.tsx`

Add `monthlyContribution` state and a new input field between Target Amount and Icon Picker.

**State addition** (after `targetAmount` state):
```ts
const [monthlyContribution, setMonthlyContribution] = useState('');
```

**Reset in `handleClose` and after successful submit**:
```ts
setMonthlyContribution('');
```

**Pass to `createGoal`**:
```ts
await createGoal({
  user_id: userId,
  name: name.trim(),
  target_amount: parseAmount(targetAmount),
  icon: selectedIcon,
  color: selectedColor,
  monthly_contribution: parseAmount(monthlyContribution) > 0 ? parseAmount(monthlyContribution) : null,
});
```

**New input field JSX** (insert between Target Amount and Icon Picker blocks):
```tsx
{/* Monthly Contribution */}
<View className="mb-4">
  <Text className="text-secondaryDark text-sm mb-2">
    Monthly Contribution <Text className="text-slateMuted">(optional)</Text>
  </Text>
  <View className="flex-row items-center px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark">
    <Text className="text-white/70 text-lg mr-2" style={{ lineHeight: 18 }}>{currencySymbol}</Text>
    <TextInput
      value={monthlyContribution}
      onChangeText={setMonthlyContribution}
      placeholder="0"
      placeholderTextColor="#64748B"
      keyboardType="decimal-pad"
      className="flex-1 text-lg text-white"
      style={{ lineHeight: 18 }}
    />
  </View>
  {parseAmount(monthlyContribution) > 0 && parseAmount(targetAmount) > 0 && (
    <Text className="text-secondaryDark text-xs mt-1.5">
      ≈ {Math.ceil(parseAmount(targetAmount) / parseAmount(monthlyContribution))} months to reach goal
    </Text>
  )}
</View>
```

---

## Step 5: `app/components/GoalsPage/EditGoalModal.tsx`

**State** (after `targetAmount`):
```ts
const [monthlyContribution, setMonthlyContribution] = useState('');
```

**Populate from goal** (in the `useEffect` that runs when `goal` changes):
```ts
setMonthlyContribution(goal.monthly_contribution ? goal.monthly_contribution.toString() : '');
```

**Reset in `handleClose`**:
```ts
setMonthlyContribution(goal.monthly_contribution ? goal.monthly_contribution.toString() : '');
```

**Include in `hasChanges` check**:
```ts
const hasChanges =
  goal &&
  (name.trim() !== goal.name ||
    parseAmount(targetAmount) !== goal.target_amount ||
    selectedIcon !== (goal.icon || 'flag-outline') ||
    selectedColor !== (goal.color || '#a78bfa') ||
    (parseAmount(monthlyContribution) || null) !== (goal.monthly_contribution || null));
```

**Include in `updates` object**:
```ts
const updates = {
  name: name.trim(),
  target_amount: parseAmount(targetAmount),
  icon: selectedIcon,
  color: selectedColor,
  monthly_contribution: parseAmount(monthlyContribution) > 0 ? parseAmount(monthlyContribution) : null,
};
```

**New input field JSX** (insert between Target Amount and Icon Picker — same as CreateGoalModal above).

---

## Step 6: `app/(tabs)/budgets.tsx` — Replace Carousel with Vertical List

### State/refs to REMOVE
```ts
const goalTranslateX = useSharedValue(0);
const goalCurrentPage = useSharedValue(0);
const goalCount = useSharedValue(goals.length);
const [activeGoalIndex, setActiveGoalIndex] = useState(0);
const { width: screenWidth } = useWindowDimensions();
const goalCardWidth = screenWidth - 32;
```

### Hooks to REMOVE
- The `useAnimatedReaction` block (lines 117–120)
- The `useEffect` that adjusts `goalCurrentPage` when `goals.length` changes (lines 122–133)
- The `goalPanGesture` useMemo block (lines 135–168)
- The `goalAnimatedStyle` useAnimatedStyle (lines 170–172)

### Imports to REMOVE (if unused elsewhere)
- `Gesture, GestureDetector` from `react-native-gesture-handler`
- `useWindowDimensions` from `react-native`
- `useAnimatedReaction`, `runOnJS` from `react-native-reanimated`

### Replace the goals render section (non-reorder branch)

Replace the existing `MotiView` wrapping the `GestureDetector` carousel with:

```tsx
<MotiView
  from={{ opacity: 0, translateY: 8 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: "timing", duration: 250, delay: index * 25 }}
  className="mb-2.5"
>
  {/* Goals section header */}
  <View className="flex-row items-center justify-between mb-2 px-1">
    <View className="flex-row items-center">
      <View className="w-1.5 h-1.5 rounded-full mr-2 bg-purple-500" />
      <Text className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
        Savings Goals
      </Text>
    </View>
    <TouchableOpacity
      onPress={() => setIsGoalEditMode(!isGoalEditMode)}
      className={`px-4 py-1 rounded-lg border items-center justify-center ${
        isGoalEditMode
          ? 'bg-accentBlue border-surfaceDark'
          : 'bg-surfaceDark border-slate700'
      }`}
    >
      <Text className={`text-sm ${isGoalEditMode ? 'text-white' : 'text-textDark'}`}>
        {isGoalEditMode ? 'Done Editing' : 'Edit Goals'}
      </Text>
    </TouchableOpacity>
  </View>

  {goals.length === 0 ? (
    <Pressable
      onPress={() => setShowCreateModal(true)}
      className="rounded-2xl p-4 border border-dashed border-purple-500/30 items-center"
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
    >
      <Text className="text-purple-400 font-medium text-sm">Create your first goal</Text>
      <Text className="text-slateMuted text-xs mt-0.5">Emergency fund, vacation, new car...</Text>
    </Pressable>
  ) : (
    <View style={{ gap: 8 }}>
      {goals.map((goal) => (
        <GoalProgressCard
          key={goal.id}
          goal={goal}
          currencySymbol={currencySymbol}
          onPress={() => handleGoalPress(goal)}
          isEditMode={isGoalEditMode}
        />
      ))}
    </View>
  )}

  {isGoalEditMode && goals.length > 0 && (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 250 }}
      className="mt-2"
    >
      <TouchableOpacity
        onPress={() => setShowCreateModal(true)}
        className="bg-backgroundDark border border-slate500 rounded-2xl px-4 py-3 flex-row items-center justify-center gap-3 self-stretch"
        activeOpacity={0.7}
      >
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' }}
        >
          <Ionicons name="add-outline" size={20} color="#6366f1" />
        </View>
        <Text className="text-slate200 text-sm">Add Goal</Text>
      </TouchableOpacity>
    </MotiView>
  )}
</MotiView>
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| `monthly_contribution` is `null` / `0` | Regular animated progress bar; status = "X% complete" |
| `current_amount >= target_amount` | `isComplete = true`; green bar at 100%; status = "Goal reached!" |
| `monthly_contribution > target_amount` | `totalSegments = 1`; single segment with partial fill |
| Segment count > 12 | Capped at 12 |
| `target_amount = 0` | Progress = 0, bars empty |

---

## Implementation Order

1. Run SQL migration (manual)
2. `app/types/types.ts`
3. `app/services/backendService.ts`
4. `app/components/GoalsPage/GoalProgressCard.tsx`
5. `app/components/GoalsPage/CreateGoalModal.tsx`
6. `app/components/GoalsPage/EditGoalModal.tsx`
7. `app/(tabs)/budgets.tsx`

---

## Verification

1. Budgets tab → goals show compact cards matching category card density
2. Goal card: icon (w-11 h-11 rounded-xl), name, saved/target amounts, colored progress bar
3. Goals with `monthly_contribution` show gapped segments; without show smooth bar
4. Normal mode tap → GoalTransactionModal; edit mode tap → EditGoalModal
5. EditGoalModal pre-fills Monthly Contribution from existing value
6. CreateGoalModal shows "≈ N months" hint when both fields filled
