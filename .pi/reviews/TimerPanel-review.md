# Review: src/components/TimerPanel

**Reviewer:** Pi worker  
**Date:** 2026-07-20  
**Scope:** 6 Vue components + 2 composables  

---

## Findings

### F1: Duplicated manual modal pattern across AddTimerPanel and SnoozePanel [should-fix]

Both components replicate the same "manual modal" anti-pattern: a fixed-position wrapper div, a bare `<v-overlay />`, and an absolutely-centered `<v-card>`.

- **File:** `AddTimerPanel.vue:1` / `SnoozePanel.vue:1` (templates)
- **File:** `AddTimerPanel.vue:63-70` / `SnoozePanel.vue:44-51` (styles)
- **Evidence:** Both share identical CSS:
  ```scss
  .add-timer-panel / .snooze-panel {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 999;
  }
  .v-card {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    border: 1px solid darkred; padding: 20px;
  }
  ```
- **Why:** This duplicates ~20 lines of template + style per modal. It's a known issue flagged in the TaskPanel review. Every new modal repeats the same boilerplate and introduces subtle inconsistencies (SnoozePanel's overlay has `@click="showPanel = false"` but AddTimerPanel's does not).
- **Fix sketch:** Extract a `<ModalWrapper v-model="showPanel">` shared component that encapsulates the overlay + centered card.

### F2: Duplicated minutes:seconds input pair pattern [should-fix]

AddTimerPanel has two copies (work + break), and SnoozePanel has one — all structurally identical.

- **File:** `AddTimerPanel.vue:13-26` / `SnoozePanel.vue:26-33`
- **Evidence:**
  ```html
  <v-number-input v-model="minutes" label="Minutes" control-variant="stacked" />
  :
  <v-number-input v-model="seconds" :min="0" :max="59" control-variant="stacked" label="Seconds" />
  ```
- **Why:** Three near-identical blocks with the same label pattern, min/max constraints, and colon separator. Any change (e.g., adding validation) must be applied in three places.
- **Fix sketch:** Create a `<TimeInput v-model="totalSeconds" />` component that manages internal minutes/seconds refs and exposes a single `totalSeconds` model.

### F3: Duplicated duration-to-seconds calculation [nit]

- **File:** `AddTimerPanel.vue:53-54` / `SnoozePanel.vue:42-43`
- **Evidence:**
  ```ts
  // AddTimerPanel
  const workDuration = minutes.value * 60 + seconds.value
  const breakDuration = breakMinutes.value * 60 + breakSeconds.value
  // SnoozePanel
  const totalSeconds = minutes.value * 60 + seconds.value
  ```
- **Why:** The same `minutes * 60 + seconds` arithmetic appears in three places. Trivial, but a utility eliminates drift.
- **Fix sketch:** Add `function toSeconds(minutes: number, seconds: number): number` in `composables/timer.ts`.

### F4: Mixed prop declaration styles — TimerBlock uses runtime objects [should-fix]

- **File:** `TimerBlock.vue:24-36`
- **Evidence:**
  ```ts
  const props = defineProps({
    timerId: { type: String, required: true },
    duration: { type: Number, required: true },
    breakDuration: { type: Number, required: true },
  })
  ```
  Meanwhile, `TimerControls.vue:21` uses `defineProps<{ mode: BreakMode }>()` and `TimerDisplay.vue:21` uses `defineProps<{ ... }>()`.
- **Why:** The project convention is TypeScript-style `defineProps<{...}>()`. TimerBlock is the only component using the legacy runtime object syntax, which loses type inference and is inconsistent with the rest of the module.
- **Fix sketch:** Convert to `defineProps<{ timerId: string; duration: number; breakDuration: number }>()`.

### F5: Hardcoded COUNTDOWN_DURATION (30) duplicated in composable and component [should-fix]

- **File:** `breakController.ts:6` / `TimerDisplay.vue:8`
- **Evidence:**
  ```ts
  // breakController.ts
  const COUNTDOWN_DURATION = 30 // seconds
  // TimerDisplay.vue template
  :model-value="countdownRemaining / 30 * 100"
  ```
