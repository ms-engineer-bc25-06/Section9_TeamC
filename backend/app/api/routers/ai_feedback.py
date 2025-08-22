from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.challenge import Challenge
from app.models.child import Child
from app.services.ai_feedback_service import AIFeedbackService

router = APIRouter(prefix="/api/ai-feedback", tags=["ai-feedback"])


@router.post("/generate/{challenge_id}")
async def generate_feedback_for_challenge(challenge_id: str, db: Session = Depends(get_db)):
    """個別チャレンジのAIフィードバック生成"""

    # チャレンジデータを取得
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="チャレンジが見つかりません")

    if not challenge.transcript:
        raise HTTPException(status_code=400, detail="文字起こしデータがありません")

    # 子どもの年齢情報を取得
    child = db.query(Child).filter(Child.id == challenge.child_id).first()
    child_age = None

    try:
        # AIフィードバック生成
        ai_service = AIFeedbackService()
        new_feedback = await ai_service.generate_feedback(
            transcript=challenge.transcript, child_age=child_age
        )

        # 元のコメントを保存
        original_comment = challenge.comment

        # commentカラムを更新
        challenge.comment = new_feedback
        db.commit()

        return {
            "success": True,
            "challenge_id": challenge_id,
            "transcript": challenge.transcript,
            "original_comment": original_comment,
            "new_feedback": new_feedback,
            "child_age": child_age,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AIフィードバック生成に失敗しました: {str(e)}")


@router.post("/preview/{challenge_id}")
async def preview_feedback(challenge_id: str, db: Session = Depends(get_db)):
    """AIフィードバックのプレビュー（DBは更新しない）"""

    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="チャレンジが見つかりません")

    if not challenge.transcript:
        raise HTTPException(status_code=400, detail="文字起こしデータがありません")

    # 子どもの年齢情報を取得
    child = db.query(Child).filter(Child.id == challenge.child_id).first()
    child_age = None

    try:
        ai_service = AIFeedbackService()
        preview_feedback = await ai_service.generate_feedback(
            transcript=challenge.transcript, child_age=child_age
        )

        return {
            "success": True,
            "challenge_id": challenge_id,
            "transcript": challenge.transcript,
            "current_comment": challenge.comment,
            "preview_feedback": preview_feedback,
            "child_age": child_age,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"プレビュー生成に失敗しました: {str(e)}")
