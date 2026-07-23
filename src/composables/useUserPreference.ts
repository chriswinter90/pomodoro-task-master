import { ref } from 'vue'

/**
 * Generic localStorage-backed preference composable.
 * Returns a reactive value initialized from localStorage (or fallback if missing/corrupt).
 * Calling setValue persists the new value to localStorage.
 *
 * @param key - localStorage storage key
 * @param fallback - Default value when key is missing or data is corrupt
 * @returns Reactive ref and setValue function
 */
export function useUserPreference<T extends string>(
  key: string,
  fallback: T,
): { value: import('vue').Ref<T>; setValue: (v: T) => void } {
  const stored = localStorage.getItem(key)
  let initial: T = fallback

  try {
    const parsed = JSON.parse(stored ?? '')
    if (typeof parsed === 'string') {
      initial = parsed as T
    }
  } catch {
    // Corrupt data — use fallback
  }

  const value = ref<T>(initial)

  function setValue(v: T) {
    value.value = v
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      // Silently ignore quota exceeded / private-browsing failures
    }
  }

  return { value, setValue }
}
