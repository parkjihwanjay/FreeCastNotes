export interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  last_opened_at?: string;
  is_pinned: number; // 0 or 1 (SQLite boolean)
  pin_order: number;
  tags: string[];
}

export type SortOrder = "modified" | "opened" | "title";

export type PanelResizeDirection = "left" | "right" | "up" | "down";

export interface PanelResizeShortcuts {
  left: string;
  right: string;
  up: string;
  down: string;
}

export interface DeletedNote {
  id: string;
  content: string;
  deleted_at: string;
  original_created_at: string;
}
