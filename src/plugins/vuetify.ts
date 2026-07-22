/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes: {
      light: {
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#8c9eff',
          error: '#b71c1c',
          background: '#ffffff',
          surface: '#f5f5f5',
        },
      },
      dark: {
        colors: {
          primary: '#bb86fc',
          secondary: '#03dac6',
          accent: '#f8bd00',
          error: '#cf6679',
          background: '#121212',
          surface: '#1e1e1e',
        },
      },
    },
  },
})
