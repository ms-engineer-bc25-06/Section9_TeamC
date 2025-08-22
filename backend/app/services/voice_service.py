import os
import openai
from fastapi import HTTPException
import tempfile
from typing import Optional


class VoiceService:
    def __init__(self):
        self.client = None

    def _get_client(self):
        """遅延初期化でOpenAIクライアントを取得"""
        if self.client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise HTTPException(
                    status_code=500, detail="OPENAI_API_KEY環境変数が設定されていません"
                )
            self.client = openai.OpenAI(api_key=api_key)
        return self.client

    async def transcribe_audio(self, audio_content: bytes, filename: str) -> str:
        """音声ファイルをテキストに変換"""
        try:
            client = self._get_client()

            # 一時ファイルに保存
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file.write(audio_content)
                temp_file_path = temp_file.name

            # Whisper APIで音声認識
            with open(temp_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(model="whisper-1", file=audio_file)

            # 一時ファイル削除
            os.unlink(temp_file_path)

            return transcript.text

        except Exception as e:
            if "temp_file_path" in locals():
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
            raise HTTPException(status_code=500, detail=f"音声認識エラー: {str(e)}")

    async def generate_feedback(
        self, transcribed_text: str, child_name: Optional[str] = None
    ) -> str:
        """AIフィードバックを生成"""
        try:
            client = self._get_client()

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

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "あなたは子供たちを励ます優しい先生です。"},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=300,
                temperature=0.7,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"フィードバック生成エラー: {str(e)}")


voice_service = VoiceService()
