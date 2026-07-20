# Review: src/components/composables

## Findings

### F1: Stale duration capture — timer durations frozen at composable creation [bug]
- File: `breakController.ts:11-12`
- Evidence: `const workTimerDuration = timerData.duration` / `const breakTimerDuration = timerData.breakDuration ?? 300`
- Why: `timerData` is passed as a plain object. Its `duration` and `breakDuration` are read once and captured as plain numbers. If the user edits the selected timer's duration in the store, the running controller never sees the change — even on the next `start()` call, it uses the stale captured values. This is especially problematic because `TimerPanel.vue` recreates the controller on `selectedTimer` change, but edits to the *same* timer's duration are silently ignored.
- Fix sketch: Accept a `ComputedRef<TimerData>` or reactive object, and read durations inside `start()` / `startBreak()` rather than capturing at creation.

### F2: No `onScopeDispose` — intervals and watchers leak if `dispose()` is not called [bug]
- File: `breakController.ts` (composable body), `timer.ts` (`useTimer` body)
- Evidence: Neither composable imports or calls `onScopeDispose`. `breakController.ts` exposes a manual `dispose()` and `TimerPanel.vue:50` calls it before recreating, but there is no safety net.
- Why: If the consuming component is unmounted without calling `dispose()` (e.g., a navigation away, or a future refactor), all `setInterval` handles and Vue watchers remain active, leaking memory and potentially mutating destroyed component state.
- Fix sketch: Add `import { onScopeDispose } from 'vue'` and call `dispose()` (in `breakController`) and `clearInterval(timerInterval.value)` (in `timer.ts`) inside `onScopeDispose`.

### F3: `timeRemainingInSeconds` can go negative — no clamping [bug]
- File: `timer.ts:20`
- Evidence: `const timeRemainingInSeconds = computed(() => duration.value - elapsedSeconds.value)`
- Why: If `elapsedSeconds` exceeds `duration` (timer drift, snooze extending past original duration, or a watcher firing after `stopTimer`), the computed returns a negative number. `displayTime()` then produces output like `-0:5` because `Math.floor(-5 / 60)` is `-1` and `Math.floor(-5 % 60)` is `-5`.
- Fix sketch: Clamp with `Math.max(0, duration.value - elapsedSeconds.value)`.

### F4: `start()` does not guard against non-idle mode — silently resets active timer [bug]
- File: `breakController.ts:123-137`
- Evidence: `function start() { ... workTimer.setDuration(workTimerDuration); workTimer.resetTimer(); ... workTimer.startTimer(); mode.value = 'work' }` — no check on `mode.value`.
- Why: Calling `start()` while already in `work`, `break`, or `countdown` mode silently stops the active timer, resets elapsed time to 0, and restarts. A double-tap on the Start button (or a programmatic call) would reset progress without warning.
- Fix sketch: Add `if (mode.value !== 'idle') { stop(); }` at the top, or `if (mode.value === 'work') return;` with a console warning.

### F5: `displayTime` does not handle negative or non-numeric input [nit]
- File: `timer.ts:3-7`
- Evidence: `export function displayTime(time: number) { const minutes = Math.floor(time / 60); const seconds = Math.floor(time % 60); ... }`
- Why: No input validation. Negative values produce `-0:5` style output. `NaN` or non-finite values propagate silently. This is a shared utility consumed by both composables and `TimerBlock.vue`.
- Fix sketch: Add `time = Math.max(0, Math.floor(time))` at the top, or clamp callers (F3 covers the main caller).

### F6: Hardcoded `COUNTDOWN_DURATION` — not configurable [should-fix]
- File: `breakController.ts:8`
- Evidence: `const COUNTDOWN_DURATION = 30 // seconds`
- Why: The countdown duration is a module-level constant. Users or the app cannot configure it through `timerData` or the composable API. This is a product limitation — some users may want 10s or 60s countdowns.
- Fix sketch: Accept `countdownDuration` in `timerData` or as a parameter to `useBreakController`, defaulting to 30.

### F7: Default break duration duplicated across store and composable [nit]
- File: `breakController.ts:12` and `stores/timers.ts:12`
- Evidence: `breakTimerDuration = timerData.breakDuration ?? 300` vs `defaultTimer: TimerData = { ..., breakDuration: 300 }`
- Why: The fallback `300` is duplicated. If the store default changes (e.g., to 240), the composable fallback won't match, creating inconsistent behavior for timers without an explicit `breakDuration`.
- Fix sketch: Export a `DEFAULT_BREAK_DURATION` constant from the store or a shared config module and import it.

### F8: Missing JSDoc on `useBreakController` [nit]
- File: `breakController.ts:10`
- Evidence: `export function useBreakController(timerData: TimerData) {` — no JSDoc comment.
- Why: Project convention requires JSDoc on exported functions. `useTimer` in `timer.ts:14` has JSDoc; `useBreakController` does not.
- Fix sketch: Add a JSDoc block documenting parameters, return shape, and lifecycle (especially the `dispose` contract).

