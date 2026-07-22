/**
 * plugins/index.ts
 *
 * Plugin registration — imported by `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '../stores'
import router from '../router'

// Types
import type { App } from 'vue'

/**
 * Register all application plugins.
 *
 * @param app - Vue application instance
 */
export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}
