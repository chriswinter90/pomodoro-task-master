import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsDialog from './SettingsDialog.vue'

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
vi.mock('@/stores/userPreferences', () => ({
  useUserPreferencesStore: () => ({
    theme: 'system',
    listView: 'kanban',
    soundEnabled: true,
    perTypeSoundEnabled: { workEnd: true, breakEnd: true },
  }),
}))

// --- Mock useSound composable ---
vi.mock('@/components/composables/sound', () => ({
  SoundType: { WorkEnd: 'workEnd', BreakEnd: 'breakEnd' },
  useSound: () => ({
    getConfig: vi.fn().mockReturnValue({
      frequencies: [523.25],
      noteDuration: 150,
      label: 'Work End',
    }),
    setConfig: vi.fn(),
    soundEnabled: { value: true },
  }),
}))

// --- Vuetify useTheme() mock ---
const ThemeSymbol = Symbol.for('vuetify:theme')

function createMockTheme(initialName: 'light' | 'dark' | 'system') {
  let currentName = initialName
  return {
    global: { name: { value: currentName } },
    change: (name: 'dark' | 'light' | 'system') => {
      currentName = name
    },
  }
}

// --- Tests ---
describe('SettingsDialog', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('dialog open/close', () => {
    it('opens when modelValue is true', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      expect(wrapper.find('[data-v-component="VDialog"]').exists()).toBe(true)
    })

    it('closes when modelValue is false', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: false },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('emits update:modelValue with false on close', async () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      const closeBtn = wrapper.find('button[data-v-component="VBtn"]')
      await closeBtn.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toEqual([
        [false],
      ])
    })
  })

  describe('tabs', () => {
    it('renders two tabs (Appearance, Sounds)', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      const tabs = wrapper.findAll('button[data-v-component="VTab"]')
      expect(tabs.length).toBe(2)
    })
  })

  describe('child components', () => {
    it('renders AppearanceTab component', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      // AppearanceTab contains VSelect elements
      expect(wrapper.findAll('select[data-v-component="VSelect"]').length).toBeGreaterThanOrEqual(1)
    })

    it('renders SoundTab component when Sounds tab is selected', async () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      // Switch to Sounds tab
      const tabs = wrapper.findAll('button[data-v-component="VTab"]')
      await tabs[1]!.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick() // v-if needs extra tick

      // SoundTab contains VSwitch elements
      expect(wrapper.findAll('[data-v-component="VSwitch"]').length).toBeGreaterThanOrEqual(1)
    })

    it('does not render SoundTab when Appearance tab is active', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      // Default tab is appearance, SoundTab should not be mounted (v-if)
      // AppearanceTab has 1 VSwitch (attention toggle); SoundTab would add more
      expect(wrapper.findAll('[data-v-component="VSwitch"]').length).toBe(1)
    })
  })
})
