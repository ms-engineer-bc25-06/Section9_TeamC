// UI関連定数 - マジックナンバー排除

export const UI_CONFIG = {
  // テキスト表示設定
  TOKEN_PREVIEW_LENGTH: 20, // トークンプレビューの文字数
  TRANSCRIPT_PREVIEW_LENGTH: 30, // 文字起こしプレビューの文字数

  // 遅延・タイミング設定
  DEBOUNCE_DELAY_MS: 300, // 入力デバウンス
  LOADING_DELAY_MS: 200, // ローディング表示遅延
  NOTIFICATION_DURATION_MS: 5000, // 通知表示時間

  // バリデーション設定
  MAX_NICKNAME_LENGTH: 50, // ニックネーム最大文字数
  MIN_AGE_YEARS: 0, // 最小年齢
  MAX_AGE_YEARS: 15, // 最大年齢

  // ページネーション
  DEFAULT_PAGE_SIZE: 10, // デフォルトページサイズ
  MAX_PAGE_SIZE: 100, // 最大ページサイズ
} as const;
