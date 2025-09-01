"""AI クライアント - 依存性注入対応"""

from abc import ABC, abstractmethod
import openai
from app.constants.ai_config import ai_config


class IAIClient(ABC):
    """AI クライアントの抽象インターフェース"""

    @abstractmethod
    async def generate_feedback(self, transcript: str, max_chars: int = 50) -> str:
        """フィードバック生成"""
        pass

    @abstractmethod
    async def suggest_phrases(self, transcript: str) -> list[str]:
        """フレーズ提案"""
        pass


class OpenAIClient(IAIClient):
    """OpenAI実装"""

    def __init__(self, api_key: str = None):
        self.client = openai.OpenAI(api_key=api_key or ai_config.OPENAI_API_KEY)

    async def generate_feedback(self, transcript: str, max_chars: int = 50) -> str:
        try:
            response = await self.client.chat.completions.acreate(
                model=ai_config.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": f"子どもの発話に{max_chars}文字以内で温かいフィードバックを",
                    },
                    {"role": "user", "content": transcript},
                ],
                max_tokens=ai_config.MAX_TOKENS_FEEDBACK,
                temperature=ai_config.TEMPERATURE_FEEDBACK,
            )

            return response.choices[0].message.content.strip()
        except Exception as error:
            raise Exception(f"AI フィードバック生成エラー: {error}")

    async def suggest_phrases(self, transcript: str) -> list[str]:
        try:
            response = await self.client.chat.completions.acreate(
                model=ai_config.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "発話の表現力向上のため3つの言い換え例を提案してください",
                    },
                    {"role": "user", "content": transcript},
                ],
                max_tokens=ai_config.MAX_TOKENS_PHRASE,
                temperature=ai_config.TEMPERATURE_PHRASE,
            )

            content = response.choices[0].message.content.strip()
            return [phrase.strip() for phrase in content.split("\n") if phrase.strip()]
        except Exception as error:
            raise Exception(f"フレーズ提案エラー: {error}")
