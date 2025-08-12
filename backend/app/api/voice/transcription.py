from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.child import Child
from app.models.challenge import Challenge
from app.services.voice_service import voice_service

router = APIRouter(prefix="/api/voice", tags=["voice-transcription"])

@router.get("/test")
async def test_endpoint():
    """テスト用エンドポイント"""
    return {"message": "Voice API is working", "status": "ok"}

@router.post("/transcribe")
async def transcribe_voice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    child_id: int = 1,
    db: Session = Depends(get_db)
):
    """音声ファイルをアップロードして音声認識・AIフィードバック生成を実行"""
    
    # ファイル形式チェック
    if not file.content_type or not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="音声ファイルが必要です")
    
    # 子供の存在確認
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="子供が見つかりません")
    
    challenge = Challenge(child_id=child_id)
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    
    # バックグラウンドで音声認識・フィードバック生成を実行
    background_tasks.add_task(
        process_voice_transcription,
        challenge.id,  # ← voice_record_id から challenge.id に修正
        await file.read(),
        file.filename,
        child.name
    )
    
    return {
        "transcript_id": challenge.id,
        "status": "processing",
        "message": "音声認識を開始しました"
    }

async def process_voice_transcription(
    transcript_id: int,
    audio_content: bytes,
    filename: str,
    child_name: str
):
    """音声認識とフィードバック生成のバックグラウンド処理"""
    from app.core.database import SessionLocal
    
    db = SessionLocal()
    
    try:
        # 音声認識実行
        transcribed_text = await voice_service.transcribe_audio(audio_content, filename)
        
        # AIフィードバック生成
        feedback = await voice_service.generate_feedback(transcribed_text, child_name)
        
        challenge = db.query(Challenge).filter(Challenge.id == transcript_id).first()
        if challenge:
            challenge.transcript = transcribed_text
            challenge.comment = feedback
            db.commit()
        
    except Exception as e:
        # エラーの場合もログを残す
        challenge = db.query(Challenge).filter(Challenge.id == transcript_id).first()
        if challenge:
            challenge.comment = f"処理エラー: {str(e)}"
            db.commit()
        
    finally:
        db.close()

@router.get("/transcript/{transcript_id}")
async def get_transcript(transcript_id: int, db: Session = Depends(get_db)):
    """音声認識結果の取得"""
    
    challenge = db.query(Challenge).filter(Challenge.id == transcript_id).first()

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
async def get_voice_history(child_id: int, db: Session = Depends(get_db)):
    """子供の音声認識履歴を取得"""
    
    challenges = db.query(Challenge)\
        .filter(Challenge.child_id == child_id)\
        .filter(Challenge.transcript.isnot(None))\
        .order_by(Challenge.created_at.desc())\
        .all()

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