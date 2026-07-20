// Utilities
import { defineStore } from 'pinia'
import { v7 as uuid } from 'uuid'

import { loadFromLocalStorage, saveToLocalStorage } from './persist'

/**
 * Represents a user task with completion tracking.
 */
export type Task = {
  /** Unique identifier (UUID v7) */
  id: string
  /** Task title */
  title: string
  /** Task description */
  description: string
  /** Whether the task is marked as completed */
  completed: boolean
  /** Timestamp when the task was completed, or null if not completed */
  completedAt: Date | null
  /** Timestamp when the task was created */
  createdAt: Date
}

/**
 * Payload for creating a new task (omits auto-generated fields).
 */
export type CreateTaskPayload = Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>

function defaultTask(): Task {
  return {
    id: uuid(),
    title: 'Do the thing',
    description: 'This is a task description',
    completed: false,
    completedAt: null,
    createdAt: new Date(),
  }
}

function reviveTaskDates(raw: unknown): Task {
  const obj = raw as Record<string, unknown>
  if (typeof obj.id !== 'string' || typeof obj.title !== 'string') {
    return defaultTask()
  }
  return {
    id: obj.id,
    title: obj.title,
    description: typeof obj.description === 'string' ? obj.description : '',
    completed: Boolean(obj.completed),
    completedAt: obj.completedAt ? new Date(obj.completedAt as string) : null,
    createdAt: obj.createdAt ? new Date(obj.createdAt as string) : new Date(),
  }
}

function reviveTaskArray(raw: unknown): Task[] {
  const arr = raw as unknown[]
  if (!Array.isArray(arr)) return [defaultTask()]
  const tasks = arr.map(reviveTaskDates)
  return tasks.length > 0 ? tasks : [defaultTask()]
}

const initTasks = loadFromLocalStorage('taskMasterTasks', () => [defaultTask()], reviveTaskArray)

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [...initTasks],
  }),
  actions: {
    /**
     * Add a new task to the store.
     * @param task - Task creation payload (title and description)
     */
    addTask(task: CreateTaskPayload) {
      this.tasks.push({
        ...task,
        id: uuid(),
        createdAt: new Date(),
        completed: false,
        completedAt: null,
      })
      saveToLocalStorage('taskMasterTasks', this.tasks)
    },

    /**
     * Remove a task by its ID.
     * @param id - The task's unique identifier
     * @throws Error if no task with the given ID exists
     */
    removeTask(id: string) {
      const taskIndex = this.tasks.findIndex(t => t.id === id)
      if (taskIndex === -1) {
        throw new Error(`Task not found: ${id}`)
      }
      this.tasks.splice(taskIndex, 1)
      saveToLocalStorage('taskMasterTasks', this.tasks)
    },

    /**
     * Edit a task's title and description.
     * @param id - The task's unique identifier
     * @param task - New title and description values
     * @throws Error if no task with the given ID exists
     */
    editTask(id: string, task: CreateTaskPayload) {
      const taskIndex = this.tasks.findIndex(t => t.id === id)
      if (taskIndex === -1) {
        throw new Error(`Task not found: ${id}`)
      }
      this.tasks[taskIndex]!.title = task.title
      this.tasks[taskIndex]!.description = task.description
      saveToLocalStorage('taskMasterTasks', this.tasks)
    },

    /**
     * Mark a task as completed or uncompleted.
     * Sets both the `completed` flag and `completedAt` timestamp.
     * @param id - The task's unique identifier
     * @param value - `true` to mark complete, `false` to mark incomplete
     * @throws Error if no task with the given ID exists
     */
    setCompletedAt(id: string, value: boolean) {
      const task = this.tasks.find(t => t.id === id)
      if (!task) {
        throw new Error(`Task not found: ${id}`)
      }
      task.completed = value
      task.completedAt = value ? new Date() : null
      saveToLocalStorage('taskMasterTasks', this.tasks)
    },
  },
})
