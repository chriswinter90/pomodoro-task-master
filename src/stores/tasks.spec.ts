import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreateTaskPayload } from './tasks'
import './test-setup'

// Mock uuid to produce predictable but unique IDs
let uuidCounter = 0
vi.mock('uuid', () => ({
  v7: () => `mock-uuid-${++uuidCounter}`,
}))

// Mock persist module — loadFromLocalStorage returns empty array
// so tests start clean; saveToLocalStorage is a spy
vi.mock('./persist', () => ({
  loadFromLocalStorage: vi.fn(() => []),
  saveToLocalStorage: vi.fn(),
}))

// Re-import after mocking
const { useTaskStore } = await import('./tasks')
const { saveToLocalStorage } = await import('./persist')

describe('useTaskStore', () => {
  let store: ReturnType<typeof useTaskStore>

  beforeEach(() => {
    vi.clearAllMocks()
    const pinia = createPinia()
    store = useTaskStore(pinia)
  })

  describe('addTask', () => {
    it('creates a task with auto-generated id, createdAt, and default status', () => {
      const payload: CreateTaskPayload = { title: 'Test task', description: 'Test desc' }
      store.addTask(payload)
      expect(store.tasks).toHaveLength(1)
      const newTask = store.tasks[0]!
      expect(newTask.id).toBe('mock-uuid-1')
      expect(newTask.title).toBe('Test task')
      expect(newTask.completed).toBe(false)
      expect(newTask.completedAt).toBeNull()
      expect(newTask.createdAt).toBeInstanceOf(Date)
      expect(newTask.status).toBe('todo')
    })

    it('persists to localStorage', () => {
      store.addTask({ title: 'Test', description: 'Desc' })
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTasks', expect.any(Array))
    })
  })

  describe('removeTask', () => {
    it('filters out task by id', () => {
      store.addTask({ title: 'A', description: 'A' })
      const taskId = store.tasks[0]!.id
      store.removeTask(taskId)
      expect(store.tasks).toHaveLength(0)
    })

    it('persists to localStorage', () => {
      store.addTask({ title: 'A', description: 'A' })
      store.removeTask(store.tasks[0]!.id)
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTasks', expect.any(Array))
    })

    it('throws when task not found', () => {
      expect(() => store.removeTask('nonexistent'))
        .toThrow('Task not found: nonexistent')
    })
  })

  describe('editTask', () => {
    it('updates title and description', () => {
      store.addTask({ title: 'Original', description: 'Orig desc' })
      const task = store.tasks[0]!
      store.editTask(task.id, { title: 'Updated', description: 'New desc' })
      const updated = store.tasks.find(t => t.id === task.id)
      expect(updated?.title).toBe('Updated')
      expect(updated?.description).toBe('New desc')
    })

    it('throws when task not found', () => {
      expect(() => store.editTask('nonexistent', { title: 'X', description: 'Y' }))
        .toThrow('Task not found: nonexistent')
    })
  })

  describe('setCompletedAt', () => {
    it('sets completedAt and completed flag when value is true', () => {
      store.addTask({ title: 'A', description: 'A' })
      const task = store.tasks[0]!
      store.setCompletedAt(task.id, true)
      expect(task.completed).toBe(true)
      expect(task.completedAt).toBeInstanceOf(Date)
    })

    it('clears completedAt and completed flag when value is false', () => {
      store.addTask({ title: 'A', description: 'A' })
      const task = store.tasks[0]!
      store.setCompletedAt(task.id, true)
      store.setCompletedAt(task.id, false)
      expect(task.completed).toBe(false)
      expect(task.completedAt).toBeNull()
    })

    it('persists to localStorage', () => {
      store.addTask({ title: 'A', description: 'A' })
      store.setCompletedAt(store.tasks[0]!.id, true)
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTasks', expect.any(Array))
    })

    it('throws when task not found', () => {
      expect(() => store.setCompletedAt('nonexistent', true))
        .toThrow('Task not found: nonexistent')
    })
  })

  describe('setStatus', () => {
    it('updates task status', () => {
      store.addTask({ title: 'A', description: 'A' })
      const task = store.tasks[0]!
      store.setStatus(task.id, 'in-progress')
      expect(task.status).toBe('in-progress')
    })

    it('sets completedAt and completed flag when status becomes done', () => {
      store.addTask({ title: 'A', description: 'A' })
      const task = store.tasks[0]!
      store.setStatus(task.id, 'done')
      expect(task.status).toBe('done')
      expect(task.completed).toBe(true)
      expect(task.completedAt).toBeInstanceOf(Date)
    })

    it('clears completedAt and completed flag when status leaves done', () => {
      store.addTask({ title: 'A', description: 'A' })
      const task = store.tasks[0]!
      store.setStatus(task.id, 'done')
      store.setStatus(task.id, 'todo')
      expect(task.status).toBe('todo')
      expect(task.completed).toBe(false)
      expect(task.completedAt).toBeNull()
    })

    it('persists to localStorage', () => {
      store.addTask({ title: 'A', description: 'A' })
      store.setStatus(store.tasks[0]!.id, 'in-progress')
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTasks', expect.any(Array))
    })

    it('throws when task not found', () => {
      expect(() => store.setStatus('nonexistent', 'done'))
        .toThrow('Task not found: nonexistent')
    })
  })

  describe('tasksByStatus', () => {
    it('groups tasks by status', () => {
      store.addTask({ title: 'A', description: 'A' })
      store.addTask({ title: 'B', description: 'B' })
      store.addTask({ title: 'C', description: 'C' })
      const [aId, bId, cId] = [store.tasks[0]!.id, store.tasks[1]!.id, store.tasks[2]!.id]
      store.setStatus(aId, 'todo')
      store.setStatus(bId, 'in-progress')
      store.setStatus(cId, 'done')

      const groups = store.tasksByStatus
      expect(groups.todo).toHaveLength(1)
      expect(groups['in-progress']).toHaveLength(1)
      expect(groups.done).toHaveLength(1)
      expect(groups.todo[0]!.title).toBe('A')
      expect(groups['in-progress'][0]!.title).toBe('B')
      expect(groups.done[0]!.title).toBe('C')
    })
  })

  describe('migration', () => {
    async function getReviveTaskDates() {
      // Import unmocked module to test reviveTaskDates directly
      const mod = await import('./tasks')
      return mod.reviveTaskDates
    }

    it('assigns todo status to old tasks without status field', async () => {
      const reviveTaskDates = await getReviveTaskDates()
      const oldTask = {
        id: 'old-id',
        title: 'Old Task',
        description: 'Old desc',
        completed: false,
        completedAt: null,
        createdAt: new Date(),
      }
      const revived = reviveTaskDates(oldTask)
      expect(revived.status).toBe('todo')
    })

    it('assigns done status when old completed is true', async () => {
      const reviveTaskDates = await getReviveTaskDates()
      const oldTask = {
        id: 'old-id',
        title: 'Old Task',
        description: 'Old desc',
        completed: true,
        completedAt: new Date(),
        createdAt: new Date(),
      }
      const revived = reviveTaskDates(oldTask)
      expect(revived.status).toBe('done')
    })
  })
})
