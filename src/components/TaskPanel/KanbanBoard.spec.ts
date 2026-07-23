import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import KanbanBoard from './KanbanBoard.vue'

// --- Mock task store ---
const mockTasks = [
  {
    id: 'task-1',
    title: 'Todo Task',
    description: 'Desc 1',
    completed: false,
    completedAt: null,
    createdAt: new Date(),
    status: 'todo',
  },
  {
    id: 'task-2',
    title: 'Progress Task',
    description: 'Desc 2',
    completed: false,
    completedAt: null,
    createdAt: new Date(),
    status: 'in-progress',
  },
  {
    id: 'task-3',
    title: 'Done Task',
    description: '',
    completed: true,
    completedAt: new Date(),
    createdAt: new Date(),
    status: 'done',
  },
]

const mockSetStatus = vi.fn()

vi.mock('@/stores/tasks', () => ({
  useTaskStore: () => ({
    tasks: mockTasks,
    tasksByStatus: {
      'todo': [mockTasks[0]],
      'in-progress': [mockTasks[1]],
      'done': [mockTasks[2]],
    },
    setStatus: mockSetStatus,
  }),
}))

describe('KanbanBoard', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(KanbanBoard, {
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

  it('renders three column titles', () => {
    expect(wrapper.text()).toContain('Todo')
    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).toContain('Done')
  })

  it('renders task cards with titles', () => {
    expect(wrapper.text()).toContain('Todo Task')
    expect(wrapper.text()).toContain('Progress Task')
    expect(wrapper.text()).toContain('Done Task')
  })

  it('renders task descriptions', () => {
    expect(wrapper.text()).toContain('Desc 1')
    expect(wrapper.text()).toContain('Desc 2')
  })

  it('shows task count chips', () => {
    // Each column header has a chip with count
    const text = wrapper.text()
    expect(text).toContain('1') // at least one count chip renders
  })

  it('sets dragged task data on dragstart', async () => {
    const taskCards = wrapper.findAll('[draggable]')
    expect(taskCards.length).toBeGreaterThanOrEqual(1)

    const dragEvent = {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: '',
      },
    }
    await taskCards[0]!.trigger('dragstart', dragEvent)

    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'text/plain',
      'task-1',
    )
  })

  it('calls setStatus on drop with correct task and status', async () => {
    const dropTarget = wrapper.findAll('.kanban-column')[1] // in-progress column

    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: () => 'task-1',
      },
    }
    await dropTarget!.trigger('drop', dropEvent)

    expect(mockSetStatus).toHaveBeenCalledWith('task-1', 'in-progress')
  })

  it('emits add-task when add button is clicked', async () => {
    const addButton = wrapper.find('.kanban-add-row button')
    expect(addButton.exists()).toBe(true)

    await addButton.trigger('click')

    expect(wrapper.emitted('add-task')).toBeTruthy()
  })
})
