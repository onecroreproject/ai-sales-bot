from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.knowledge import (
    KnowledgeCreate,
    KnowledgeResponse,
    KnowledgeUpdate,
)
from app.services.knowledge_service import (
    create_knowledge,
    get_knowledge,
    update_knowledge,
    delete_knowledge,
)
from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/api/v1/knowledge",
    tags=["Knowledge"],
)


@router.post(
    "",
    response_model=KnowledgeResponse,
)
async def create_knowledge_api(
    knowledge: KnowledgeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if knowledge.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot create knowledge for another company",
        )

    try:
        return await create_knowledge(db, knowledge)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create knowledge",
        )


@router.get(
    "",
    response_model=list[KnowledgeResponse],
)
async def list_knowledge(
    company_id: int | None = None,
    product_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if company_id is not None and company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another company's knowledge",
        )

    try:
        return await get_knowledge(
            db,
            current_user.company_id,
            product_id,
        )
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve knowledge",
        )


@router.put(
    "/{knowledge_id}",
    response_model=KnowledgeResponse,
)
async def update_knowledge_api(
    knowledge_id: int,
    knowledge_data: KnowledgeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update knowledge entry & re-index vector embedding if text content changed."""
    try:
        return await update_knowledge(db, knowledge_id, current_user.company_id, knowledge_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Unable to update knowledge entry")


@router.delete(
    "/{knowledge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_knowledge_api(
    knowledge_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a knowledge entry from current company's RAG knowledge base."""
    try:
        await delete_knowledge(db, knowledge_id, current_user.company_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Unable to delete knowledge entry")