from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.core.database import get_async_db
from app.models.child import Child
from app.models.challenge import Challenge
from app.services.voice_service import voice_service

router = APIRouter(prefix="/api/voice", tags=["voice-transcription"])

@router.get("/test")
def test_endpoint():
    """テスト用エンドポイント"""
    return {"message": "Voice API is working", "status": "ok"}

@router.post("/transcribe")
async def transcribe_voice(
    child_id: str,  # UUID文字列として受け取り
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db)  # 非同期セッション
):
    """音声ファイルをアップロードして音声認識・AIフィードバック生成を実行"""
    
     # ファイル形式チェック
    if not file.content_type or not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="音声ファイルが必要です")
    
    # 子供の存在確認（UUID変換して非同期クエリ）
    child_uuid = UUID(child_id)  # 文字列をUUIDに変換
    result = await db.execute(select(Child).where(Child.id == child_uuid))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=404, detail="子供が見つかりません")
    
    # チャレンジ記録を作成・保存
    challenge = Challenge(child_id=child_uuid)
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)
    
    # バックグラウンドで音声認識・フィードバック生成を実行
    background_tasks.add_task(
        process_voice_transcription,
        str(challenge.id),  # UUIDを文字列として渡す
        await file.read(),
        file.filename,
        child.nickname  # nicknameに修正
    )
    
    return {
        "transcript_id": challenge.id,
        "status": "processing",
        "message": "音声認識を開始しました"
    }

async def process_voice_transcription(
    transcript_id: str,  # UUID文字列として受け取り
    audio_content: bytes,
    filename: str,
    child_name: str
):
    """音声認識とフィードバック生成のバックグラウンド処理"""
    from app.core.database import SessionLocal
    
    # 同期セッションを使用（BackgroundTasks内のため）
    db = SessionLocal()
    
    try:
        # 音声認識実行
        transcribed_text = await voice_service.transcribe_audio(audio_content, filename)
        
        # AIフィードバック生成
        feedback = await voice_service.generate_feedback(transcribed_text, child_name)
        
        # UUID変換して記録を更新
        transcript_uuid = UUID(transcript_id)
        challenge = db.query(Challenge).filter(Challenge.id == transcript_uuid).first()
        if challenge:
            challenge.transcript = transcribed_text
            challenge.comment = feedback
            db.commit()
        
    except Exception as e:
        # エラーの場合もログを残す
        transcript_uuid = UUID(transcript_id)  # UUID変換を追加
        challenge = db.query(Challenge).filter(Challenge.id == transcript_uuid).first()
        if challenge:
           challenge.comment = f"処理エラー: {str(e)}"
           db.commit()
        
    finally:
        db.close()

@router.get("/transcript/{transcript_id}")
async def get_transcript(transcript_id: str, db: AsyncSession = Depends(get_async_db)):
    """音声認識結果の取得"""

    # UUID変換して非同期クエリ実行
    transcript_uuid = UUID(transcript_id)
    result = await db.execute(select(Challenge).where(Challenge.id == transcript_uuid))
    challenge = result.scalars().first()

    if not challenge:
        raise HTTPException(status_code=404, detail="音声記録が見つかりません")

    return {
        "id": challenge.id,
        "child_id": challenge.child_id,
        "transcript": challenge.transcript,
        "comment": challenge.comment,
        "created_at": challenge.created_at,
        "status": "completed" if challenge.transcript else "processing"
    }

@router.get("/history/{child_id}")
async def get_voice_history(child_id: str, db: AsyncSession = Depends(get_async_db)):
    """子供の音声認識履歴を取得"""
    
    # UUID変換して履歴を非同期取得
    child_uuid = UUID(child_id)
    result = await db.execute(
        select(Challenge)
        .where(Challenge.child_id == child_uuid)
        .where(Challenge.transcript.isnot(None))  # 完了した記録のみ
        .order_by(Challenge.created_at.desc())  # 新しい順
    )
    challenges = result.scalars().all()

    return {
        "child_id": child_id,
        "transcripts": [
            {
                "id": challenge.id,
                "transcript": challenge.transcript,
                "comment": challenge.comment,
                "created_at": challenge.created_at
            }
            for challenge in challenges
        ]
    }
