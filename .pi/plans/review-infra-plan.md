# Plan: Review infrastructure — fix dark theme, background color, cleanup
Status: APPROVED
Brief: .pi/preplan/review-infra-preplan.md

## Goal
Fix 7 findings from the code review of infrastructure modules: 2 correctness bugs (missing dark theme, wrong background color), 2 simplifications (dead CSS, empty script block), and 3 nits (mixed imports, misleading JSDoc, missing JSDoc).

## Findings

### F1: Missing dark theme — crashes on dark-mode systems [bug]
- File: src/plugins/vuetify.ts:17-27
- Evidence: `defaultTheme: 'system'` but only `light` theme defined
- Fix: Add a `dark` theme object using Vuetify default dark palette

### F2: `background` color is bright blue [bug]
- File: src/plugins/vuetify.ts:23
- Evidence: `background: '#0c9aff'` — vivid blue, not a light surface
- Fix: Change to `#ffffff`

### F3: Dead CSS `.task-panel` [simplification]
- File: src/pages/index.vue:17-19
- Evidence: `.task-panel { width: 100%; }` but no element has that class
- Fix: Remove the rule

### F4: Empty `<script>` block in App.vue [simplification]
- File: src/App.vue:5-7
- Fix: Remove the `<script>` block

### F5: Mixed import strategy [consistency]
- File: src/pages/index.vue:6-14
- Evidence: TaskPanel/TimerPanel explicitly imported, AddTaskPanel auto-imported
- Fix: Rely on auto-import for all three (remove explicit imports, keeping `showPanel` ref)

### F6: Misleading JSDoc "Automatically included" [nit]
- File: src/plugins/index.ts:4
- Fix: Change to "Plugin registration — imported by `./src/main.ts`"

### F7: Missing JSDoc on `registerPlugins` [nit]
- File: src/plugins/index.ts:12
- Fix: Add JSDoc block

### Dark theme decision
- Use Vuetify default dark palette (user choice).

## Choices
- Test-first: no
- Granularity: high-level
- Path: lightweight
- Execution mode: single-session

## Steps
- [ ] Fix F1 — add `dark` theme with Vuetify default dark colors to `src/plugins/vuetify.ts`
  - Verify: `pnpm type-check`
- [ ] Fix F2 — change `background` from `#0c9aff` to `#ffffff` in `src/plugins/vuetify.ts`
  - Verify: `pnpm type-check`
- [ ] Fix F3 — remove dead `.task-panel` CSS rule from `src/pages/index.vue`
  - Verify: `pnpm lint`
- [ ] Fix F4 — remove empty `<script>` block from `src/App.vue`
  - Verify: `pnpm lint`
- [ ] Fix F5 — remove explicit imports for TaskPanel/TimerPanel in `src/pages/index.vue` (rely on auto-import)
  - Verify: `pnpm type-check`
- [ ] Fix F6 — update JSDoc comment in `src/plugins/index.ts`
  - Verify: `pnpm lint`
- [ ] Fix F7 — add JSDoc to `registerPlugins` in `src/plugins/index.ts`
  - Verify: `pnpm lint`
- [ ] Final verification — run full lint and type-check
  - Verify: `pnpm type-check && pnpm lint`

## Worklog

## Interfaces
No new interfaces. Only existing config and style changes.

## Test Plan
No tests — cosmetic and config fixes only.

## Acceptance Criteria
- `pnpm type-check` passes
- `pnpm lint` passes
- App loads correctly on both light and dark OS themes
- Page background is a light surface color, not blue

## Out of Scope
- Components, composables, stores (separate briefs)

## Constraints
- Vuetify 3 theme system
- Auto-routes, auto-imports, auto-components
- `<script setup lang="ts">` SFC style

## Files
- src/plugins/vuetify.ts (F1, F2)
- src/pages/index.vue (F3, F5)
- src/App.vue (F4)
- src/plugins/index.ts (F6, F7)

## Risks
- Removing explicit imports (F5) assumes auto-import is configured for `@/components/**` — confirmed by existing auto-import of `AddTaskPanel`. If auto-import fails, restore explicit imports.
