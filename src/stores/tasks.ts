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

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [{
      id: 'abcdefg1234567890',
      title: 'Do the thing',
      description: 'This is a task description',
      completed: false,
      completedAt: null,
    }] as Task[],
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
    },
    removeTask(id: string) {
      this.tasks = this.tasks.filter(task => task.id !== id)
    },
    setCompletedAt(id: string, value: boolean) {
      const task = this.tasks.find(task => task.id === id)
      if (task) {
        value ? task.completedAt = new Date() : task.completedAt = null
      }
    },
  },
})
