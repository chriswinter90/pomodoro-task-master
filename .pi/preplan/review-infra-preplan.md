# Brief: Review infrastructure — fix dark theme, background color, cleanup
Status: SCOPED
Created: 2026-07-20
Base: 1e97a5f1d3e0a092ff3afddfe4e4e81729015415

## Goal
Fix 7 findings from the code review of infrastructure modules (router, plugins, layouts, pages, App.vue, main.ts): 2 correctness bugs (missing dark theme crashes app on dark-mode systems, wrong background color), 2 simplifications (dead CSS, empty script block), and 3 nits (mixed imports, misleading JSDoc, missing JSDoc).

## Findings

### F1: Missing dark theme — crashes on dark-mode systems [bug]
- File: src/plugins/vuetify.ts:17-27
- Evidence: `defaultTheme: 'system'` but only `light` theme defined
- Fix: Add a `dark` theme object, or change `defaultTheme` to `'light'`

### F2: `background` color is bright blue [bug]
- File: src/plugins/vuetify.ts:23
- Evidence: `background: '#0c9aff'` — vivid blue, not a light surface
- Fix: Change to `#f5f5f5` or `#ffffff`

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
- Fix: Either import all explicitly or rely on auto-import for all

### F6: Misleading JSDoc "Automatically included" [nit]
- File: src/plugins/index.ts:4
- Fix: Change to "Plugin registration — imported by `./src/main.ts`"

### F7: Missing JSDoc on `registerPlugins` [nit]
- File: src/plugins/index.ts:12
- Fix: Add JSDoc block

## Key Files
- src/plugins/vuetify.ts — Vuetify config, F1, F2
- src/pages/index.vue — main page, F3, F5
- src/App.vue — app root, F4
- src/plugins/index.ts — plugin registration, F6, F7
- src/router/index.ts — router setup (clean, no findings)
- src/layouts/default.vue — default layout (clean, no findings)
- src/main.ts — entry point (clean, no findings)

## Interview
- User chose to include all 7 findings in the brief.

## Approach
1. Fix F1 — add dark theme to Vuetify config
2. Fix F2 — change background to light surface color
3. Fix F3 — remove dead CSS
4. Fix F4 — remove empty script block
5. Fix F5 — standardize import strategy
6. Fix F6 — fix JSDoc comment
7. Fix F7 — add JSDoc to registerPlugins

## Rejected Alternatives
- None — all findings accepted.

## Open Questions
- Should the dark theme mirror the light theme with inverted colors, or use a specific dark palette?

## Out of Scope
- Components, composables, stores (separate briefs)

## Constraints
- Vuetify 3 theme system
- Auto-routes, auto-imports, auto-components
- `<script setup lang="ts">` SFC style

## Verification
- `pnpm type-check` passes
- `pnpm lint` passes
- Manual: app loads correctly on both light and dark OS themes
- Manual: page background is a light surface color, not blue
