"""エラーメッセージとレスポンス定数"""

# エラーメッセージ
ERROR_MESSAGES = {
    "AUTH": {
        "INVALID_TOKEN": "認証トークンが無効です",
        "TOKEN_EXPIRED": "認証トークンの有効期限が切れています",
        "UNAUTHORIZED": "認証が必要です",
        "FORBIDDEN": "この操作を実行する権限がありません",
    },
    "CHILDREN": {
        "NOT_FOUND": "子ども情報が見つかりません",
        "ALREADY_EXISTS": "同じ名前の子どもが既に登録されています",
        "INVALID_DATA": "子ども情報が正しくありません",
    },
    "VOICE": {
        "TRANSCRIBE_FAILED": "音声の文字起こしに失敗しました",
        "INVALID_AUDIO": "音声ファイルが正しくありません",
        "PROCESSING_ERROR": "音声処理中にエラーが発生しました",
    },
    "DATABASE": {
        "CONNECTION_ERROR": "データベース接続エラー",
        "TRANSACTION_FAILED": "データベース操作に失敗しました",
    },
    "EXTERNAL_API": {
        "OPENAI_ERROR": "AI処理サービスでエラーが発生しました",
        "FIREBASE_ERROR": "認証サービスでエラーが発生しました",
    },
}

# 成功メッセージ
SUCCESS_MESSAGES = {
    "CHILDREN": {
        "CREATED": "子どもを登録しました",
        "UPDATED": "子ども情報を更新しました",
        "DELETED": "子ども情報を削除しました",
    },
    "VOICE": {
        "TRANSCRIBED": "文字起こしが完了しました",
        "FEEDBACK_GENERATED": "AIフィードバックを生成しました",
    },
}
