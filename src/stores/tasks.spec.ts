import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreateTaskPayload } from './tasks'
import './test-setup'

// Mock uuid to produce predictable IDs
vi.mock('uuid', () => ({
  v7: () => 'mock-uuid-1',
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
    it('creates a task with auto-generated id and createdAt', () => {
      const payload: CreateTaskPayload = { title: 'Test task', description: 'Test desc' }
      store.addTask(payload)
      expect(store.tasks).toHaveLength(1)
      const newTask = store.tasks[0]!
      expect(newTask.id).toBe('mock-uuid-1')
      expect(newTask.title).toBe('Test task')
      expect(newTask.completed).toBe(false)
      expect(newTask.completedAt).toBeNull()
      expect(newTask.createdAt).toBeInstanceOf(Date)
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
})
