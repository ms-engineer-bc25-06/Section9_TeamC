from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.challenge import Challenge
from app.models.child import Child
from app.services.ai_feedback_service import AIFeedbackService
from datetime import date

router = APIRouter(prefix="/ai-feedback", tags=["ai-feedback"])


@router.post("/generate/{challenge_id}")
async def generate_feedback_for_challenge(challenge_id: str, db: Session = Depends(get_db)):
    """個別チャレンジのAIフィードバック生成"""

    # チャレンジデータを取得
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="チャレンジが見つかりません")

    if not challenge.transcript:
        raise HTTPException(status_code=400, detail="文字起こしデータがありません")

    # 子どもの年齢情報を取得（修正版）
    child = db.query(Child).filter(Child.id == challenge.child_id).first()
    child_age = None
    if child and child.birthdate:
        today = date.today()
        child_age = (
            today.year
            - child.birthdate.year
            - ((today.month, today.day) < (child.birthdate.month, child.birthdate.day))
        )

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

    # 子どもの年齢情報を取得（修正版）
    child = db.query(Child).filter(Child.id == challenge.child_id).first()
    child_age = None
    if child and child.birthdate:
        today = date.today()
        child_age = (
            today.year
            - child.birthdate.year
            - ((today.month, today.day) < (child.birthdate.month, child.birthdate.day))
        )

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


@router.post("/auto-analyze")
async def auto_analyze_challenges(db: Session = Depends(get_db)):
    """未分析チャレンジの自動AI分析"""

    try:
        # commentが空のチャレンジを取得
        unanalyzed_challenges = (
            db.query(Challenge)
            .filter(
                Challenge.transcript.isnot(None),
                Challenge.transcript != "",
                (Challenge.comment.is_(None)) | (Challenge.comment == ""),
            )
            .all()
        )

        if not unanalyzed_challenges:
            return {
                "success": True,
                "message": "分析対象のチャレンジがありません",
                "processed_count": 0,
            }

        ai_service = AIFeedbackService()
        success_count = 0
        error_count = 0

        for challenge in unanalyzed_challenges:
            try:
                # 子どもの年齢情報を取得（修正版）
                child = db.query(Child).filter(Child.id == challenge.child_id).first()

                # birthdateから年齢を計算
                child_age = None
                if child and child.birthdate:
                    today = date.today()
                    child_age = (
                        today.year
                        - child.birthdate.year
                        - ((today.month, today.day) < (child.birthdate.month, child.birthdate.day))
                    )

                # AI分析実行
                feedback = await ai_service.generate_feedback(
                    transcript=challenge.transcript, child_age=child_age
                )

                # commentに保存
                challenge.comment = feedback
                success_count += 1

            except Exception as e:
                error_count += 1
                print(f"Challenge {challenge.id} 分析失敗: {e}")

        # 一括保存
        db.commit()

        return {
            "success": True,
            "message": f"AI分析完了: 成功 {success_count}件, 失敗 {error_count}件",
            "processed_count": len(unanalyzed_challenges),
            "success_count": success_count,
            "error_count": error_count,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"分析失敗: {str(e)}")


@router.get("/analysis-status")
async def get_analysis_status(db: Session = Depends(get_db)):
    """分析状況の確認"""

    total_with_transcript = (
        db.query(Challenge)
        .filter(Challenge.transcript.isnot(None), Challenge.transcript != "")
        .count()
    )

    analyzed = (
        db.query(Challenge)
        .filter(
            Challenge.transcript.isnot(None),
            Challenge.transcript != "",
            Challenge.comment.isnot(None),
            Challenge.comment != "",
        )
        .count()
    )

    unanalyzed = total_with_transcript - analyzed

    return {
        "total_with_transcript": total_with_transcript,
        "analyzed": analyzed,
        "unanalyzed": unanalyzed,
        "analysis_rate": round((analyzed / total_with_transcript * 100), 1)
        if total_with_transcript > 0
        else 0,
    }


@router.delete("/{challenge_id}")
async def delete_challenge(challenge_id: str, db: Session = Depends(get_db)):
    """チャレンジ記録削除"""

    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="チャレンジ記録が見つかりません")

    try:
        db.delete(challenge)
        db.commit()

        return {"message": "チャレンジ記録を削除しました", "deleted_id": challenge_id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"削除中にエラーが発生しました: {str(e)}")
