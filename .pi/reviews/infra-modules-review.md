# Review: Infrastructure Modules (router, plugins, layouts, pages, App.vue, main.ts)

## Findings

### F1: Missing dark theme definition causes runtime error on dark-mode systems [bug]
- File: `src/plugins/vuetify.ts:17-27`
- Evidence:
  ```ts
  theme: {
    defaultTheme: 'system',
    themes: {
      light: { /* ... */ },
      // no dark theme defined
    },
  },
  ```
- Why: `defaultTheme: 'system'` resolves to `'dark'` when the user's OS prefers dark mode. Since no `dark` theme is defined, Vuetify throws a runtime error (`Theme "dark" not found`) or falls back to undefined colors, breaking the UI entirely on dark-mode systems.
- Fix sketch: Add a `dark` theme object alongside `light` in the `themes` config, or change `defaultTheme` to `'light'` if dark mode is not supported.

### F2: Light theme `background` color is bright blue, not a light surface [bug]
- File: `src/plugins/vuetify.ts:23`
- Evidence:
  ```ts
  background: '#0c9aff',
  ```
- Why: Vuetify's `background` color is the app's default surface color. `#0c9aff` is a vivid blue — this will make the entire page background blue instead of white/light-gray. This is likely a copy-paste error from a different color role.
- Fix sketch: Change to a light surface color, e.g. `background: '#f5f5f5'` or `background: '#ffffff'`.

### F3: Dead CSS class `.task-panel` in scoped styles [simplification]
- File: `src/pages/index.vue:17-19`
- Evidence:
  ```scss
  .task-panel {
    width: 100%;
  }
  ```
- Why: The template uses `<TaskPanel class="mb-8" />` — there is no element with the class `task-panel`. This CSS is dead code and will never match.
- Fix sketch: Remove the `.task-panel` rule block.

### F4: Empty `<script>` block in `App.vue` [simplification]
- File: `src/App.vue:5-7`
- Evidence:
  ```html
  <script lang="ts" setup>

  </script>
  ```
- Why: The script block is empty. With `<script setup>`, if there's no logic, the entire block is unnecessary boilerplate.
- Fix sketch: Remove the `<script>` block entirely.

### F5: Mixed import strategy for components in `pages/index.vue` [consistency]
- File: `src/pages/index.vue:6-14`
- Evidence:
  ```html
  <TaskPanel ... />          <!-- explicitly imported -->
  <add-task-panel ... />    <!-- auto-imported, no explicit import -->
  <TimerPanel />            <!-- explicitly imported -->
  ```
- Evidence (script):
  ```ts
  import TaskPanel from '@/components/TaskPanel/TaskPanel.vue'
  import TimerPanel from '@/components/TimerPanel/TimerPanel.vue'
  // AddTaskPanel is NOT imported — relies on auto-components
  ```
- Why: Two of three components are explicitly imported while the third relies on `unplugin-vue-components` auto-import. This is inconsistent — pick one strategy. Explicit imports are more readable and survive IDE navigation; auto-imports are less boilerplate.
- Fix sketch: Either add `import AddTaskPanel from '@/components/TaskPanel/AddTaskPanel.vue'` and use `<AddTaskPanel>`, or remove the two explicit imports and rely on auto-import for all three.

### F6: Misleading JSDoc in `plugins/index.ts` [nit]
- File: `src/plugins/index.ts:4`
- Evidence:
  ```ts
  * Automatically included in `./src/main.ts`
  ```
- Why: The comment implies the file is auto-included (e.g., via a Vite plugin or glob import). In reality, `main.ts` explicitly `import { registerPlugins } from '@/plugins'`. The comment is misleading.
- Fix sketch: Change to `* Plugin registration — imported by \`./src/main.ts\``.

### F7: Missing JSDoc on exported `registerPlugins` [convention]
- File: `src/plugins/index.ts:12`
- Evidence:
  ```ts
  export function registerPlugins (app: App) {
  ```
- Why: Project convention calls for JSDoc on exported functions. This is the sole exported function from the plugins module.
- Fix sketch: Add a JSDoc block: `/** Register all application plugins on the Vue app instance. */`

## Conventions observed
- `<script setup lang="ts">` used consistently across SFCs.
- Import paths use `.ts` extension for TypeScript files (router/index.ts, plugins/vuetify.ts).
- JSDoc module header comments present on all `.ts` files.
- Auto-routing via `unplugin-vue-router` with `virtual:generated-layouts` for layout wrapping.
- Vite HMR dynamic-import error workaround in router is a known Vite pattern.

## Coverage
- Reviewed: `src/router/index.ts`, `src/plugins/index.ts`, `src/plugins/vuetify.ts`, `src/layouts/default.vue`, `src/pages/index.vue`, `src/App.vue`, `src/main.ts`
- Skipped: `src/pages/README.md`, `src/plugins/README.md` (documentation stubs, no code)
