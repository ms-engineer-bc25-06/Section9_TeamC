import openai
import os
from typing import Optional
import asyncio
from fastapi import HTTPException


class AIFeedbackService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_feedback(
        self,
        transcript: str,
        child_age: Optional[int] = None,
        feedback_type: str = "english_challenge",
    ) -> str:
        """統合されたAIフィードバック生成"""

        if feedback_type == "english_challenge":
            return await self._generate_english_challenge_feedback(transcript, child_age)
        elif feedback_type == "general":
            return await self._generate_general_feedback(transcript)
        else:
            return await self._generate_english_challenge_feedback(transcript, child_age)

    async def _generate_english_challenge_feedback(
        self, transcript: str, child_age: Optional[int] = None
    ) -> str:
        """英語チャレンジ用フィードバック"""

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
            print(f"🔍 AIフィードバック生成開始: transcript='{transcript}'")
            print(f"🔍 プロンプト長: {len(prompt)} 文字")
            response = await self._call_openai_api(prompt)
            feedback = response.choices[0].message.content.strip()
            print(f"✅ AIフィードバック生成成功: feedback='{feedback}'")
            return feedback

        except Exception as e:
            print(f"❌ AIフィードバック生成エラー: {e}")
            print(f"❌ エラータイプ: {type(e).__name__}")
            import traceback

            print(f"❌ トレースバック: {traceback.format_exc()}")
            return f"'{transcript}' とても上手に話せたね！次回も頑張ろう！😊"

    async def _generate_general_feedback(self, transcribed_text: str) -> str:
        """一般的なフィードバック"""

        try:
            prompt = f"""
あなたは優しい先生です。子供が話した内容を聞いて、温かく励ましのフィードバックをしてください。

子供が話した内容：
「{transcribed_text}」

以下の点を含めてフィードバックしてください：
1. 話してくれたことへの感謝
2. 良かった点の具体的な褒め言葉
3. 次に向けての優しい励まし

フィードバックは200文字以内で、子供が理解しやすい言葉で書いてください。
"""

            response = await self._call_openai_api_with_system(
                prompt,
                system_message="あなたは子供たちを励ます優しい先生です。",
                model="gpt-3.5-turbo",
                max_tokens=300,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"フィードバック生成エラー: {str(e)}")

    async def _call_openai_api(self, prompt: str):
        """OpenAI API呼び出し"""
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

    async def _call_openai_api_with_system(
        self, prompt: str, system_message: str, model: str = "gpt-4o-mini", max_tokens: int = 150, temperature: float = 0.7, # 追加
    ):
        """OpenAI API呼び出し（システムメッセージ付き）"""
        loop = asyncio.get_event_loop()

        def _sync_call():
          return self.client.chat.completions.create(
            model=model,
            messages=[
             {"role": "system", "content": system_message},
             {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
           timeout=10.0,
          )
        return await loop.run_in_executor(None, _sync_call)
