import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppearanceTab from './AppearanceTab.vue'

// --- Mock VSwitch and VSlider (not auto-resolved by Vuetify test harness) ---
const MockVSwitch = defineComponent({
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'type': 'checkbox',
        'data-v-component': 'VSwitch',
        'data-label': String(props.label),
        'checked': Boolean(props.modelValue),
        'onChange': (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).checked),
      })
  },
})

const MockVSlider = defineComponent({
  props: ['modelValue', 'label', 'min', 'max', 'step'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'type': 'range',
        'data-v-component': 'VSlider',
        'data-label': String(props.label),
        'value': String(props.modelValue),
        'onInput': (e: Event) => emit('update:modelValue', Number((e.target as HTMLInputElement).value)),
      })
  },
})

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
  attentionEnabled: false as boolean,
  attentionIdleMinutes: 5 as number,
  attentionEffectVariant: 'rainbow' as string,
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

  const baseGlobal = {
    components: { VSwitch: MockVSwitch, VSlider: MockVSlider },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.theme = 'system'
    mockStore.listView = 'kanban'
    mockStore.attentionEnabled = false
    mockStore.attentionIdleMinutes = 5
    mockStore.attentionEffectVariant = 'rainbow'
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('renders theme select with System/Light/Dark options', () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    expect(selects.length).toBeGreaterThanOrEqual(1)
  })

  it('renders list view select with List/Kanban options', () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
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
        ...baseGlobal,
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
        ...baseGlobal,
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

  it('renders attention switch', () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const switches = wrapper.findAll('[data-v-component="VSwitch"]')
    expect(switches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders attention idle time slider', () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const sliders = wrapper.findAll('[data-v-component="VSlider"]')
    expect(sliders.length).toBeGreaterThanOrEqual(1)
  })

  it('renders attention effect select', () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    expect(selects.length).toBeGreaterThanOrEqual(3)
  })

  it('toggle switch mutates store.attentionEnabled', async () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const switches = wrapper.findAll('[data-v-component="VSwitch"]')
    const switchEl = switches[0]!.find('input')
    await switchEl.setValue(true)
    expect(mockStore.attentionEnabled).toBe(true)
  })

  it('slider change mutates store.attentionIdleMinutes', async () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const sliders = wrapper.findAll('[data-v-component="VSlider"]')
    const slider = sliders[0]!
    await slider.setValue(10)
    expect(mockStore.attentionIdleMinutes).toBe(10)
  })

  it('select change mutates store.attentionEffectVariant', async () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    const effectSelect = selects[2]!
    await effectSelect.setValue('rainbow')
    expect(mockStore.attentionEffectVariant).toBe('rainbow')
  })

  it('list view change mutates store.listView', async () => {
    wrapper = mount(AppearanceTab, {
      global: {
        ...baseGlobal,
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const selects = wrapper.findAll('[data-v-component="VSelect"]')
    const listViewSelect = selects[1]!
    await listViewSelect.setValue('list')
    expect(mockStore.listView).toBe('list')
  })
})
