import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TimerPanel from './TimerPanel.vue'

// --- Mock stores ---
const mockRemoveTimer = vi.fn()
const mockSetSelectedTimer = vi.fn()

const mockTimersRef = {
  value: [
    { id: 'timer-1', duration: 900, breakDuration: 300 },
    { id: 'timer-2', duration: 600, breakDuration: 120 },
  ],
}

vi.mock('@/stores/timers', () => ({
  useTimersStore: () => ({
    get timers() {
      return mockTimersRef.value
    },
    get selectedTimer() {
      return mockTimersRef.value[0]
    },
    removeTimer: mockRemoveTimer,
    setSelectedTimer: mockSetSelectedTimer,
  }),
}))

vi.mock('@/stores/timerState', () => ({
  useTimerStateStore: () => ({
    mode: 'idle',
    timerRunning: false,
  }),
}))

// --- Mock composables ---
vi.mock('@/components/composables/timerController', () => ({
  useTimerController: () => ({
    displayTimeString: '15:00',
    countdownRemaining: 0,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    skipBreak: vi.fn(),
    snooze: vi.fn(),
    dispose: vi.fn(),
  }),
}))

vi.mock('@/components/composables/sound', () => ({
  useSound: () => ({
    soundEnabled: { value: true },
  }),
}))

// --- Stub child components ---
const TimerBlockStub = {
  name: 'TimerBlock',
  template: '<div class="timer-block-stub"><span>{{ timerId }}</span></div>',
  props: ['timerId', 'duration', 'breakDuration', 'showDelete'],
  emits: ['delete'],
}

describe('TimerPanel', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.clearAllMocks()
    mockTimersRef.value = [
      { id: 'timer-1', duration: 900, breakDuration: 300 },
      { id: 'timer-2', duration: 600, breakDuration: 120 },
    ]
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('passes showDelete=true to TimerBlocks when more than one timer exists', () => {
    wrapper = mount(TimerPanel, {
      global: {
        stubs: {
          TimerBlock: TimerBlockStub,
          TimerControls: true,
          TimerDisplay: true,
          AddTimerPanel: true,
          SnoozePanel: true,
        },
      },
    })

    const blocks = wrapper.findAllComponents({ name: 'TimerBlock' })
    // All blocks should have showDelete=true since there are 2 timers
    for (const block of blocks) {
      expect(block.props('showDelete')).toBe(true)
    }
  })

  it('passes showDelete=false to TimerBlocks when only one timer exists', () => {
    // Temporarily shrink the mock timer list
    const original = [...mockTimersRef.value]
    mockTimersRef.value = [{ id: 'timer-1', duration: 900, breakDuration: 300 }]

    wrapper = mount(TimerPanel, {
      global: {
        stubs: {
          TimerBlock: TimerBlockStub,
          TimerControls: true,
          TimerDisplay: true,
          AddTimerPanel: true,
          SnoozePanel: true,
        },
      },
    })

    const blocks = wrapper.findAllComponents({ name: 'TimerBlock' })
    for (const block of blocks) {
      expect(block.props('showDelete')).toBe(false)
    }

    // Restore
    mockTimersRef.value = original
  })

  it('opens delete dialog when a TimerBlock emits delete', async () => {
    wrapper = mount(TimerPanel, {
      global: {
        stubs: {
          TimerBlock: TimerBlockStub,
          TimerControls: true,
          TimerDisplay: true,
          AddTimerPanel: true,
          SnoozePanel: true,
        },
      },
    })

    // Simulate a TimerBlock emitting delete
    const blocks = wrapper.findAllComponents({ name: 'TimerBlock' })
    blocks[0]!.vm.$emit('delete', 'timer-1')
    await wrapper.vm.$nextTick()

    // Dialog should be open (showDeleteDialog is true)
    expect((wrapper.vm as any).showDeleteDialog).toBe(true)
  })

  it('calls removeTimer on confirm', async () => {
    wrapper = mount(TimerPanel, {
      global: {
        stubs: {
          TimerBlock: TimerBlockStub,
          TimerControls: true,
          TimerDisplay: true,
          AddTimerPanel: true,
          SnoozePanel: true,
        },
      },
    })

    // Trigger delete from first block
    const blocks = wrapper.findAllComponents({ name: 'TimerBlock' })
    blocks[0]!.vm.$emit('delete', 'timer-1')
    await wrapper.vm.$nextTick()

    // Click confirm button
    const confirmBtn = wrapper.find('button[data-test="confirm-delete"]')
    await confirmBtn.trigger('click')

    expect(mockRemoveTimer).toHaveBeenCalledWith('timer-1')
  })

  it('calls removeTimer with correct ID when deleting the selected timer', async () => {
    // Set up: second timer is selected
    mockTimersRef.value = [
      { id: 'timer-1', duration: 900, breakDuration: 300 },
      { id: 'timer-2', duration: 600, breakDuration: 120 },
    ]

    wrapper = mount(TimerPanel, {
      global: {
        stubs: {
          TimerBlock: TimerBlockStub,
          TimerControls: true,
          TimerDisplay: true,
          AddTimerPanel: true,
          SnoozePanel: true,
        },
      },
    })

    // Trigger delete from second block (the selected one)
    const blocks = wrapper.findAllComponents({ name: 'TimerBlock' })
    blocks[1]!.vm.$emit('delete', 'timer-2')
    await wrapper.vm.$nextTick()

    // Click confirm button
    const confirmBtn = wrapper.find('button[data-test="confirm-delete"]')
    await confirmBtn.trigger('click')

    expect(mockRemoveTimer).toHaveBeenCalledWith('timer-2')
  })

  it('closes dialog without calling removeTimer on cancel', async () => {
    wrapper = mount(TimerPanel, {
      global: {
        stubs: {
          TimerBlock: TimerBlockStub,
          TimerControls: true,
          TimerDisplay: true,
          AddTimerPanel: true,
          SnoozePanel: true,
        },
      },
    })

    // Trigger delete from first block
    const blocks = wrapper.findAllComponents({ name: 'TimerBlock' })
    blocks[0]!.vm.$emit('delete', 'timer-1')
    await wrapper.vm.$nextTick()

    // Click cancel button
    const cancelBtn = wrapper.find('button[data-test="cancel-delete"]')
    await cancelBtn.trigger('click')

    expect(mockRemoveTimer).not.toHaveBeenCalled()

    // Dialog should be closed (showDeleteDialog is false)
    expect((wrapper.vm as any).showDeleteDialog).toBe(false)
  })
})
