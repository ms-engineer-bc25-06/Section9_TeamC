from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.models.child import Child
from app.services.voice_service import voice_service
from datetime import datetime

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
    
    # 生SQLでレコード作成
    result = db.execute(
        text("INSERT INTO challenges (child_id, created_at) VALUES (:child_id, :created_at) RETURNING id"),
        {"child_id": child_id, "created_at": datetime.utcnow()}
    )
    voice_record_id = result.fetchone()[0]
    db.commit()
    
    # バックグラウンドで音声認識・フィードバック生成を実行
    background_tasks.add_task(
        process_voice_transcription,
        voice_record_id,
        await file.read(),
        file.filename,
        child.name
    )
    
    return {
        "transcript_id": voice_record_id,
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
        
        # 生SQLで結果を保存
        db.execute(
            text("UPDATE challenges SET transcript = :transcript, comment = :comment WHERE id = :id"),
            {"transcript": transcribed_text, "comment": feedback, "id": transcript_id}
        )
        db.commit()
        
    except Exception as e:
        # エラーの場合もログを残す
        db.execute(
            text("UPDATE challenges SET comment = :comment WHERE id = :id"),
            {"comment": f"処理エラー: {str(e)}", "id": transcript_id}
        )
        db.commit()
        
    finally:
        db.close()

@router.get("/transcript/{transcript_id}")
async def get_transcript(transcript_id: int, db: Session = Depends(get_db)):
    """音声認識結果の取得"""
    
    result = db.execute(
        text("SELECT id, child_id, transcript, comment, created_at FROM challenges WHERE id = :id"),
        {"id": transcript_id}
    ).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="音声記録が見つかりません")
    
    return {
        "id": result[0],
        "child_id": result[1],
        "transcript": result[2],
        "comment": result[3],
        "created_at": result[4],
        "status": "completed" if result[2] else "processing"
    }

@router.get("/history/{child_id}")
async def get_voice_history(child_id: int, db: Session = Depends(get_db)):
    """子供の音声認識履歴を取得"""
    
    results = db.execute(
        text("""
            SELECT id, transcript, comment, created_at 
            FROM challenges 
            WHERE child_id = :child_id AND transcript IS NOT NULL
            ORDER BY created_at DESC
        """),
        {"child_id": child_id}
    ).fetchall()
    
    return {
        "child_id": child_id,
        "transcripts": [
            {
                "id": row[0],
                "transcript": row[1],
                "comment": row[2],
                "created_at": row[3]
            }
            for row in results
        ]
    }
