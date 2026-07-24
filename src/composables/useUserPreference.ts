import { ref, type Ref } from 'vue'

/**
 * localStorage-backed preference composable.
 * Returns a reactive value initialized from localStorage (or fallback if missing/corrupt).
 * Calling setValue persists the new value to localStorage.
 *
 * @param key - localStorage storage key
 * @param fallback - Default value when key is missing or data is corrupt
 * @returns Reactive ref and setValue function
 */
export function useUserPreference(
  key: string,
  fallback: string | boolean,
): { value: Ref<string | boolean>, setValue: (v: string | boolean) => void } {
  const stored = localStorage.getItem(key)
  let initial = fallback

  try {
    const parsed = JSON.parse(stored ?? '')
    if (typeof parsed === 'string' || typeof parsed === 'boolean') {
      initial = parsed
    }
  } catch {
    // Corrupt data — use fallback
  }

  const value = ref(initial)

  function setValue(v: string | boolean) {
    value.value = v
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      // Silently ignore quota exceeded / private-browsing failures
    }
  }

  return { value, setValue }
}
