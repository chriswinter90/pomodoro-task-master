import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TaskPanel from './TaskPanel.vue'

// --- Mock task store ---
const mockSetCompletedAt = vi.fn()
const mockRemoveTask = vi.fn()

vi.mock('@/stores/tasks', () => ({
  useTaskStore: () => ({
    tasks: [
      {
        id: 'task-1',
        title: 'Task 1',
        description: 'Desc 1',
        completed: false,
        completedAt: null,
        createdAt: new Date(),
      },
    ],
    setCompletedAt: mockSetCompletedAt,
    removeTask: mockRemoveTask,
  }),
}))

describe('TaskPanel', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(TaskPanel, {
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

  it('calls taskStore.setCompletedAt exactly once per toggle (F3)', async () => {
    // Find the checkbox input rendered by the VCheckbox stub
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)

    // Simulate toggling the checkbox to checked
    await checkbox.setValue(true)

    // setCompletedAt should be called exactly once (not twice via v-model + @update:model-value)
    expect(mockSetCompletedAt).toHaveBeenCalledTimes(1)
    expect(mockSetCompletedAt).toHaveBeenCalledWith('task-1', true)
  })

  it('emits "add-task" when the add button is clicked (F6)', async () => {
    const addButton = wrapper.find('.add-button')
    expect(addButton.exists()).toBe(true)

    await addButton.trigger('click')

    expect(wrapper.emitted('add-task')).toBeTruthy()
    expect(wrapper.emitted('add-task')).toHaveLength(1)
  })
})
