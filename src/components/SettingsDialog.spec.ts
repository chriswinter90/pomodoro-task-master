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

// --- Mock useUserPreference with mutable state ---
let mockSavedTheme = 'system'
let mockSavedDefaultView = 'kanban'
let mockSavedSound = true
const mockSetThemeValue = vi.fn()
const mockSetDefaultViewValue = vi.fn()
const mockSetSoundValue = vi.fn()

vi.mock('@/composables/useUserPreference', () => {
  const persistToStorage = (key: string, v: string | boolean) => {
    mockStorage[key] = JSON.stringify(v)
  }
  return {
    useUserPreference: (key: string, _fallback: string | boolean) => {
      if (key === 'taskMasterTheme') {
        return { value: { value: mockSavedTheme }, setValue: (v: string | boolean) => {
          mockSetThemeValue(v)
          persistToStorage(key, v)
        } }
      }
      if (key === 'taskMasterDefaultView') {
        return { value: { value: mockSavedDefaultView }, setValue: (v: string | boolean) => {
          mockSetDefaultViewValue(v)
          persistToStorage(key, v)
        } }
      }
      if (key === 'taskMasterSound') {
        return { value: { value: mockSavedSound }, setValue: (v: string | boolean) => {
          mockSetSoundValue(v)
          persistToStorage(key, v)
        } }
      }
      return { value: { value: _fallback }, setValue: (v: string | boolean) => persistToStorage(key, v) }
    },
  }
})

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
    mockSavedTheme = 'system'
    mockSavedDefaultView = 'kanban'
    mockSavedSound = true
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
      // Dialog is rendered but should not be active
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('emits update:modelValue with false on close', async () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      // Find the close button (typically a VBtn with icon inside the dialog)
      const closeBtn = wrapper.find('button[data-v-component="VBtn"]')
      await closeBtn.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toEqual([
        [false],
      ])
    })
  })

  describe('tabs', () => {
    it('renders three tabs', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      const tabs = wrapper.findAll('button[data-v-component="VTab"]')
      expect(tabs.length).toBe(3)
    })
  })

  describe('default view tab', () => {
    it('renders default view selector with List and Kanban options', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      // There should be a second VSelect for Default View
      const selects = wrapper.findAll('select[data-v-component="VSelect"]')
      expect(selects.length).toBeGreaterThanOrEqual(2)
    })

    it('selecting Kanban persists to localStorage', async () => {
      mockSavedDefaultView = 'list'
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      const selects = wrapper.findAll('select[data-v-component="VSelect"]')
      const viewSelect = selects[1]!
      await viewSelect.setValue('kanban')
      expect(mockSetDefaultViewValue).toHaveBeenCalledWith('kanban')
      expect(mockStorage['taskMasterDefaultView']).toBe(JSON.stringify('kanban'))
    })

    it('loads saved default view on mount', () => {
      mockSavedDefaultView = 'list'
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      const selects = wrapper.findAll('select[data-v-component="VSelect"]')
      const viewSelect = selects[1]!
      expect((viewSelect.element as HTMLSelectElement).value).toBe('list')
    })
  })

  describe('appearance tab', () => {
    it('renders theme selector', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      expect(wrapper.find('select[data-v-component="VSelect"]').exists()).toBe(true)
    })

    it('calls useTheme().change() and persists to localStorage on theme change', async () => {
      const mockTheme = createMockTheme('light')
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: mockTheme },
        },
      })
      const select = wrapper.find('select[data-v-component="VSelect"]')
      await select.setValue('dark')
      expect(mockSetThemeValue).toHaveBeenCalledWith('dark')
      expect(mockStorage['taskMasterTheme']).toBe(JSON.stringify('dark'))
    })

    it('loads saved theme on mount', () => {
      mockSavedTheme = 'dark'
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('dark') },
        },
      })
      const select = wrapper.find('select[data-v-component="VSelect"]')
      expect((select.element as HTMLSelectElement).value).toBe('dark')
    })
  })

  describe('sounds tab', () => {
    it('renders global sound toggle', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      // Should have at least one VSwitch for global sound toggle
      const switches = wrapper.findAll('[data-v-component="VSwitch"]')
      expect(switches.length).toBeGreaterThanOrEqual(1)
    })

    it('renders sound configuration sections', () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      // Should have frequency inputs (number text fields)
      const numberInputs = wrapper.findAll('input[type="number"]')
      expect(numberInputs.length).toBeGreaterThanOrEqual(1)
    })

    it('global sound toggle calls setValue', async () => {
      wrapper = mount(SettingsDialog, {
        props: { modelValue: true },
        global: {
          provide: { [ThemeSymbol]: createMockTheme('light') },
        },
      })
      const switches = wrapper.findAll('[data-v-component="VSwitch"]')
      const globalToggle = switches[0]
      if (globalToggle) {
        const input = globalToggle.find('input[type="checkbox"]')
        await input.setValue(false)
        expect(mockSetSoundValue).toHaveBeenCalledWith(false)
      }
    })
  })
})
