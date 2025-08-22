import os
import tempfile
import openai
from fastapi import HTTPException
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
                except Exception:
                    pass
            raise HTTPException(status_code=500, detail=f"音声認識エラー: {str(e)}")

    # ❌ generate_feedback() メソッドを削除
    # 今後はai_feedback_service.pyを使用


voice_service = VoiceService()