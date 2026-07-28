import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BackgroundEffects from './BackgroundEffects.vue'

describe('BackgroundEffects', () => {
  it('renders container div', () => {
    const wrapper = mount(BackgroundEffects)
    expect(wrapper.element).toBeInstanceOf(HTMLDivElement)
  })

  it('applies correct CSS class for rainbow variant', () => {
    const wrapper = mount(BackgroundEffects, {
      props: { variant: 'rainbow' },
    })
    expect(wrapper.classes()).toContain('bg-effect-rainbow')
  })

  it('container has bg-effect class (pointer-events: none via CSS)', () => {
    const wrapper = mount(BackgroundEffects)
    expect(wrapper.classes()).toContain('bg-effect')
  })
})
