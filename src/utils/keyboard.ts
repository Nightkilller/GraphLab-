/**
 * Keyboard utility functions for handling shortcuts consistently across Windows and Mac
 */

export const isMac =
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

export const modKeyText = isMac ? "⌘" : "Ctrl";
export const modKeyLabel = isMac ? "Cmd" : "Ctrl";

/**
 * Check if the platform modifier key is pressed (Cmd on Mac, Ctrl on Windows/Linux)
 */
export const isModKey = (e: KeyboardEvent): boolean => {
  return e.ctrlKey || e.metaKey;
};
