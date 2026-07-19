# Brief: break timer
Status: PLANNED
Created: 2026-07-18
Base: f21b8e881f3d561d13646831c7f87c1d53bb434d

## Goal
Add a break timer that automatically starts after a work timer completes, with OS notifications, a 30-second countdown window before auto-transition, and snooze support for both work and break timers. The UI must clearly distinguish between work and break modes.

## Findings
- `useTimer` composable (`src/components/composables/timer.ts`) has no completion callback — when `timeRemainingInSeconds` hits 0, nothing fires. Timer just keeps running with negative remaining time.
- `useTimersStore` (`src/stores/timers.ts`) stores timer definitions as `{ id, duration }` in localStorage key `taskMasterTimers`. No concept of timer type (work/break) or break duration.
- `TimerPanel.vue` creates a single `useTimer` instance per selected timer. No state machine, no break concept, no completion handling.
- `TimerDisplay.vue` is a dumb display component — just renders `displayTimeString`.
- `TimerControls.vue` has Start/Stop/Reset buttons, no snooze or completion UI.
- No existing tests in the project.
- No prior memory or session context about this feature.

## Key Files
- `src/components/composables/timer.ts` — core timer logic; needs a completion callback or event
- `src/stores/timers.ts` — timer data model; needs `breakDuration` field on `TimerData`
- `src/components/TimerPanel/TimerPanel.vue` — orchestrates timer lifecycle; will consume the new controller composable
- `src/components/TimerPanel/TimerDisplay.vue` — needs visual distinction between work and break modes
- `src/components/TimerPanel/TimerControls.vue` — needs snooze button and mode-aware controls
- `src/components/TimerPanel/AddTimerPanel.vue` — needs a break duration input field
- `src/components/TimerPanel/TimerBlock.vue` — may need to display break duration alongside work duration

## Interview
- **Q: What happens when a work timer completes?** A: OS notification → 30s countdown → auto-start break timer.
- **Q: How is break duration determined?** A: Per-timer config, set when the timer is created.
- **Q: What happens after break completes?** A: Stop + OS notification. No auto-loop back to work.
- **Q: Can timers be snoozed?** A: Yes, both work and break timers. Snooze shows a panel with 3 preset options (5, 10, 15 minutes) plus a field to enter a custom snooze duration. Snooze extends the current timer during the 30s countdown window.
- **Q: How will you verify this works?** A: Manual test in dev server + visual check that work vs break mode is clearly distinguished.
- **Q: Which architecture approach?** A: Approach 2 — dedicated controller composable (`useBreakController`) that manages the full cycle state machine; `TimerPanel` consumes its state.

## Approach
Create a `useBreakController` composable that owns the timer cycle state machine with modes: `work`, `countdown`, `break`, `idle`. It watches the active timer for completion, fires OS notifications via `Notification API`, runs a 30-second countdown, auto-transitions to break (for work completion) or stops (for break completion), and supports snoozing either timer type. `TimerPanel` reads `mode` and delegates actions (`snooze()`, `skipBreak()`, etc.) to the controller.

The `TimerData` model gains a `breakDuration` field (default 300s / 5min). The `AddTimerPanel` gets a break duration input. `TimerDisplay` and `TimerControls` become mode-aware with visual distinction (color, label) between work and break. A new `SnoozePanel` component offers 3 preset durations (5, 10, 15 minutes) and a custom time input field.

## Rejected Alternatives
- **Approach 1 (break state in TimerPanel):** Rejected because snooze support for both timer types would bloat the component with state machine logic, countdown handling, and notification wiring alongside rendering concerns.
- **Approach 3 (break logic inside useTimer):** Rejected because it couples a generic timer composable to pomodoro-specific cycle behavior, reducing reusability.

## Open Questions
- What should the default break duration be? 5 minutes (300s) or something else?
- What should the 30-second countdown look like in the UI? A small overlay, a label change, or a progress indicator?

## Out of Scope
- "Flashy flashy" visual alerts for inactive timers (separate feature)
- Automated tests (no existing test infrastructure, manual verification only)
- Multiple simultaneous timers
- Long break vs short break alternation

## Constraints
- Must use existing stack: Vue 3, Vuetify 3, Pinia, localStorage
- OS notifications via browser `Notification API` (requires user permission)
- Must preserve existing localStorage schema for `taskMasterTimers` or migrate gracefully
- Break duration is per-timer, not global

## Verification
- Run `pnpm dev`, start a short work timer (e.g., 10 seconds for testing), wait for completion
- Observe: OS notification appears, 30-second countdown visible in UI, break timer auto-starts
- During countdown, click snooze → work timer extends, countdown resets
- Break timer completes → OS notification, timer stops (no auto-loop)
- UI clearly shows "Break" vs "Work" mode (different color, label, or icon)
- Create a new timer with a break duration via AddTimerPanel; verify it persists after page reload
- During countdown, click snooze → SnoozePanel appears with 5/10/15 min presets and custom input; selecting extends timer correctly
