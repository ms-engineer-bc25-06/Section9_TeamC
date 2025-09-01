// エラーメッセージ定数
export const ERROR_MESSAGES = {
  AUTH: {
    UNAUTHORIZED: 'ログインが必要です',
    TOKEN_EXPIRED: 'セッションが期限切れです',
    LOGIN_FAILED: 'ログインに失敗しました',
  },
  CHILDREN: {
    NOT_FOUND: '子ども情報が見つかりません',
    CREATE_FAILED: '子どもの登録に失敗しました',
    UPDATE_FAILED: '子ども情報の更新に失敗しました',
    DELETE_FAILED: '子ども情報の削除に失敗しました',
  },
  VOICE: {
    TRANSCRIBE_FAILED: '文字起こしに失敗しました',
    SAVE_FAILED: '音声データの保存に失敗しました',
    HISTORY_FAILED: '音声履歴の取得に失敗しました',
  },
  NETWORK: {
    CONNECTION_ERROR: 'ネットワークエラーが発生しました',
    TIMEOUT: 'リクエストがタイムアウトしました',
    SERVER_ERROR: 'サーバーエラーが発生しました',
  },
} as const;

// 成功メッセージ定数
export const SUCCESS_MESSAGES = {
  CHILDREN: {
    CREATED: '子どもを登録しました',
    UPDATED: '子ども情報を更新しました',
    DELETED: '子ども情報を削除しました',
  },
  VOICE: {
    SAVED: '音声を保存しました',
    TRANSCRIBED: '文字起こしが完了しました',
  },
} as const;