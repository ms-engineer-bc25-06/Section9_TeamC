from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.models.challenge import Challenge
from app.models.child import Child
from app.models.user import User
from app.services.ai_feedback_service import AIFeedbackService
from app.utils.auth import get_current_user

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
async def transcribe_text(
    request: TranscribeRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user),
):
    """文字起こし結果を受け取りDBに保存し、AIフィードバックを生成"""
    transcript = request.transcript
    child_id = request.child_id

    # デバッグ用ログを追加
    print("🔍 リクエスト受信:")
    print(f"  - child_id: '{child_id}' (type: {type(child_id)})")
    print(f"  - transcript length: {len(transcript) if transcript else 0}")

    try:
        # 現在のユーザーを取得
        user_result = await db.execute(
            select(User).where(User.firebase_uid == current_user["user_id"])
        )
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

        # 親子関係を検証してから子どもを取得
        child_uuid = UUID(child_id)
        result = await db.execute(
            select(Child).where(Child.id == child_uuid, Child.user_id == user.id)
        )
        child = result.scalars().first()
        if not child:
            raise HTTPException(
                status_code=403, detail="この子供への音声データ投稿権限がありません"
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
                child_age = (
                    today.year
                    - child.birthdate.year
                    - ((today.month, today.day) < (child.birthdate.month, child.birthdate.day))
                )
        except Exception:
            child_age = None

        # AIフィードバック生成（年齢付き）
        try:
            print("🤖 AIフィードバック生成開始...")
            print(f"   - transcript: {transcript[:50]}...")
            print(f"   - child_age: {child_age}")
            feedback = await ai_feedback_service.generate_feedback(
                transcript=transcript,
                child_age=child_age,
                feedback_type="english_challenge",  # 英語チャレンジ用の高品質プロンプト
            )
            print(f"✅ AIフィードバック生成成功: {feedback[:50]}...")
        except Exception as e:
            import traceback

            print("⚠️ AIフィードバック生成に失敗、デフォルトメッセージを使用")
            print(f"   エラー詳細: {str(e)}")
            print(f"   スタックトレース: {traceback.format_exc()}")
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
                challenge.ai_feedback = f"AIフィードバック生成エラー: {str(e)}"
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
async def get_transcript(
    transcript_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user),
):
    """音声認識結果の取得"""

    # UUID変換して非同期クエリ実行
    # 現在のユーザーを取得
    user_result = await db.execute(select(User).where(User.firebase_uid == current_user["user_id"]))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

    # チャレンジを取得
    transcript_uuid = UUID(transcript_id)
    result = await db.execute(select(Challenge).where(Challenge.id == transcript_uuid))
    challenge = result.scalars().first()
    if not challenge:
        raise HTTPException(status_code=404, detail="音声記録が見つかりません")

    # 親子関係を検証
    child_result = await db.execute(
        select(Child).where(
            Child.id == challenge.child_id,
            Child.user_id == user.id,
        )
    )
    child = child_result.scalars().first()
    if not child:
        raise HTTPException(status_code=403, detail="この記録にアクセスする権限がありません")

    return {
        "id": challenge.id,
        "child_id": challenge.child_id,
        "transcript": challenge.transcript,
        "ai_feedback": challenge.ai_feedback,
        "created_at": challenge.created_at,
        "status": "completed" if challenge.transcript else "processing",
    }


@router.get("/history/{child_id}")
async def get_voice_history(
    child_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user),
):
    """子供の音声認識履歴を取得"""

    # 現在のユーザーを取得
    user_result = await db.execute(select(User).where(User.firebase_uid == current_user["user_id"]))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

    # 親子関係を検証
    child_uuid = UUID(child_id)
    child_result = await db.execute(
        select(Child).where(
            Child.id == child_uuid,
            Child.user_id == user.id,
        )
    )
    child = child_result.scalars().first()
    if not child:
        raise HTTPException(status_code=403, detail="この子供の履歴にアクセスする権限がありません")

    # 履歴を取得
    result = await db.execute(
        select(Challenge)
        .where(Challenge.child_id == child_uuid)
        .where(Challenge.transcript.is_not(None))
        .order_by(Challenge.created_at.desc())
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
async def get_challenge_detail(
    challenge_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user),
):
    """個別のチャレンジ詳細を取得"""
    try:
        print(f"🔍 チャレンジ詳細取得開始: challenge_id={challenge_id}")

        # 現在のユーザーを取得
        user_result = await db.execute(
            select(User).where(User.firebase_uid == current_user["user_id"])
        )
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

        # チャレンジを取得
        challenge_uuid = UUID(challenge_id)
        result = await db.execute(select(Challenge).where(Challenge.id == challenge_uuid))
        challenge = result.scalars().first()
        if not challenge:
            raise HTTPException(status_code=404, detail="チャレンジが見つかりません")

        # 親子関係を検証
        child_result = await db.execute(
            select(Child).where(
                Child.id == challenge.child_id,
                Child.user_id == user.id,
            )
        )
        child = child_result.scalars().first()
        if not child:
            raise HTTPException(
                status_code=403, detail="このチャレンジにアクセスする権限がありません"
            )

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
