export interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_pinned: number; // 0 or 1 (SQLite boolean)
  pin_order: number;
}

export interface DeletedNote {
  id: string;
  content: string;
  deleted_at: string;
  original_created_at: string;
}
