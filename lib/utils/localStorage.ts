import type { Todo } from "../api/types"

const STORAGE_KEY = "task-manager-todos"

export const localStorageUtils = {
  saveTodos: (todos: Todo[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch (error) {
      console.error("Failed to save todos to localStorage:", error)
    }
  },

  loadTodos: (): Todo[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load todos from localStorage:", error)
      return []
    }
  },

  clearTodos: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear todos from localStorage:", error)
    }
  },
}
