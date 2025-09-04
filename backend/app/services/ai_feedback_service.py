import asyncio
import os
from typing import Optional

import openai
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
        """英語チャレンジ用フィードバック（JSON出力・温かい評価観点付き）"""
        system_message = (
            "あなたは子どもを励ます優しい英語コーチです。"
            "出力は必ず日本語で、やさしく具体的に短く書きます。"
            "最終出力は指定のJSONのみ返してください。"
        )
        user_prompt = f"""
以下は子どもが外国人と英語で話そうとした記録です: "{transcript}"

手順:
1) 推定話者分離: 「子どもが話した可能性が高い発話」を抽出（短い文・言い直し・ためらい・やさしい語彙など）
2) この子の「英語チャレンジ」を以下の観点で温かく評価（約50文字）:
   🌟【勇気ポイント】外国人に話しかけた勇気、英語で伝えようとした挑戦心
   💫【成長の芽】単語一つでも英語を使えた、コミュニケーションが成立した
   🎯【次への期待】この経験が次の挑戦への自信になる
   【重要】完璧でなくても、話しかけた勇気と挑戦する気持ちが最も価値がある
3) 会話文脈に沿った簡単な英語フレーズを1つ提案し、どんな場面で使うかを簡潔に説明（年齢: {child_age if child_age is not None else "不明"}）

出力は必ず次のJSONだけ:
{{
  "child_utterances": ["子どもと推定した発話1", "発話2"],
  "feedback_short": "🌟💫🎯の観点を含む約50文字の短い応援コメント",
  "phrase_suggestion": {{ "en": "Hello", "ja": "初めて会った人への挨拶" }},
  "note": "話者推定で迷った点があれば簡潔に。なければ空文字"
}}
"""

        try:
            response = await self._call_openai_api_with_system(
                prompt=user_prompt,
                system_message=system_message,
                model="gpt-4o-mini",
                max_tokens=400,
                temperature=0.0,
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return f"「{transcript}」に挑戦できてすごいよ！外国人に話しかけた勇気が素晴らしい！次も頑張ろう！😊"

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
                model="gpt-4o-mini",
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
                timeout=30.0,
            )

        return await loop.run_in_executor(None, _sync_call)

    async def _call_openai_api_with_system(
        self,
        prompt: str,
        system_message: str,
        model: str = "gpt-4o-mini",
        max_tokens: int = 150,
        temperature: float = 0.7,
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
                timeout=30.0,
            )

        return await loop.run_in_executor(None, _sync_call)
