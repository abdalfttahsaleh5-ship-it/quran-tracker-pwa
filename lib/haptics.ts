/**
 * Lightweight mobile haptic feedback utility.
 * Provides subtle tactile feedback on mobile devices supporting the Vibration API.
 * Safely fails silently on unsupported browsers and operating systems.
 */

export function lightHaptic(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(12);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function mediumHaptic(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(25);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function successHaptic(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([15, 50, 20]);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function warningHaptic(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([35, 40, 35]);
    } catch {
      // Ignore vibration errors
    }
  }
}
