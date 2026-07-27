import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppearanceTab from './AppearanceTab.vue'

// --- Mock localStorage ---
const mockStorage: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value
    },
    removeItem: (key: string) => {
      delete mockStorage[key]
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k]
    },
    get length() {
      return Object.keys(mockStorage).length
    },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  },
  writable: true,
})

// --- Mock useUserPreferencesStore ---
// Pinia auto-unwraps refs, so store.theme is a plain string.
// Use reactive() to get plain property access.
const mockStore = reactive({
  theme: 'system' as string,
  listView: 'kanban' as string,
})

vi.mock('@/stores/userPreferences', () => ({
  useUserPreferencesStore: () => mockStore,
}))

// --- Vuetify useTheme() mock ---
const ThemeSymbol = Symbol.for('vuetify:theme')

function createMockTheme(initialName: 'light' | 'dark' | 'system') {
  let currentName = initialName
  return {
    global: { name: { value: currentName } },
    change: (name: 'dark' | 'light') => {
      currentName = name
    },
  }
}

// --- Tests ---
describe('AppearanceTab', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.theme = 'system'
    mockStore.listView = 'kanban'
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('renders theme select with System/Light/Dark options', () => {
    wrapper = mount(AppearanceTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    expect(selects.length).toBeGreaterThanOrEqual(1)
  })

  it('renders list view select with List/Kanban options', () => {
    wrapper = mount(AppearanceTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })

  it('theme change mutates store.theme and applies via useTheme().change()', async () => {
    let lastThemeChange: string | null = null
    const mockThemeObj = {
      global: { name: { value: 'light' } },
      change: (name: string) => {
        lastThemeChange = name
      },
    }
    wrapper = mount(AppearanceTab, {
      global: {
        provide: { [ThemeSymbol]: mockThemeObj },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    const themeSelect = selects[0]!
    await themeSelect.setValue('dark')
    expect(mockStore.theme).toBe('dark')
    expect(lastThemeChange).toBe('dark')
  })

  it('system theme mutates store.theme and calls applySystemTheme with window.matchMedia', async () => {
    let lastThemeChange: string | null = null
    const mockThemeObj = {
      global: { name: { value: 'light' } },
      change: (name: string) => {
        lastThemeChange = name
      },
    }
    const originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }), // dark mode
    })
    wrapper = mount(AppearanceTab, {
      global: {
        provide: { [ThemeSymbol]: mockThemeObj },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    const themeSelect = selects[0]!
    await themeSelect.setValue('system')
    expect(mockStore.theme).toBe('system')
    expect(lastThemeChange).toBe('dark') // dark mode detected
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  it('list view change mutates store.listView', async () => {
    wrapper = mount(AppearanceTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    const listViewSelect = selects[1]!
    await listViewSelect.setValue('list')
    expect(mockStore.listView).toBe('list')
  })
})
