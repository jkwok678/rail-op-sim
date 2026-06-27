/**
 * @brief Replaces QFont -- no Qt dependency.
 * Serialized as "family,pointSize" (same format as QFont.toString()).
 */
export interface FontInfo {
  family: string;
  pointSize: number;
}

/** 2D coordinate. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Callback for when the Map needs user input (replaces QInputDialog::getItem).
 * Returns the chosen string or null if cancelled / no choice.
 */
export type TextSelectionPrompt = (options: string[]) => string | null;

/**
 * Callback for informational messages (replaces QMessageBox).
 * The app layer connects this to a toast / notification.
 */
export type MessageCallback = (
  type: "success" | "error" | "info",
  message: string
) => void;
