import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TimerBlock from './TimerBlock.vue'

// --- Mock store ---
const mockSetSelectedTimer = vi.fn()

vi.mock('@/stores/timers', () => ({
  useTimersStore: () => ({
    selectedTimer: null,
    setSelectedTimer: mockSetSelectedTimer,
  }),
}))

describe('TimerBlock', () => {
  let wrapper: ReturnType<typeof mount>

  afterEach(() => {
    wrapper.unmount()
  })

  describe('delete icon', () => {
    it('shows delete icon when showDelete is true', () => {
      wrapper = mount(TimerBlock, {
        props: {
          timerId: 'timer-1',
          duration: 900,
          breakDuration: 300,
          showDelete: true,
        },
      })

      const deleteIcon = wrapper.find('button[data-test="delete-timer"]')
      expect(deleteIcon.exists()).toBe(true)
    })

    it('hides delete icon when showDelete is false', () => {
      wrapper = mount(TimerBlock, {
        props: {
          timerId: 'timer-1',
          duration: 900,
          breakDuration: 300,
          showDelete: false,
        },
      })

      const deleteIcon = wrapper.find('button[data-test="delete-timer"]')
      expect(deleteIcon.exists()).toBe(false)
    })

    it('emits delete event with timer ID on delete click', async () => {
      wrapper = mount(TimerBlock, {
        props: {
          timerId: 'timer-1',
          duration: 900,
          breakDuration: 300,
          showDelete: true,
        },
      })

      const deleteIcon = wrapper.find('button[data-test="delete-timer"]')
      await deleteIcon.trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')).toHaveLength(1)
      expect(wrapper.emitted('delete')?.[0]).toEqual(['timer-1'])
    })

    it('does not emit delete when showDelete is false', () => {
      wrapper = mount(TimerBlock, {
        props: {
          timerId: 'timer-1',
          duration: 900,
          breakDuration: 300,
          showDelete: false,
        },
      })

      expect(wrapper.emitted('delete')).toBeFalsy()
    })
  })

  describe('click-to-select', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('calls setSelectedTimer on block click', async () => {
      wrapper = mount(TimerBlock, {
        props: {
          timerId: 'timer-1',
          duration: 900,
          breakDuration: 300,
        },
      })

      await wrapper.trigger('click')
      expect(mockSetSelectedTimer).toHaveBeenCalledWith('timer-1')
    })

    it('delete click does not bubble to select', async () => {
      wrapper = mount(TimerBlock, {
        props: {
          timerId: 'timer-1',
          duration: 900,
          breakDuration: 300,
          showDelete: true,
        },
      })

      const deleteIcon = wrapper.find('button[data-test="delete-timer"]')
      await deleteIcon.trigger('click')

      // Delete should emit but should NOT call setSelectedTimer
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(mockSetSelectedTimer).not.toHaveBeenCalled()
    })
  })
})
