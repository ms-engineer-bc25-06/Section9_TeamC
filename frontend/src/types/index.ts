// 子ども関連の型定義
export interface Child {
  id: string; // UUIDとして文字列で処理
  name: string;
  nickname?: string;
  birthdate?: string; // ISO 8601形式の日付文字列
  age?: number; // フロントエンド表示用（計算で求める）
  grade?: string; // フロントエンド表示用
  created_at?: string;
  updated_at?: string;
}

// 子ども作成用の入力データ型
export interface ChildCreate {
  name: string;
  nickname?: string;
  birthdate?: string;
}

// 子ども選択状態管理用の型
export interface ChildSelectionState {
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;
}

// API レスポンス用の型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// ページネーション用の型
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// 音声認識関連の型
export interface VoiceRecognitionResult {
  id: string;
  child_id: string;
  transcript: string;
  comment?: string;
  created_at: string;
}

// 履歴関連の型
export interface ConversationHistory {
  id: string;
  child_id: string;
  transcript: string;
  ai_feedback?: string;
  created_at: string;
  updated_at?: string;
}