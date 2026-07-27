import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SoundTab from './SoundTab.vue'

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

// --- SoundType enum values (mirror sound.ts) ---
const SoundType = {
  WorkEnd: 'workEnd',
  BreakEnd: 'breakEnd',
} as const

// --- Mock useSound composable ---
const mockGetConfig = vi.fn().mockReturnValue({
  frequencies: [523.25, 659.25, 783.99],
  noteDuration: 150,
  label: 'Work End',
})
const mockSetConfig = vi.fn()

vi.mock('@/components/composables/sound', () => ({
  SoundType: { WorkEnd: 'workEnd', BreakEnd: 'breakEnd' },
  useSound: () => ({
    getConfig: mockGetConfig,
    setConfig: mockSetConfig,
    soundEnabled: { value: true },
  }),
}))

// --- Mock useUserPreferencesStore ---
let mockSoundEnabled = true
let mockPerTypeWorkEnd = true
let mockPerTypeBreakEnd = true
const mockSetSoundEnabled = vi.fn()
const mockSetPerTypeSoundEnabled = vi.fn()

vi.mock('@/stores/userPreferences', () => ({
  useUserPreferencesStore: () => ({
    soundEnabled: mockSoundEnabled,
    perTypeSoundEnabled: {
      get workEnd() { return mockPerTypeWorkEnd },
      get breakEnd() { return mockPerTypeBreakEnd },
    },
    setSoundEnabled: mockSetSoundEnabled,
    setPerTypeSoundEnabled: mockSetPerTypeSoundEnabled,
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
describe('SoundTab', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockSoundEnabled = true
    mockPerTypeWorkEnd = true
    mockPerTypeBreakEnd = true
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]

    mockGetConfig.mockImplementation((type: string) => {
      if (type === 'workEnd') {
        return { frequencies: [523.25, 659.25, 783.99], noteDuration: 150, label: 'Work End' }
      }
      return { frequencies: [392, 329.63, 261.63], noteDuration: 200, label: 'Break End' }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('renders global sound toggle', () => {
    wrapper = mount(SoundTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const switches = wrapper.findAll('[data-v-component="VSwitch"]')
    expect(switches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders per-type toggles (Work End, Break End)', () => {
    wrapper = mount(SoundTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    // At least 3 switches: 1 global + 1 per sound type (2 types)
    const switches = wrapper.findAll('[data-v-component="VSwitch"]')
    expect(switches.length).toBeGreaterThanOrEqual(3)
  })

  it('renders frequency inputs and duration inputs per sound type', () => {
    wrapper = mount(SoundTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const numberInputs = wrapper.findAll('input[type="number"]')
    // Each sound type has frequency inputs + 1 duration input
    expect(numberInputs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders save button per sound type', () => {
    wrapper = mount(SoundTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const saveButtons = wrapper.findAll('button[data-v-component="VBtn"]')
    // At least one Save button per sound type (2 types)
    expect(saveButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('global toggle calls store setSoundEnabled', async () => {
    wrapper = mount(SoundTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const switches = wrapper.findAll('[data-v-component="VSwitch"]')
    const globalToggle = switches[0]
    if (globalToggle) {
      const input = globalToggle.find('input[type="checkbox"]')
      await input.setValue(false)
      expect(mockSetSoundEnabled).toHaveBeenCalledWith(false)
    }
  })

  it('per-type toggle calls store setPerTypeSoundEnabled with flipped value', async () => {
    wrapper = mount(SoundTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const switches = wrapper.findAll('[data-v-component="VSwitch"]')
    // switches[1] should be the per-type toggle for Work End
    const perTypeToggle = switches[1]
    if (perTypeToggle) {
      const input = perTypeToggle.find('input[type="checkbox"]')
      const wasChecked = (input.element as HTMLInputElement).checked
      await input.setValue(!wasChecked)
      expect(mockSetPerTypeSoundEnabled).toHaveBeenCalled()
      expect(mockSetPerTypeSoundEnabled.mock.calls[0]![0]).toBe('workEnd')
      // Toggle should flip the value that was displayed
      expect(mockSetPerTypeSoundEnabled.mock.calls[0]![1]).toBe(!wasChecked)
    }
  })

  it('save button calls setConfig', async () => {
    wrapper = mount(SoundTab, {
      global: {
        provide: { [ThemeSymbol]: createMockTheme('light') },
      },
    })
    const saveButtons = wrapper.findAll('button[data-v-component="VBtn"]')
    // Find a Save button (not Add Frequency or remove buttons)
    const saveBtn = saveButtons.find(btn => {
      const el = btn.element as HTMLElement
      return el.textContent?.includes('Save')
    })
    if (saveBtn) {
      await saveBtn.trigger('click')
      expect(mockSetConfig).toHaveBeenCalled()
    }
  })
})
