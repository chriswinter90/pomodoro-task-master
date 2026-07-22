/**
 * Load serialized data from localStorage with fallback and optional reviver.
 * @param key - localStorage key
 * @param defaultFactory - Factory function returning default value when key is missing or data is corrupt
 * @param reviver - Optional function to transform parsed raw data into typed result
 * @returns Deserialized data, revived data, or default
 */
export function loadFromLocalStorage<T>(
  key: string,
  defaultFactory: () => T,
  reviver?: (raw: unknown) => T,
): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultFactory()
    const parsed = JSON.parse(raw)
    if (reviver) return reviver(parsed)
    return parsed as T
  } catch {
    return defaultFactory()
  }
}

/**
 * Save data to localStorage as JSON.
 * @param key - localStorage key
 * @param data - Data to serialize
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Silently ignore quota exceeded / private-browsing failures
  }
}
