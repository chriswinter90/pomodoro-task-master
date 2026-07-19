# Plan: break timer
Status: IMPLEMENTED
Brief: .pi/preplan/break-timer-preplan.md

## Goal
Add a break timer that automatically starts after a work timer completes, with OS notifications, a 30-second countdown window (label + progress bar) before auto-transition, and snooze support for both work and break timers. The UI must clearly distinguish between work and break modes via color and label.

## Findings
- `useTimer` composable (`src/components/composables/timer.ts`) has no completion callback — timer runs into negative time. `timeRemainingInSeconds` is a computed inside `useTimer` but is NOT exposed in the return object. Controller must watch `elapsedSeconds` vs `duration` to detect completion.
- `useTimersStore` (`src/stores/timers.ts`) stores `{ id, duration }` in localStorage key `taskMasterTimers`. No `breakDuration` field — needs migration.
- `TimerPanel.vue` owns a single `useTimer` instance per selected timer. No state machine or completion handling.
- `TimerDisplay.vue` is a dumb display — renders `displayTimeString`. Needs mode label and countdown progress bar.
- `TimerControls.vue` has Start/Stop/Reset. Needs snooze button and skip-break button.
- `AddTimerPanel.vue` accepts minutes + seconds for work duration. Needs break duration input.
- `TimerBlock.vue` shows work duration. Needs to display break duration alongside.
- No existing test infrastructure. Manual verification via `pnpm dev`.
- Default break duration: 5 minutes (300s) for migration of existing timers.
- Countdown UI: label ("Break starts in 0:30") + `v-progress-linear` bar.
- Execution mode: single-session.

## Choices
- Test-first: no
- Granularity: detailed
- Execution mode: single-session

## Steps
- [x] Step 1: Extend `TimerData` type with `breakDuration` and migrate existing localStorage entries
  - Add `breakDuration: number` to `TimerData` in `src/stores/timers.ts`
  - Update `getTimersFromLocalStorage` to inject `breakDuration: 300` on any timer missing it
  - Update `addTimer` action to accept `breakDuration` parameter (optional, defaults to 300)
  - Verify: `pnpm type-check`

- [x] Step 2: Create `useBreakController` composable (`src/components/composables/breakController.ts`)
  - Define `BreakMode = 'idle' | 'work' | 'countdown' | 'break'`
  - Own a work timer (`useTimer(timerData.duration)`) and a break timer (`useTimer(timerData.breakDuration ?? 300)`)
  - Watch `workTimer.elapsedSeconds` vs `workTimer.duration` (since `timeRemainingInSeconds` is not exposed) → when elapsed ≥ duration, fire OS notification → enter countdown
  - 30-second countdown via `setInterval` → auto-transition to break mode
  - Watch `breakTimer.elapsedSeconds` vs `breakTimer.duration` → when elapsed ≥ duration, fire OS notification → idle
  - `snooze(durationSeconds)`: work mode → `setDuration(elapsed + durationSeconds)` (extends remaining time); break mode → same; countdown → cancel countdown, set work timer to snooze duration, reset elapsed, restart → work mode
  - `skipBreak()`: cancel countdown → idle
  - `start()`: reset + start work timer → work mode
  - `stop()`: stop active timer, cancel countdown → idle
  - `reset()`: stop all, reset both timers → idle
  - Return: `mode`, `displayTimeString`, `timerRunning`, `countdownRemaining`, `start`, `stop`, `reset`, `snooze`, `skipBreak`, `dispose`
  - OS notification via `Notification API`: request permission on first `start()` call (triggered by user gesture). If denied, log warning and continue without notifications. If already granted/denied, skip re-requesting.
  - Verify: `pnpm type-check`

- [x] Step 3: Create `SnoozePanel` component (`src/components/TimerPanel/SnoozePanel.vue`)
  - Overlay card (matching `AddTimerPanel` positioning pattern)
  - 3 preset buttons: 5 min, 10 min, 15 min
  - Custom input: minutes + seconds fields
  - `v-model<boolean>` for show/hide
  - Emit `confirm(duration: number)` on selection; close panel
  - Verify: `pnpm type-check`

