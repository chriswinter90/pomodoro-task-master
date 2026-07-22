import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AddTaskPanel from './AddTaskPanel.vue'

// --- Mock task store ---
const mockAddTask = vi.fn()

vi.mock('@/stores/tasks', () => ({
  useTaskStore: () => ({
    tasks: [],
    addTask: mockAddTask,
    removeTask: vi.fn(),
    setCompletedAt: vi.fn(),
  }),
}))

describe('AddTaskPanel', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(AddTaskPanel, {
      props: {
        modelValue: true,
      },
      global: {
        stubs: {
          transition: false,
        },
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('rejects empty title submission — addTask not called (F2)', async () => {
    // Find the form and trigger submit with empty title
    const form = wrapper.find('form')
    expect(form.exists()).toBe(true)
    await form.trigger('submit')

    expect(mockAddTask).not.toHaveBeenCalled()
  })

  it('calls taskStore.addTask and closes panel on non-empty title (F2)', async () => {
    // Find the title input and set a value
    const inputs = wrapper.findAll('input[type="text"]')
    const titleInput = inputs[0]!
    await titleInput.setValue('Test Task')

    // Find the submit button and click it
    const button = wrapper.find('button')
    await button.trigger('click')

    expect(mockAddTask).toHaveBeenCalledTimes(1)
    expect(mockAddTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test Task' }),
    )

    // Panel should close (modelValue set to false)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('resets valid to false after submission (F5)', async () => {
    // Simulate form validation passing: set valid to true
    (wrapper.vm as unknown as { valid: boolean }).valid = true

    // Set a valid title
    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Test Task')

    // Submit
    const button = wrapper.find('button')
    await button.trigger('click')

    // After submission, valid should be reset to false
    expect((wrapper.vm as unknown as { valid: boolean }).valid).toBe(false)
  })


})
