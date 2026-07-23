import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeToggle from './ThemeToggle.vue'

// --- Mock useUserPreference with mutable state ---
let mockSavedTheme = 'light'
const mockSetValue = vi.fn()

vi.mock('@/composables/useUserPreference', () => ({
  useUserPreference: () => ({
    value: { value: mockSavedTheme },
    setValue: mockSetValue,
  }),
}))

// Vuetify's useTheme() injects via Symbol.for('vuetify:theme')
const ThemeSymbol = Symbol.for('vuetify:theme')

function createMockTheme(initialName: 'light' | 'dark') {
  let currentName = initialName
  return {
    global: { name: { value: currentName } },
    change: (name: 'dark' | 'light') => { currentName = name },
  }
}

describe('ThemeToggle', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockSavedTheme = 'light'
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('renders a v-switch input', () => {
    wrapper = mount(ThemeToggle, {
      global: {
        provide: {
          [ThemeSymbol]: createMockTheme('light'),
        },
      },
    })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.exists()).toBe(true)
  })

  it('reflects dark theme as checked', () => {
    wrapper = mount(ThemeToggle, {
      global: {
        provide: {
          [ThemeSymbol]: createMockTheme('dark'),
        },
      },
    })
    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })

  it('reflects light theme as unchecked', () => {
    wrapper = mount(ThemeToggle, {
      global: {
        provide: {
          [ThemeSymbol]: createMockTheme('light'),
        },
      },
    })
    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('calls setValue and switches theme on toggle', async () => {
    const mockTheme = createMockTheme('light')
    wrapper = mount(ThemeToggle, {
      global: {
        provide: {
          [ThemeSymbol]: mockTheme,
        },
      },
    })

    const input = wrapper.find('input[type="checkbox"]')
    await input.setValue(true)

    expect(mockSetValue).toHaveBeenCalledWith('dark')
  })

  it('switches back to light on second toggle', async () => {
    const mockTheme = createMockTheme('dark')
    wrapper = mount(ThemeToggle, {
      global: {
        provide: {
          [ThemeSymbol]: mockTheme,
        },
      },
    })

    const input = wrapper.find('input[type="checkbox"]')
    await input.setValue(false)

    expect(mockSetValue).toHaveBeenCalledWith('light')
  })
})