- [x] Step 4: Update `TimerDisplay.vue` for mode awareness
  - New props: `mode: BreakMode`, `countdownRemaining: number`
  - Show mode label ("Work" / "Break" / "Break starts in...") above the timer
  - Apply mode-specific color: work = red/warm tone (`#d84f4f` to match TimerBlock active), break = teal/green tone (`#4caf50` or similar), idle = neutral
  - When `mode === 'countdown'`: show countdown label + `v-progress-linear` (value = `countdownRemaining / 30 * 100`, color = orange)
  - Verify: `pnpm type-check`

- [x] Step 5: Update `TimerControls.vue` for snooze and mode-aware controls
  - New props: `mode: BreakMode`
  - New emits: `snooze`, `skipBreak`
  - Add "Snooze" button (visible when `mode` is `work`, `break`, or `countdown`)
  - Add "Skip Break" button (visible when `mode === 'countdown'`)
  - Replace Start/Stop visibility logic: show Start only when `mode === 'idle'`, show Stop when `mode` is `work` or `break`. During countdown, hide Start/Stop (transition is automatic).
  - Keep Reset button always visible; Stop during countdown cancels and goes to idle
  - Verify: `pnpm type-check`

- [x] Step 6: Update `TimerPanel.vue` to consume `useBreakController`
  - Replace `useTimer` with `useBreakController(timers.selectedTimer)`
  - Pass `mode`, `displayTimeString`, `timerRunning`, `countdownRemaining` to child components
  - Remove `elapsedSeconds` and `duration` props from `TimerDisplay` (controller provides `displayTimeString` directly)
  - Pass `breakDuration` from each timer to `TimerBlock`: `:break-duration="timer.breakDuration ?? 300"`
  - Wire `start`, `stop`, `reset` to `TimerControls` (controller methods are `start()`/`stop()`/`reset()`, not `startTimer()`/etc.)
  - Wire `snooze` emit from `TimerControls` to show `SnoozePanel`
  - Remove `v-if="currentTimer"` and `:key` from `TimerDisplay` (controller is always present, no timerId to key on)
  - Wire `SnoozePanel` `confirm` to controller's `snooze(duration)`
  - Watch `timers.selectedTimer` to recreate controller: call `dispose()` on old controller first (fixes existing interval leak from current `useTimer` pattern), then create new controller
  - Verify: `pnpm type-check`

- [x] Step 7: Update `AddTimerPanel.vue` to accept break duration
  - Add break duration section: "Break duration" label + minutes + seconds inputs
  - Default break minutes to 5, seconds to 0
  - Pass `breakDuration` (total seconds) to `timersStore.addTimer(duration, breakDuration)`
  - Verify: `pnpm type-check`

- [x] Step 8: Update `TimerBlock.vue` to display break duration
  - New prop: `breakDuration: number`
  - Show break duration below work duration with a small coffee/break icon (`mdi-coffee`)
  - Smaller font size for break duration
  - Verify: `pnpm type-check`

- [x] Step 9: Final integration pass — verify full cycle in dev server
  - Start work timer → completes → notification → countdown (label + progress bar) → break auto-starts → completes → notification → idle
  - Snooze during work → extends remaining time
  - Snooze during countdown → returns to work mode with snooze duration
  - Snooze during break → extends break
  - Skip break during countdown → idle
  - Create new timer with break duration → persists after reload
  - Verify: `pnpm dev` manual cycle test

## Worklog

### Step 1
- Did: Added breakDuration to TimerData, migrated localStorage, updated addTimer signature
- Files: src/stores/timers.ts
- Learned: none
- Verify: `pnpm type-check` → pass