- **Why:** The countdown duration is defined in the composable but the display component hardcodes `30` for the progress bar calculation. If the constant changes, the progress bar breaks silently. The constant is not exported.
- **Fix sketch:** Export `COUNTDOWN_DURATION` from `breakController.ts` and import it in TimerDisplay, or promote to a shared config constant.

### F6: Default break duration (300) duplicated across three locations [nit]

- **File:** `TimerPanel.vue:8` / `breakController.ts:12` / `timers.ts:10`
- **Evidence:**
  ```ts
  // TimerPanel.vue
  :break-duration="timer.breakDuration ?? 300"
  // breakController.ts
  const breakTimerDuration = timerData.breakDuration ?? 300
  // timers.ts
  breakDuration: 300
  ```
- **Why:** Three separate magic-number fallbacks for the same domain default. If the default changes, all three must be updated.
- **Fix sketch:** Define `DEFAULT_BREAK_DURATION = 300` in a shared constant and import everywhere.

### F7: Inconsistent store variable naming [nit]

- **File:** `TimerPanel.vue:30` vs `AddTimerPanel.vue:39`
- **Evidence:**
  ```ts
  // TimerPanel.vue
  const timers = useTimersStore()
  // AddTimerPanel.vue
  const timersStore = useTimersStore()
  ```
- **Why:** Inconsistent naming within the same module. `timers` conflates the store instance with the `timers` array property; `timersStore` is clearer.
- **Fix sketch:** Standardize on `timersStore` (or `useTimersStore()` inline).

### F8: `addTimer` allows zero-duration timers [bug]

- **File:** `AddTimerPanel.vue:51-61`
- **Evidence:**
  ```ts
  function addTimer() {
    const workDuration = minutes.value * 60 + seconds.value
    // No validation — workDuration can be 0
    timersStore.addTimer(workDuration, breakDuration)
  }
  ```
- **Why:** Default values for `minutes` and `seconds` are both `0`. A user who clicks "Add Timer" without entering anything creates a timer with 0-second duration. This timer would immediately appear "complete" when selected, producing confusing behavior. The `v-form` `valid` ref is declared but never wired to any validation rules, so it provides no guard.
- **Fix sketch:** Add a guard `if (workDuration <= 0) return` or attach actual Vuetify validation rules to the form fields.

### F9: `useBreakController` captures stale duration on timer data change [bug]

- **File:** `breakController.ts:8-9`
- **Evidence:**
  ```ts
  export function useBreakController(timerData: TimerData) {
    const workTimerDuration = timerData.duration        // captured once
    const breakTimerDuration = timerData.breakDuration ?? 300  // captured once
  ```
- **Why:** `timerData` is passed by reference from `timers.selectedTimer`, but `workTimerDuration` and `breakTimerDuration` are plain numbers captured at composable creation time. If the store mutates `selectedTimer.duration` (e.g., via a future "edit timer" feature), the running controller won't see the change. Currently the workaround in `TimerPanel.vue` is to dispose and recreate the entire controller on `selectedTimer` change, which works but is brittle.
- **Fix sketch:** Accept a getter `() => TimerData` or watch for changes and call `setDuration` reactively.

### F10: `showError` in SnoozePanel never resets after correction [bug]

- **File:** `SnoozePanel.vue:43-49`
- **Evidence:**
  ```ts
  const showError = ref(false)
  function confirmCustom() {
    const totalSeconds = minutes.value * 60 + seconds.value
    if (totalSeconds > 0) {
      emit('confirm', totalSeconds)
      showPanel.value = false
    } else {
      showError.value = true   // set to true, but never set back to false
    }
  }
  ```
- **Why:** Once the user submits a zero duration and sees the error, then corrects the input and tries again, `showError` remains `true` on the second attempt (the error message reappears even though the input is now valid). It's also never cleared when `confirmPreset` is called after a prior error.
- **Fix sketch:** Set `showError.value = false` at the top of `confirmCustom()` and `confirmPreset()`, or watch the input values to clear the error.

### F11: Missing JSDoc on `useBreakController` — the module's primary exported API [should-fix]

