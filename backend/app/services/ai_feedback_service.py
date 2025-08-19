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
子どもが英語で話した内容: "{transcript}"

温かく励ましながら、具体的で建設的なフィードバックをお願いします。

以下の要素を含めてください：
- 良かった点を具体的に褒める
- 発音や文法の改善点があれば優しくアドバイス
- 次回への励ましメッセージ
- 絵文字を使って親しみやすく
- 100文字程度でまとめる

フィードバック:
"""
        
        try:
            response = await self._call_openai_api(prompt)
            feedback = response.choices[0].message.content.strip()
            return feedback
            
        except Exception as e:
            return f"'{transcript}' とても上手に話せたね！次回も頑張ろう！😊"
    
    async def _call_openai_api(self, prompt: str):
        """OpenAI API呼び出し（非同期）"""
        loop = asyncio.get_event_loop()
        
        def _sync_call():
            return self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.7,
                timeout=10.0
            )
        
        return await loop.run_in_executor(None, _sync_call)