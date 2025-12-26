import { useEffect, useCallback } from "react"

export interface UseKeyboardShortcutOptions {
  /**
   * The key to listen for (e.g., 'f', 's', 'Enter')
   */
  key: string

  /**
   * Function to call when the shortcut is triggered
   */
  onTrigger: () => void

  /**
   * Whether the shortcut is enabled
   * @default true
   */
  enabled?: boolean

  /**
   * Whether to require Shift key
   * @default false
   */
  requireShift?: boolean

  /**
   * Whether to require Ctrl/Cmd key
   * @default false
   */
  requireCtrl?: boolean

  /**
   * Whether to require Alt key
   * @default false
   */
  requireAlt?: boolean

  /**
   * Whether to prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean

  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean

  /**
   * Condition function to determine if shortcut should trigger
   * Useful for checking if modals are open, inputs are focused, etc.
   */
  condition?: () => boolean
}

/**
 * Hook for managing keyboard shortcuts with fine-grained control
 *
 * @example
 * ```tsx
 * // Simple shortcut
 * useKeyboardShortcut({
 *   key: 'f',
 *   onTrigger: () => setFilterOpen(true)
 * })
 *
 * // Toggle behavior with condition
 * useKeyboardShortcut({
 *   key: 's',
 *   onTrigger: () => setSortOpen(prev => !prev),
 *   condition: () => !isInputFocused
 * })
 *
 * // Shift + key combination
 * useKeyboardShortcut({
 *   key: 'f',
 *   requireShift: true,
 *   onTrigger: () => clearAllFilters()
 * })
 * ```
 */
export function useKeyboardShortcut({
  key,
  onTrigger,
  enabled = true,
  requireShift = false,
  requireCtrl = false,
  requireAlt = false,
  preventDefault = true,
  stopPropagation = false,
  condition,
}: UseKeyboardShortcutOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled
      if (!enabled) return

      // Skip if wrong key
      if (event.key.toLowerCase() !== key.toLowerCase()) return

      // Skip if modifier requirements not met
      if (requireShift && !event.shiftKey) return
      if (requireCtrl && !(event.ctrlKey || event.metaKey)) return
      if (requireAlt && !event.altKey) return

      // Skip if modifiers are present when not required
      if (!requireShift && event.shiftKey) return
      if (!requireCtrl && (event.ctrlKey || event.metaKey)) return
      if (!requireAlt && event.altKey) return

      // Skip if custom condition fails
      if (condition && !condition()) return

      // Skip if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return
      }

      // Prevent default behavior if requested
      if (preventDefault) {
        event.preventDefault()
      }

      // Stop propagation if requested
      if (stopPropagation) {
        event.stopPropagation()
      }

      // Trigger the callback
      onTrigger()
    },
    [
      key,
      onTrigger,
      enabled,
      requireShift,
      requireCtrl,
      requireAlt,
      preventDefault,
      stopPropagation,
      condition,
    ],
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Hook for managing multiple keyboard shortcuts at once
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'f', onTrigger: () => setFilterOpen(true) },
 *   { key: 's', onTrigger: () => setSortOpen(prev => !prev) },
 *   { key: 'f', requireShift: true, onTrigger: () => clearFilters() }
 * ])
 * ```
 */
export function useKeyboardShortcuts(shortcuts: UseKeyboardShortcutOptions[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check each shortcut
      for (const shortcut of shortcuts) {
        const {
          key,
          onTrigger,
          enabled = true,
          requireShift = false,
          requireCtrl = false,
          requireAlt = false,
          preventDefault = true,
          stopPropagation = false,
          condition,
        } = shortcut

        // Skip if disabled
        if (!enabled) continue

        // Skip if wrong key
        if (event.key.toLowerCase() !== key.toLowerCase()) continue

        // Skip if modifier requirements not met
        if (requireShift && !event.shiftKey) continue
        if (requireCtrl && !(event.ctrlKey || event.metaKey)) continue
        if (requireAlt && !event.altKey) continue

        // Skip if modifiers are present when not required
        if (!requireShift && event.shiftKey) continue
        if (!requireCtrl && (event.ctrlKey || event.metaKey)) continue
        if (!requireAlt && event.altKey) continue

        // Skip if custom condition fails
        if (condition && !condition()) continue

        // Skip if user is typing in an input field
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement ||
          (event.target as HTMLElement)?.isContentEditable
        ) {
          continue
        }

        // Prevent default behavior if requested
        if (preventDefault) {
          event.preventDefault()
        }

        // Stop propagation if requested
        if (stopPropagation) {
          event.stopPropagation()
        }

        // Trigger the callback and break (only one shortcut should trigger)
        onTrigger()
        break
      }
    },
    [shortcuts],
  )

  useEffect(() => {
    const hasEnabledShortcuts = shortcuts.some(s => s.enabled !== false)
    if (!hasEnabledShortcuts) return

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown, shortcuts])
}
