# Brief: Review TimerPanel — fix bugs, simplify, add JSDoc
Status: SCOPED
Created: 2026-07-20
Base: 1e97a5f1d3e0a092ff3afddfe4e4e81729015415

## Goal
Fix 22 findings from the code reviews of `src/components/TimerPanel` and `src/components/composables`: 6 correctness bugs, 6 simplification opportunities, and 10 nits/consistency issues. Extract shared modal and time-input patterns, fix stale duration capture, add cleanup hooks, clamp negative time, and add JSDoc.

## Findings

### F1: Duplicated manual modal pattern [should-fix]
- File: AddTimerPanel.vue, SnoozePanel.vue
- Evidence: Identical fixed div + v-overlay + positioned v-card CSS (~20 lines per modal)
- Fix: Extract `<ModalWrapper>` shared component

### F2: Duplicated minutes:seconds input pair [should-fix]
- File: AddTimerPanel.vue (2x), SnoozePanel.vue (1x)
- Evidence: Three near-identical v-number-input pairs with colon separator
- Fix: Create `<TimeInput v-model="totalSeconds">` component

### F3: Duplicated duration-to-seconds calculation [nit]
- File: AddTimerPanel.vue:53-54, SnoozePanel.vue:42-43
- Evidence: `minutes * 60 + seconds` in three places
- Fix: Add `toSeconds(min, sec)` utility in composables/timer.ts

### F4: Mixed prop declaration styles [should-fix]
- File: TimerBlock.vue:24-36
- Evidence: Runtime object `defineProps({...})` while other components use TS generics
- Fix: Convert to `defineProps<{ timerId: string; duration: number; breakDuration: number }>()`

### F5: Hardcoded COUNTDOWN_DURATION duplicated [should-fix]
- File: breakController.ts:6, TimerDisplay.vue:8
- Evidence: Constant defined but not exported; TimerDisplay hardcodes `30`
- Fix: Export constant, import in TimerDisplay

### F6: Default break duration (300) duplicated across 3 locations [nit]
- File: TimerPanel.vue:8, breakController.ts:12, timers.ts:10
- Fix: Define `DEFAULT_BREAK_DURATION` constant

### F7: Inconsistent store naming [nit]
- File: TimerPanel.vue:30 (`timers`) vs AddTimerPanel.vue:39 (`timersStore`)
- Fix: Standardize on `timersStore`

### F8: `addTimer` allows zero-duration timers [bug]
- File: AddTimerPanel.vue:51
- Evidence: No validation, defaults are 0, `valid` ref is never checked
- Fix: Guard `if (workDuration <= 0) return` or add real validation rules

### F9: `useBreakController` captures stale duration [bug]
- File: breakController.ts:8-9
- Evidence: `timerData.duration` captured as plain number at creation
- Fix: Accept getter `() => TimerData` or watch for changes

### F10: `showError` in SnoozePanel never resets [bug]
- File: SnoozePanel.vue:43-49
- Evidence: Set to true on error, never cleared
- Fix: Clear at top of `confirmCustom()` and `confirmPreset()`

### F11: Missing JSDoc on `useBreakController` [nit]
- File: breakController.ts:7
- Fix: Add JSDoc documenting lifecycle, dispose contract, mode transitions

### F12: Missing JSDoc on `displayTime` [nit]
- File: timer.ts:3
- Fix: Add `/** Format seconds as "MM:SS" string */`

### F13: `v-form` `valid` ref has no validation rules [bug]
- File: AddTimerPanel.vue:10
- Evidence: `valid` is `ref(false)`, no rules on inputs, never checked
- Fix: Attach real rules or remove v-form/valid

### F14: Preset buttons bypass error clearing [nit]
- File: SnoozePanel.vue:16-18
- Fix: Clear `showError` in `confirmPreset`

### F15: `timerInterval` not cleaned up on scope disposal [should-fix]
- File: timer.ts:22
- Evidence: No `onScopeDispose` hook
- Fix: Add `onScopeDispose(() => clearInterval(timerInterval.value))`

