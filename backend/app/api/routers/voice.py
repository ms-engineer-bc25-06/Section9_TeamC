from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from pydantic import BaseModel
from app.core.database import get_async_db
from app.models.child import Child
from app.models.challenge import Challenge
from app.services.ai_feedback_service import AIFeedbackService  # 新しく追加
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/voice", tags=["voice-transcription"])

# AIフィードバックサービスのインスタンス作成
ai_feedback_service = AIFeedbackService()


# PydanticモデルでJSONを受け取る
class TranscribeRequest(BaseModel):
    transcript: str  # Web Speech APIから送る文字起こし結果
    child_id: str  # 子どものUUID


@router.get("/test")
def test_endpoint():
    """テスト用エンドポイント"""
    return {"message": "Voice API is working", "status": "ok"}

@router.post("/transcribe")
async def transcribe_text(request: TranscribeRequest, db: AsyncSession = Depends(get_async_db)):
    """文字起こし結果を受け取りDBに保存し、AIフィードバックを生成"""
    transcript = request.transcript
    child_id = request.child_id

    # デバッグ用ログを追加
    print("🔍 リクエスト受信:")
    print(f"  - child_id: '{child_id}' (type: {type(child_id)})")
    print(f"  - transcript length: {len(transcript) if transcript else 0}")

    try:
        child_uuid = UUID(child_id)
        result = await db.execute(select(Child).where(Child.id == child_uuid))
        child = result.scalars().first()
        if not child:
            return JSONResponse(
                status_code=404,
                content={"detail": "子供が見つかりません", "error_code": "CHILD_NOT_FOUND"},
            )

        # Challenge作成
        challenge = Challenge(child_id=child_uuid, transcript=transcript)
        db.add(challenge)
        await db.commit()
        await db.refresh(challenge)

        child_name = child.nickname or child.name or "お子さま"

        # 子どもの年齢を算出（あれば）
        child_age = None
        try:
            if child and getattr(child, "birthdate", None):
                from datetime import date
                today = date.today()
                child_age = today.year - child.birthdate.year - (
                    (today.month, today.day) < (child.birthdate.month, child.birthdate.day)
                )
        except Exception:
            child_age = None

        # AIフィードバック生成（年齢付き）
        try:
            feedback = await ai_feedback_service.generate_feedback(
                transcript=transcript,
                child_age=child_age,
                feedback_type="english_challenge",  # 英語チャレンジ用の高品質プロンプト
            )
        except Exception as e:
            print(f"⚠️ AIフィードバック生成に失敗、デフォルトメッセージを使用: {e}")
            feedback = f"「{transcript}」と話してくれてありがとう！とても上手に話せていますね。これからも頑張ってください！"

        # Challenge更新
        challenge.ai_feedback = feedback
        db.add(challenge)
        await db.commit()

        return {"transcript_id": str(challenge.id), "status": "completed", "comment": feedback}

    except ValueError as e:
        # UUID変換エラーの場合
        print(f"❌ UUID変換エラー: {str(e)}")
        return JSONResponse(
            status_code=400, content={"detail": "無効なchild_idです", "error_code": "INVALID_UUID"}
        )

    except Exception as e:
        import traceback

        error_details = traceback.format_exc()
        print(f"❌ AIフィードバック生成エラー: {str(e)}")
        print(f"❌ エラー詳細: {error_details}")

        # エラーの場合もChallengeを更新しておく
        if "challenge" in locals():
            try:
                challenge.ai_feedback = f"AIフィードバック生成エラー: {str(error)}"
                db.add(challenge)
                await db.commit()
            except Exception as commit_error:
                print(f"❌ Challenge更新エラー: {commit_error}")

        return JSONResponse(
            status_code=500,

            content={
                "detail": "AIフィードバック生成中にエラーが発生しました",
                "error_code": "AI_FEEDBACK_ERROR",
            },
        )


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
        "ai_feedback": challenge.ai_feedback,
        "created_at": challenge.created_at,
        "status": "completed" if challenge.transcript else "processing",
    }


@router.get("/history/{child_id}")
async def get_voice_history(child_id: str, db: AsyncSession = Depends(get_async_db)):
    """子供の音声認識履歴を取得"""

    # UUID変換して履歴を非同期取得
    child_uuid = UUID(child_id)
    result = await db.execute(
        select(Challenge)
        .where(Challenge.child_id == child_uuid)
        .where(Challenge.transcript.is_not(None))  # 完了した記録のみ
        .order_by(Challenge.created_at.desc())  # 新しい順
    )
    challenges = result.scalars().all()

    return {
        "child_id": child_id,
        "transcripts": [
            {
                "id": challenge.id,
                "transcript": challenge.transcript,
                "ai_feedback": challenge.ai_feedback,
                "created_at": challenge.created_at,
            }
            for challenge in challenges
        ],
    }


@router.get("/challenge/{challenge_id}")
async def get_challenge_detail(challenge_id: str, db: AsyncSession = Depends(get_async_db)):
    """個別のチャレンジ詳細を取得"""
    try:
        print(f"🔍 チャレンジ詳細取得開始: challenge_id={challenge_id}")

        # UUID変換して非同期クエリ実行
        challenge_uuid = UUID(challenge_id)
        result = await db.execute(select(Challenge).where(Challenge.id == challenge_uuid))
        challenge = result.scalars().first()

        if not challenge:
            print(f"❌ チャレンジが見つかりません: {challenge_id}")
            raise HTTPException(status_code=404, detail="チャレンジが見つかりません")

        print(f"✅ チャレンジ詳細取得成功: {challenge_id}")

        return {
            "id": str(challenge.id),
            "child_id": str(challenge.child_id),
            "transcript": challenge.transcript,
            "ai_feedback": challenge.ai_feedback,
            "created_at": challenge.created_at,
            "status": "completed" if challenge.transcript else "processing",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ チャレンジ詳細取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"チャレンジ詳細取得エラー: {str(e)}")
