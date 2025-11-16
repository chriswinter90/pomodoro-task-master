// Utilities
import { defineStore } from 'pinia'
import { v7 as uuid } from 'uuid'

export type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  completedAt: Date | null
  createdAt: Date
}

export type CreateTaskPayload = Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>

function reviveTaskDates(raw: any): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    completed: Boolean(raw.completed),
    completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  }
}

function getTasksFromLocalStorage() {
  const lsTasks = localStorage.getItem('taskMasterTasks')
  const defaultTask: Task = {
    id: uuid(),
    title: 'Do the thing',
    description: 'This is a task description',
    completed: false,
    completedAt: null,
    createdAt: new Date(),
  }
  if (!lsTasks) return [defaultTask]
  try {
    const parsed = JSON.parse(lsTasks) as any[]
    const tasks = Array.isArray(parsed) ? parsed.map(reviveTaskDates) : []
    return tasks.length > 0 ? tasks : [defaultTask]
  } catch {
    return [defaultTask]
  }
}

function saveTasksToLocalStorage(tasks: Task[]) {
  // Dates are serialized to ISO strings by JSON.stringify
  localStorage.setItem('taskMasterTasks', JSON.stringify(tasks))
}

const initTasks = getTasksFromLocalStorage()

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: initTasks as Task[],
  }),
  actions: {
    addTask(task: CreateTaskPayload) {
      this.tasks.push({
        ...task,
        id: uuid(),
        createdAt: new Date(),
        completed: false,
        completedAt: null,
      })
      saveTasksToLocalStorage(this.tasks)
    },
    removeTask(id: string) {
      this.tasks = this.tasks.filter(task => task.id !== id)
      saveTasksToLocalStorage(this.tasks)
    },
    editTask(id: string, task: CreateTaskPayload) {
      const taskIndex = this.tasks.findIndex(task => task.id === id)
      if (taskIndex !== -1) {
        this.tasks[taskIndex]!.title = task.title
        this.tasks[taskIndex]!.description = task.description
      }
      saveTasksToLocalStorage(this.tasks)
    },
    setCompletedAt(id: string, value: boolean) {
      const task = this.tasks.find(task => task.id === id)
      if (task) {
        value ? task.completedAt = new Date() : task.completedAt = null
      }
      saveTasksToLocalStorage(this.tasks)
    },
  },
})