## Key Files
- src/components/TimerPanel/TimerPanel.vue — main orchestrator, F6, F7
- src/components/TimerPanel/TimerBlock.vue — individual timer cards, F4
- src/components/TimerPanel/TimerDisplay.vue — time display, F5
- src/components/TimerPanel/AddTimerPanel.vue — add timer modal, F1, F2, F3, F8, F13
- src/components/TimerPanel/SnoozePanel.vue — snooze dialog, F1, F2, F3, F10, F14
- src/components/TimerPanel/TimerControls.vue — controls (clean, no findings)
- src/components/composables/breakController.ts — timer state machine, F5, F9, F11, F17, F19-F22
- src/components/composables/timer.ts — base timer, F3, F12, F15, F16, F18

## Interview
- User chose to include all 15 findings in the brief.

## Approach
1. Fix F8, F13 — add validation to AddTimerPanel
2. Fix F10, F14 — reset showError in SnoozePanel
3. Fix F9 — make useBreakController reactive to timer data changes
4. Fix F15, F2 — add onScopeDispose cleanup to useTimer and useBreakController
5. Fix F16 — clamp timeRemainingInSeconds
6. Fix F17 — guard start() against non-idle mode
7. Fix F18 — validate displayTime input
8. Fix F1 — extract ModalWrapper shared component
9. Fix F21 — simplify displayTimeString composition
10. Fix F22 — harden snooze-in-countdown, reset countdownRemaining in startBreak
11. Fix F20 — remove .ts extensions from imports
12. Fix F19 — remove explicit Vue imports (use auto-imports)
13. Fix F5 — export and use COUNTDOWN_DURATION constant
14. Fix F3, F6 — extract shared utilities/constants
15. Fix F2 — extract TimeInput shared component
16. Fix F4 — convert TimerBlock to TS-style props
17. Fix F7 — standardize store naming
18. Fix F11, F12 — add JSDoc

### F16: `timeRemainingInSeconds` can go negative — no clamping [bug]
- File: timer.ts:20
- Evidence: `duration.value - elapsedSeconds.value` with no `Math.max(0, ...)`
- Fix: Clamp with `Math.max(0, duration.value - elapsedSeconds.value)`

### F17: `start()` doesn't guard against non-idle mode [bug]
- File: breakController.ts:123
- Evidence: No check on `mode.value` before resetting and restarting
- Fix: Add `if (mode.value !== 'idle') { stop(); }` at top

### F18: `displayTime` doesn't handle negative/non-numeric input [nit]
- File: timer.ts:3
- Fix: Add `time = Math.max(0, Math.floor(time))` at top

### F19: Inconsistent Vue import style [nit]
- File: breakController.ts:1
- Evidence: Explicit `import { computed, ref, watch } from 'vue'` while timer.ts uses auto-imports
- Fix: Remove explicit imports, rely on auto-imports

### F20: Explicit `.ts` extensions in import paths [nit]
- File: breakController.ts:2-3, TimerPanel.vue:36-37
- Fix: Remove `.ts` extensions, rely on bundler resolution

### F21: `displayTimeString` re-composed instead of delegated [simplification]
- File: breakController.ts:29-40
- Fix: Expose `activeTimer` computed and let UI decide display format

### F22: Fragile snooze-in-countdown + `countdownRemaining` not reset in `startBreak()` [nit]
- File: breakController.ts:175-180, 103-108
- Fix: Add `workTimer.resetTimer()` before `startTimer()` in countdown case; add `countdownRemaining.value = 0` in `startBreak()`

## Rejected Alternatives
- None — all findings accepted.

## Open Questions
- Should ModalWrapper use `<v-dialog>` directly, or keep the manual modal pattern for now?
- Should `useBreakController` accept a getter or watch reactively?

## Out of Scope
- TaskPanel (separate brief), stores (separate brief), router, plugins, layouts, pages

## Constraints
- `<script setup lang="ts">` SFC style
- Vuetify 3 components
- Auto-imported Vue composition API
- Pinia stores from `@/stores/`
- SCSS scoped styles

## Verification
- `pnpm type-check` passes
- `pnpm lint` passes
- Manual: timers can be added (non-zero duration), started, stopped, snoozed
- Manual: snooze error clears after correction
- Manual: timer intervals stop when components unmount
