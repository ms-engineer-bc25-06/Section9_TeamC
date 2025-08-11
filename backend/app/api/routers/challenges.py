from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.models.challenge import Challenge, ChallengeParticipation
from app.models.child import Child
from app.models.user import User
from app.schemas.challenge import (
    Challenge as ChallengeSchema,
    ChallengeCreate,
    ChallengeUpdate,
    ChallengeWithCreator,
    ChallengeParticipation as ChallengeParticipationSchema,
    ChallengeParticipationUpdate,
    ChallengeHistoryItem,
    ChallengeHistoryDetail
)
from app.api.routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ChallengeSchema])
async def get_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    challenges = db.query(Challenge).all()
    return challenges

@router.post("/", response_model=ChallengeSchema)
async def create_challenge(
    challenge: ChallengeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_challenge = Challenge(**challenge.dict(), creator_id=current_user.id)
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge

@router.get("/{challenge_id}", response_model=ChallengeWithCreator)
async def get_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    return challenge

@router.put("/{challenge_id}", response_model=ChallengeSchema)
async def update_challenge(
    challenge_id: int,
    challenge_update: ChallengeUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    if challenge.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this challenge"
        )

    update_data = challenge_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(challenge, field, value)

    db.commit()
    db.refresh(challenge)
    return challenge

@router.delete("/{challenge_id}")
async def delete_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    if challenge.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this challenge"
        )

    db.delete(challenge)
    db.commit()
    return {"message": "Challenge deleted successfully"}

@router.post("/{challenge_id}/participate", response_model=ChallengeParticipationSchema)
async def participate_in_challenge(
    challenge_id: int,
    child_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.firebase_uid
    ).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not authorized"
        )

    existing_participation = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.challenge_id == challenge_id,
        ChallengeParticipation.child_id == child_id
    ).first()

    if existing_participation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Child is already participating in this challenge"
        )

    participation = ChallengeParticipation(
        challenge_id=challenge_id,
        child_id=child_id
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)
    return participation

@router.get("/{challenge_id}/participations", response_model=List[ChallengeParticipationSchema])
async def get_challenge_participations(
    challenge_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    participations = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.challenge_id == challenge_id
    ).all()

    return participations

@router.put("/participations/{participation_id}", response_model=ChallengeParticipationSchema)
async def update_participation(
    participation_id: int,
    participation_update: ChallengeParticipationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    participation = db.query(ChallengeParticipation).filter(
        ChallengeParticipation.id == participation_id
    ).first()

    if not participation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participation not found"
        )

    child = db.query(Child).filter(Child.id == participation.child_id,
    Child.user_id == current_user.firebase_uid).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this participation"
        )

    update_data = participation_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(participation, field, value)

    if participation_update.status == "completed":
        from datetime import datetime
        participation.completed_at = datetime.utcnow()
        if not participation.points_earned:
            challenge = db.query(Challenge).filter(Challenge.id == participation.challenge_id).first()
            participation.points_earned = challenge.reward_points

    db.commit()
    db.refresh(participation)
    return participation

@router.get("/children/{child_id}/history", response_model=List[ChallengeHistoryItem])
async def get_challenge_history(
    child_id: int,
    sort: Optional[str] = "date_desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 子どもの所有チェック（children.py と同じやり方）
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.firebase_uid
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found or not authorized")

    # 参加記録を取得（ChallengeをJOINしてタイトルなどを取る）
    query = db.query(ChallengeParticipation).options(joinedload(ChallengeParticipation.challenge)) \
        .filter(ChallengeParticipation.child_id == child_id)

    # ソート条件
    if sort == "score_desc":
        query = query.order_by(ChallengeParticipation.points_earned.desc())
    else:
        query = query.order_by(ChallengeParticipation.completed_at.desc())

    participations = query.all()

    return [
        ChallengeHistoryItem(
            participation_id=p.id,
            challenge_id=p.challenge.id,
            title=p.challenge.title,
            completed_at=p.completed_at,
            points_earned=p.points_earned
        )
        for p in participations
    ]


@router.get("/children/{child_id}/history/{participation_id}", response_model=ChallengeHistoryDetail)
async def get_challenge_detail(
    child_id: int,
    participation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 子どもの所有チェック
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.firebase_uid
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found or not authorized")

    # 参加記録1件取得
    participation = db.query(ChallengeParticipation).options(joinedload(ChallengeParticipation.challenge)) \
        .filter(
            ChallengeParticipation.child_id == child_id,
            ChallengeParticipation.id == participation_id
        ).first()

    if not participation:
        raise HTTPException(status_code=404, detail="Challenge participation not found")

    return ChallengeHistoryDetail(
        participation_id=participation.id,
        challenge_id=participation.challenge.id,
        title=participation.challenge.title,
        description=participation.challenge.description,
        category=participation.challenge.category,
        difficulty_level=participation.challenge.difficulty_level,
        estimated_duration=participation.challenge.estimated_duration,
        reward_points=participation.challenge.reward_points,
        status=participation.status,
        completed_at=participation.completed_at,
        points_earned=participation.points_earned,
        notes=participation.notes
    )