### Step 2
- Did: Created useBreakController composable with state machine (idle/work/countdown/break), OS notifications, snooze, skipBreak
- Files: src/components/composables/breakController.ts (new)
- Learned: TimerData needed export; useTimer exposes elapsedSeconds and duration refs (not timeRemainingInSeconds), watched elapsed vs duration for completion detection
- Verify: `pnpm type-check` → pass

### Step 3
- Did: Created SnoozePanel with 5/10/15 min presets and custom minutes+seconds input
- Files: src/components/TimerPanel/SnoozePanel.vue (new)
- Learned: Followed AddTimerPanel positioning pattern (fixed overlay + centered card)
- Verify: `pnpm type-check` → pass

### Step 4
- Did: Updated TimerDisplay with mode label, mode-specific colors (work=#d84f4f, break=#4caf50), countdown label + v-progress-linear
- Files: src/components/TimerPanel/TimerDisplay.vue
- Learned: Removed duration/elapsedSeconds props; controller provides displayTimeString directly
- Verify: `pnpm type-check` → pass

### Step 5
- Did: Updated TimerControls with snooze button (work/break/countdown), skip break (countdown), mode-aware Start/Stop visibility
- Files: src/components/TimerPanel/TimerControls.vue
- Learned: none
- Verify: `pnpm type-check` → pass

### Step 6
- Did: Replaced useTimer with useBreakController in TimerPanel, wired all new props/emits, added dispose() on timer switch, SnoozePanel integration
- Files: src/components/TimerPanel/TimerPanel.vue
- Learned: Controller owns displayTimeString so TimerPanel no longer passes raw elapsed/duration
- Verify: `pnpm type-check` → pass

### Step 7
- Did: Added break duration section to AddTimerPanel with minutes+seconds inputs, default 5:00
- Files: src/components/TimerPanel/AddTimerPanel.vue
- Learned: addTimer signature is now (duration, breakDuration?, id?) — breakDuration inserted as 2nd param
- Verify: `pnpm type-check` → pass

### Step 9
- Did: Manual integration test via pnpm dev
- Files: none
- Learned: Browser Notification API requires system-level notification permissions enabled; notifications show in system tray when tab is not focused. Added console logging for debugging timer completion events.
- Verify: `pnpm dev` manual cycle test → pass
- Did: Added breakDuration prop to TimerBlock, displays with coffee icon below work duration
- Files: src/components/TimerPanel/TimerBlock.vue
- Learned: none
- Verify: `pnpm type-check` → pass

## Interfaces

### `BreakMode` type
```typescript
type BreakMode = 'idle' | 'work' | 'countdown' | 'break'
```

### `TimerData` (updated in `src/stores/timers.ts`)
```typescript
type TimerData = {
  id: string
  duration: number        // work duration in seconds
  breakDuration?: number  // break duration in seconds, optional — migration fills default of 300
}
```

### `useTimersStore.addTimer` (updated signature)
```typescript
addTimer(duration: number, breakDuration?: number, id?: string): void
// breakDuration defaults to 300 if omitted
// NOTE: current signature is addTimer(duration, id?) — only one caller exists (AddTimerPanel), passes 1 arg. Safe to insert breakDuration as 2nd param.
```

### `useBreakController` (new in `src/components/composables/breakController.ts`)
```typescript
function useBreakController(timerData: TimerData): {
  mode: Ref<BreakMode>
  displayTimeString: ComputedRef<string>
  timerRunning: ComputedRef<boolean>
  countdownRemaining: Ref<number>  // 0 when not in countdown mode
  start(): void
  stop(): void
  reset(): void
  snooze(durationSeconds: number): void
  skipBreak(): void
  dispose(): void  // clear all intervals, watchers, and state — call before recreating controller
}
```

### `SnoozePanel` props/emits (new in `src/components/TimerPanel/SnoozePanel.vue`)
```typescript
// v-model<boolean> for show/hide
defineModel<boolean>({ required: true })
defineEmits<{
  confirm: [duration: number]
}>()
```

### `TimerDisplay.vue` props (updated)
```typescript
defineProps<{
  displayTimeString: string
  mode: BreakMode              // NEW
  countdownRemaining: number   // NEW
}>()
// NOTE: `duration` and `elapsedSeconds` removed — controller provides displayTimeString,
// TimerPanel no longer has access to raw elapsed/duration refs
```

### `TimerControls.vue` props/emits (updated)
```typescript
defineProps<{
  isRunning: boolean
  mode: BreakMode   // NEW
}>()
defineEmits<{
  start: []
  stop: []
  reset: []
  snooze: []       // NEW
  skipBreak: []    // NEW
}>()
```

### `TimerBlock.vue` props (updated)
```typescript
defineProps<{
  timerId: string
  duration: number
  breakDuration: number  // NEW
}>()
```

## Test Plan
No automated tests — no existing test infrastructure. Verification is entirely manual via `pnpm dev`:
- Run `pnpm dev`, open localhost
- Create a short work timer (10s work, 5s break) for fast testing
- Full cycle: start → work completes → OS notification → 30s countdown with label + progress bar → break auto-starts → break completes → notification → idle
- Snooze during work: timer extends, continues running
- Snooze during countdown: SnoozePanel appears, selecting preset returns to work mode with snooze duration
- Snooze during break: timer extends, continues
- Skip break during countdown: goes to idle
- New timer with break duration persists after page reload
- UI distinguishes work (red tones) vs break (teal/green tones) via color and label

## Acceptance Criteria
- Work timer completion triggers OS notification and 30-second countdown
- Countdown displays as a label ("Break starts in 0:XX") and a `v-progress-linear` bar
- Break timer auto-starts after countdown expires
- Break timer completion triggers OS notification and stops (no auto-loop)
- Snooze works during work, break, and countdown modes via SnoozePanel with 5/10/15 min presets and custom input
- Skip break button during countdown cancels transition and returns to idle
- UI clearly distinguishes work vs break mode (different color + label)
- New timers include break duration, persisted in localStorage
- Existing timers get default 5-minute break duration on migration

## Out of Scope
- "Flashy flashy" visual alerts for inactive timers
- Automated tests
- Multiple simultaneous timers
- Long break vs short break alternation

## Constraints
- Must use existing stack: Vue 3, Vuetify 3, Pinia, localStorage
- OS notifications via browser `Notification API` (requires user permission)
- Must preserve existing localStorage schema for `taskMasterTimers` or migrate gracefully
- Break duration is per-timer, not global

## Files
- `src/stores/timers.ts` — add `breakDuration` to `TimerData`, migrate localStorage, update `addTimer`
- `src/components/composables/breakController.ts` — NEW: state machine controller
- `src/components/composables/timer.ts` — no changes (reused as-is)
- `src/components/TimerPanel/SnoozePanel.vue` — NEW: snooze preset + custom input overlay
- `src/components/TimerPanel/TimerPanel.vue` — consume `useBreakController`, wire new state
- `src/components/TimerPanel/TimerDisplay.vue` — mode label, countdown progress bar, color changes
- `src/components/TimerPanel/TimerControls.vue` — snooze button, skip break button, mode-aware visibility
- `src/components/TimerPanel/AddTimerPanel.vue` — break duration input fields
- `src/components/TimerPanel/TimerBlock.vue` — display break duration

## Risks
- **Notification API permission timing:** Browser may block notifications if not triggered by user gesture. Mitigation: request permission on first timer start (user action), show graceful fallback if denied.
- **localStorage migration edge cases:** Corrupted or empty localStorage. Mitigation: `getTimersFromLocalStorage` already handles missing/empty data; migration adds `breakDuration` with a guard for undefined.
- **Timer drift from `setInterval`:** Both `useTimer` and countdown use `setInterval` which can drift. Mitigation: acceptable for a pomodoro app; not a real-time system.
- **Controller reactivity on timer switch:** When user switches selected timers, controller must fully clean up old timers. Mitigation: `stop()` + `reset()` on watch, same pattern as current `TimerPanel` watch.
