import { describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils'

import BackgroundEffects from './BackgroundEffects.vue'
import InactivityEffectController from './InactivityEffectController.vue'

import { useUserPreferencesStore } from '@/stores/userPreferences'
import { useInactivityStore } from '@/stores/inactivity'

vi.mock('@/stores/userPreferences', () => ({
  useUserPreferencesStore: vi.fn(),
}))

vi.mock('@/stores/inactivity', () => ({
  useInactivityStore: vi.fn(),
}))

describe('InactivityEffectController', () => {
  it('does not render BackgroundEffects when attentionEnabled is false', () => {
    vi.mocked(useUserPreferencesStore).mockReturnValue({
      attentionEnabled: false,
      attentionEffectVariant: 'rainbow',
    } as ReturnType<typeof useUserPreferencesStore>)
    vi.mocked(useInactivityStore).mockReturnValue({
      isActive: true,
    } as ReturnType<typeof useInactivityStore>)

    const wrapper = mount(InactivityEffectController)
    expect(wrapper.findComponent(BackgroundEffects).exists()).toBe(false)
  })

  it('does not render BackgroundEffects when isActive is false', () => {
    vi.mocked(useUserPreferencesStore).mockReturnValue({
      attentionEnabled: true,
      attentionEffectVariant: 'rainbow',
    } as ReturnType<typeof useUserPreferencesStore>)
    vi.mocked(useInactivityStore).mockReturnValue({
      isActive: false,
    } as ReturnType<typeof useInactivityStore>)

    const wrapper = mount(InactivityEffectController)
    expect(wrapper.findComponent(BackgroundEffects).exists()).toBe(false)
  })

  it('renders BackgroundEffects with correct variant when active', () => {
    vi.mocked(useUserPreferencesStore).mockReturnValue({
      attentionEnabled: true,
      attentionEffectVariant: 'rainbow',
    } as ReturnType<typeof useUserPreferencesStore>)
    vi.mocked(useInactivityStore).mockReturnValue({
      isActive: true,
    } as ReturnType<typeof useInactivityStore>)

    const wrapper = mount(InactivityEffectController)
    const bgEffects = wrapper.findComponent(BackgroundEffects)
    expect(bgEffects.exists()).toBe(true)
    expect(bgEffects.props('variant')).toBe('rainbow')
  })
})
