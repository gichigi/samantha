// Local storage-based reading history service
// Stores reading history without requiring authentication

export interface HistoryItem {
  id: string
  title: string
  url: string
  wordCount: number
  createdAt: string
}

export class LocalHistoryService {
  private static readonly STORAGE_KEY = 'samantha_history'
  private static readonly MAX_ITEMS = 50

  // Get all history items
  static getHistory(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const history = JSON.parse(stored)
        return Array.isArray(history) ? history : []
      }
    } catch (error) {
      console.error('Error reading history from localStorage:', error)
    }
    return []
  }

  // Add a new history item
  static addItem(title: string, url: string, wordCount: number): void {
    try {
      const history = this.getHistory()
      
      // Create new item
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        title,
        url,
        wordCount,
        createdAt: new Date().toISOString()
      }
      
      // Add to beginning of array (most recent first)
      history.unshift(newItem)
      
      // Limit to MAX_ITEMS
      const trimmedHistory = history.slice(0, this.MAX_ITEMS)
      
      // Save back to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory))
      
      console.log('History item added:', newItem.title)
    } catch (error) {
      console.error('Error adding history item:', error)
    }
  }

  // Clear all history
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('History cleared')
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  // Remove a specific item
  static removeItem(id: string): void {
    try {
      const history = this.getHistory()
      const filtered = history.filter(item => item.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
      console.log('History item removed:', id)
    } catch (error) {
      console.error('Error removing history item:', error)
    }
  }
}

