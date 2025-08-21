import openai
import os
from typing import Optional
import asyncio


class AIFeedbackService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_feedback(self, transcript: str, child_age: Optional[int] = None) -> str:
        """音声文字起こしからAIフィードバックを生成"""

        prompt = f"""
以下は子どもが外国人と英語で話そうとした記録です: "{transcript}"

この子の「英語チャレンジ」を以下の観点で温かく評価してください：

🌟 【勇気ポイント】
- 外国人に話しかけた勇気（これだけでも素晴らしい！）
- 英語で何かを伝えようとした挑戦心
- 完璧でなくても諦めずに続けた粘り強さ

💫 【成長の芽】
- 単語一つでも英語を使えた（大きな前進！）
- 相手とのコミュニケーションが少しでも成立した
- 新しい表現や場面に挑戦した

🎯 【次への期待】
- 今回の経験が次の挑戦への自信になる
- 「英語って通じるんだ！」という実感
- 外国人との交流への興味が深まる

【重要】完璧な英語でなくても、話しかけた勇気と挑戦する気持ちが最も価値があります。
この子の頑張りを具体的に褒め、「また話してみたい！」と思えるような励ましを日本語で100文字程度で提供してください。

たとえ一言しか話せなくても、それは大きな成功です。

フィードバック:
"""

        try:
            response = await self._call_openai_api(prompt)
            feedback = response.choices[0].message.content.strip()
            return feedback

        except Exception:
            return f"'{transcript}' とても上手に話せたね！次回も頑張ろう！😊"

    async def _call_openai_api(self, prompt: str):
        """OpenAI API呼び出し（非同期）"""
        loop = asyncio.get_event_loop()

        def _sync_call():
            return self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.7,
                timeout=10.0,
            )

        return await loop.run_in_executor(None, _sync_call)