### F9: Missing JSDoc on `displayTime` [nit]
- File: `timer.ts:3`
- Evidence: `export function displayTime(time: number) {` — no JSDoc.
- Why: Shared utility consumed by `breakController.ts`, `TimerBlock.vue`, and `timer.ts` itself. No documentation of expected input (seconds, non-negative) or output format (`MM:SS`).
- Fix sketch: Add `/** Format seconds as MM:SS. @param time - seconds (non-negative) */`.

### F10: Inconsistent Vue import style between the two composables [nit]
- File: `breakController.ts:1` vs `timer.ts` (no imports)
- Evidence: `breakController.ts` explicitly imports `computed`, `ref`, `watch` from `'vue'`, while `timer.ts` relies on auto-imports for `ref` and `computed`.
- Why: Inconsistent style. The project uses auto-imports (evidenced by `timer.ts` working without imports). The explicit imports in `breakController.ts` are dead weight and suggest the file was written before auto-imports were configured, or by a different author.
- Fix sketch: Remove the explicit `import { computed, type ComputedRef, ref, watch } from 'vue'` line from `breakController.ts`.

### F11: Explicit `.ts` extension in import paths [nit]
- File: `breakController.ts:2-3`
- Evidence: `import { displayTime, useTimer } from '@/components/composables/timer.ts'` and `import type { TimerData } from '@/stores/timers.ts'`
- Why: Including `.ts` in import paths is non-standard for bundler-based projects and can cause portability issues (e.g., if files are later changed to `.js` or if the bundler expects extensionless resolves). `TimerPanel.vue:36-37` uses the same pattern, so this is a project-wide convention, but it's worth noting.
- Fix sketch: Remove `.ts` extensions and rely on bundler resolution (consistent with most Vue/Vite projects).

### F12: `breakController` re-composes `displayTimeString` instead of delegating [simplification]
- File: `breakController.ts:29-40`
- Evidence: The composable builds its own `displayTimeString` computed that branches on mode and delegates to either `displayTime(countdownRemaining.value)`, `breakTimer.displayTimeString.value`, or `workTimer.displayTimeString.value`.
- Why: This is a reasonable composition, but it duplicates the `displayTime` import and logic that already exists inside each timer. A cleaner approach would be to expose a unified `activeTimer` computed and let the UI decide display format, reducing the surface area of `useBreakController`.
- Fix sketch: Expose `activeTimer` (switching between `workTimer`/`breakTimer`/null) and move display formatting to the UI layer. Alternatively, keep as-is but extract into a clearly named helper.

### F13: `snooze` in countdown mode restarts work timer without checking if it was running [correctness]
- File: `breakController.ts:175-180`
- Evidence: 
  ```
  case 'countdown': {
    workTimer.startTimer()
    mode.value = 'work'
    return
  }
  ```
- Why: When snoozing during countdown, the code unconditionally calls `workTimer.startTimer()`. However, the work timer was stopped by the completion watcher before countdown started. If `elapsedSeconds` is already at `duration` (timer completed exactly), `startTimer()` will resume counting from a completed state. The `setDuration` call before it sets `duration = elapsed + snooze`, so this should work, but the logic is fragile — it depends on `setDuration` being called first in the same synchronous block.
- Fix sketch: Add an explicit `workTimer.resetTimer()` before `startTimer()` in the countdown case, or document the invariant more clearly.

### F14: `countdownRemaining` not reset in `startBreak()` [nit]
- File: `breakController.ts:103-108`
- Evidence: `startBreak()` sets `mode.value = 'break'` but does not reset `countdownRemaining.value`. The previous `stopCountdown()` in `startCountdown()`'s interval callback clears the interval but leaves `countdownRemaining` at 0 (because the interval decremented it to 0). However, if `stopCountdown()` is called manually mid-countdown and then `startBreak()` is reached through another path, `countdownRemaining` could be non-zero.
- Fix sketch: Add `countdownRemaining.value = 0` at the start of `startBreak()`.

---

## Conventions observed

- **JSDoc**: `useTimer` has JSDoc; `displayTime` and `useBreakController` do not — partially inconsistent with the stated convention.
- **Auto-imports**: `timer.ts` uses auto-imported `ref`/`computed`; `breakController.ts` has explicit imports — inconsistent.
- **Import extensions**: Both composables and consuming components use `.ts` in import paths — consistent within the project but non-standard.
- **Manual disposal**: `breakController` exposes `dispose()` and `TimerPanel.vue` calls it correctly in the watch — good pattern, but lacks the `onScopeDispose` safety net.

## Coverage

- **Reviewed**: `src/components/composables/timer.ts` (72 lines), `src/components/composables/breakController.ts` (250 lines)
- **Skipped**: none (only two files in the module)
- **Context reviewed**: `src/components/TimerPanel/TimerPanel.vue` (consumer), `src/stores/timers.ts` (TimerData type)
