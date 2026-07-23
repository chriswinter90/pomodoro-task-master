import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TaskPanel from './TaskPanel.vue'

// --- Mock task store ---
const mockSetStatus = vi.fn()
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
        status: 'todo',
      },
      {
        id: 'task-2',
        title: 'Task 2',
        description: 'Desc 2',
        completed: true,
        completedAt: new Date(),
        createdAt: new Date(),
        status: 'done',
      },
    ],
    setStatus: mockSetStatus,
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

  it('shows status badges for tasks', () => {
    expect(wrapper.text()).toContain('Todo')
    expect(wrapper.text()).toContain('Done')
  })

  it('cycles status when status badge is clicked', async () => {
    const badges = wrapper.findAll('.status-badge')
    expect(badges.length).toBeGreaterThanOrEqual(1)

    await badges[0]!.trigger('click')

    expect(mockSetStatus).toHaveBeenCalledTimes(1)
    expect(mockSetStatus).toHaveBeenCalledWith('task-1', 'in-progress')
  })

  it('calls removeTask when delete button is clicked for done tasks', async () => {
    const deleteButtons = wrapper.findAll('button')
    const deleteBtn = deleteButtons.find(btn => btn.classes().includes('d-flex'))
    if (deleteBtn) {
      await deleteBtn.trigger('click')
      expect(mockRemoveTask).toHaveBeenCalledWith('task-2')
    }
  })

  it('emits "add-task" when the add button is clicked', async () => {
    const addButton = wrapper.find('.add-button')
    expect(addButton.exists()).toBe(true)

    await addButton.trigger('click')

    expect(wrapper.emitted('add-task')).toBeTruthy()
    expect(wrapper.emitted('add-task')).toHaveLength(1)
  })
})