- **File:** `breakController.ts:7`
- **Evidence:**
  ```ts
  export function useBreakController(timerData: TimerData) {
  ```
  No JSDoc comment. Contrast with `useTimer` in `timer.ts` which has a `/** Timer composable */` block.
- **Why:** `useBreakController` is the most complex composable in the module (180+ lines, manages state machines, notifications, intervals). It deserves documentation describing its lifecycle, the `dispose()` contract, and the mode transition flow.
- **Fix sketch:** Add a JSDoc block documenting parameters, return shape, and the dispose requirement.

### F12: Missing JSDoc on `displayTime` utility [nit]

- **File:** `timer.ts:3`
- **Evidence:**
  ```ts
  export function displayTime(time: number) {
  ```
  No JSDoc. The `displayTimeString` computed inside `useTimer` has a comment but the shared utility does not.
- **Why:** `displayTime` is imported by both `breakController.ts` and `TimerBlock.vue` — it's a cross-module utility that should document its input unit (seconds) and output format (`MM:SS`).
- **Fix sketch:** Add `/** Format seconds as "MM:SS" string. @param time - seconds */`.

### F13: `v-form` in AddTimerPanel has `valid` ref but no validation rules [bug]

- **File:** `AddTimerPanel.vue:10`
- **Evidence:**
  ```html
  <v-form v-model="valid" @submit.prevent="addTimer">
  ```
  ```ts
  const valid = ref(false)  // never set to true by anything
  ```
- **Why:** The `valid` ref exists but no `v-validate` rules are attached to any child input. The form is perpetually invalid, yet `addTimer` is called via `@click` on the button (not via form submit), so `valid` is never checked. Dead code that gives a false sense of validation.
- **Fix sketch:** Either attach real Vuetify validation rules to the number inputs, or remove the `v-form` / `valid` ref and use a plain `<form>`.

### F14: SnoozePanel preset buttons bypass form validation entirely [nit]

- **File:** `SnoozePanel.vue:16-18`
- **Evidence:**
  ```html
  <v-btn color="primary" @click="confirmPreset(300)">5 min</v-btn>
  ```
  The `confirmPreset` function emits directly without touching the form's `valid` state or the `showError` state.
- **Why:** If the user previously triggered an error via the custom form, then clicks a preset button, the error message persists (see F10). The preset path and form path have divergent side effects.
- **Fix sketch:** Clear `showError.value = false` in `confirmPreset`.

### F15: `timerInterval` in `useTimer` not cleaned up on scope disposal [should-fix]

- **File:** `timer.ts:22`
- **Evidence:**
  ```ts
  const timerInterval = ref(-1)
  // No onUnmounted or onScopeDispose hook
  ```
- **Why:** If a timer is started and the component using it is unmounted without calling `resetTimer()` or `stopTimer()`, the `setInterval` continues running in the background. The `useBreakController.dispose()` function does call `stopTimer()`, but `useTimer` is also exported as a standalone type (`Timer`) and could be used directly without a dispose path.
- **Fix sketch:** Add `onScopeDispose(() => { clearInterval(timerInterval.value); timerInterval.value = -1; })` inside `useTimer`.

---

## Conventions observed

- All 6 components use `<script setup lang="ts">` — consistent.
- `defineModel` used correctly in AddTimerPanel and SnoozePanel for v-model binding.
- `defineEmits` used with TypeScript type syntax in TimerControls and SnoozePanel.
- Scoped SCSS styles in all components — consistent.
- Manual modal pattern (div + v-overlay + positioned v-card) used identically in AddTimerPanel and SnoozePanel — consistent within the module but a known anti-pattern.
- Pinia stores imported from `@/stores/` — consistent.
- JSDoc coverage is low: only `useTimer` and `addTimer` (store action) have documentation; most component-level functions lack comments.

---

## Coverage

- **Reviewed:** TimerPanel.vue, TimerBlock.vue, TimerControls.vue, TimerDisplay.vue, AddTimerPanel.vue, SnoozePanel.vue, composables/breakController.ts, composables/timer.ts, stores/timers.ts (for type context)
- **Skipped:** none
