"""AI関連設定定数 - OpenAIパラメータの明確化"""

# TODO: OpenAI APIキーの本番環境での安全な管理方法確立
# OPTIMIZE: モデル選択の動的切り替え機能（gpt-4, gpt-3.5-turbo）
# FIXME: エラー時のフォールバック機能が未実装

from pydantic_settings import BaseSettings
from typing import Dict, Any


class AIConfig(BaseSettings):
    """AI設定クラス - 環境変数と定数の統一管理"""
    
    # OpenAI API設定
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # トークン数設定（用途別に明確化）
    MAX_TOKENS_FEEDBACK: int = 400      # AIフィードバック生成
    MAX_TOKENS_PHRASE: int = 300        # フレーズ提案
    MAX_TOKENS_SUMMARY: int = 150       # 要約生成
    MAX_TOKENS_VALIDATION: int = 100    # 入力バリデーション
    
    # 温度設定（創造性レベル）
    TEMPERATURE_FEEDBACK: float = 0.7   # フィードバック（バランス型）
    TEMPERATURE_PHRASE: float = 0.8     # フレーズ提案（創造的）
    TEMPERATURE_SUMMARY: float = 0.3    # 要約（事実重視）
    TEMPERATURE_VALIDATION: float = 0.1 # バリデーション（正確性重視）
    
    # リクエスト制限
    MAX_RETRY_ATTEMPTS: int = 3         # 最大再試行回数
    RETRY_DELAY_SECONDS: int = 1        # 再試行間隔
    REQUEST_TIMEOUT_SECONDS: int = 30   # リクエストタイムアウト
    
    class Config:
        env_file = ".env"


# シングルトンインスタンス
ai_config = AIConfig()


# プロンプトテンプレート定数
class PromptTemplates:
    """プロンプトテンプレート"""
    
    FEEDBACK_PROMPT = """
    以下の子どもの発話に対して、温かく励ましのフィードバックを{max_chars}文字以内で生成してください：
    
    発話内容: {transcript}
    
    フィードバックは以下の観点を含めてください：
    - 良い点の具体的な褒め
    - 成長への励まし
    - 次への期待
    """
    
    PHRASE_SUGGESTION_PROMPT = """
    以下の子どもの発話を元に、表現力向上のための言葉の提案を3つ生成してください：
    
    発話内容: {transcript}
    
    より豊かな表現にするための言い換え例を提示してください。
    """