import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeToggle from './ThemeToggle.vue'

// --- Mock useTheme ---
const mockGlobal = { name: 'light' as 'light' | 'dark' }

vi.mock('vuetify', () => ({
  useTheme: () => ({ theme: { global: mockGlobal } }),
}))

// --- Mock useUserPreference with mutable state ---
let mockSavedTheme: string = 'light'
const mockSetValue = vi.fn()

vi.mock('@/composables/useUserPreference', () => ({
  useUserPreference: () => ({
    get value() { return mockSavedTheme },
    setValue: mockSetValue,
  }),
}))

describe('ThemeToggle', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockSavedTheme = 'light'
    mockGlobal.name = 'light'
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('renders a v-switch input', () => {
    wrapper = mount(ThemeToggle)
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.exists()).toBe(true)
  })

  it('reflects dark theme as checked', () => {
    mockSavedTheme = 'dark'
    mockGlobal.name = 'dark'
    wrapper = mount(ThemeToggle)
    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })

  it('reflects light theme as unchecked', () => {
    mockSavedTheme = 'light'
    mockGlobal.name = 'light'
    wrapper = mount(ThemeToggle)
    const input = wrapper.find('input[type="checkbox"]')
    expect((input.element as HTMLInputElement).checked).toBe(false)
  })

  it('calls setValue and switches theme on toggle', async () => {
    wrapper = mount(ThemeToggle)
    const input = wrapper.find('input[type="checkbox"]')
    await input.setValue(true)

    expect(mockSetValue).toHaveBeenCalledWith('dark')
    expect(mockGlobal.name).toBe('dark')
  })

  it('switches back to light on second toggle', async () => {
    mockSavedTheme = 'dark'
    mockGlobal.name = 'dark'
    wrapper = mount(ThemeToggle)

    const input = wrapper.find('input[type="checkbox"]')
    await input.setValue(false)

    expect(mockSetValue).toHaveBeenCalledWith('light')
    expect(mockGlobal.name).toBe('light')
  })
})
