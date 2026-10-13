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


# =====================================================================
# PHASE 3: WEBSITE URL AUTO-CRAWLER & MISSED QUERIES
# =====================================================================

from pydantic import BaseModel, Field
from app.services.crawler_service import crawl_and_index_url
from app.models.unanswered_query import UnansweredQuery
from app.models.product_knowledge import ProductKnowledge
from app.ai.embeddings import create_embedding
from app.services.company_service import get_company
from sqlalchemy import select


class CrawlUrlRequest(BaseModel):
    url: str = Field(..., min_length=4)
    product_id: int | None = None
    crawl_mode: str = "single"  # "single" | "deep"
    max_pages: int = 15


class ResolveQueryRequest(BaseModel):
    answer: str = Field(..., min_length=2)
    product_id: int | None = None


@router.post("/crawl")
async def crawl_website_url_api(
    payload: CrawlUrlRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Auto-crawl website URL, strip HTML, split into semantic chunks, and vector embed."""
    company = await get_company(db, current_user.company_id)
    api_key = company.llm_api_key if (company and company.llm_provider == "openai" and company.llm_api_key and company.llm_api_key.startswith("sk-")) else None

    try:
        result = await crawl_and_index_url(
            db=db,
            company_id=current_user.company_id,
            url=payload.url,
            product_id=payload.product_id,
            api_key=api_key,
            crawl_mode=payload.crawl_mode,
            max_pages=payload.max_pages,
        )
        return result
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Web crawling error: {str(e)}")


from fastapi import UploadFile, File, Form
from app.services.document_parser import parse_and_index_document


@router.post("/upload")
async def upload_document_api(
    file: UploadFile = File(...),
    product_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and vectorize PDF, DOCX, XLSX, CSV, or TXT into Knowledge Base."""
    company = await get_company(db, current_user.company_id)
    api_key = company.llm_api_key if (company and company.llm_provider == "openai" and company.llm_api_key and company.llm_api_key.startswith("sk-")) else None

    content_bytes = await file.read()
    if not content_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = await parse_and_index_document(
            db=db,
            company_id=current_user.company_id,
            filename=file.filename or "uploaded_document",
            file_bytes=content_bytes,
            product_id=product_id,
            api_key=api_key,
        )
        return result
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Document parsing error: {str(e)}")


@router.get("/unanswered-queries")
async def list_unanswered_queries_api(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List unanswered visitor questions that the AI couldn't find knowledge for."""
    query = select(UnansweredQuery).where(UnansweredQuery.company_id == current_user.company_id)
    if status:
        query = query.where(UnansweredQuery.status == status)
    else:
        # Default show pending first
        query = query.order_by(UnansweredQuery.status.asc(), UnansweredQuery.created_at.desc())

    res = await db.execute(query)
    queries = res.scalars().all()

    return [
        {
            "id": q.id,
            "session_id": q.session_id,
            "question": q.question,
            "ai_response": q.ai_response,
            "status": q.status,
            "created_at": q.created_at.isoformat() if q.created_at else None,
        }
        for q in queries
    ]


@router.post("/unanswered-queries/{query_id}/resolve")
async def resolve_unanswered_query_api(
    query_id: int,
    payload: ResolveQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Turn an unanswered visitor question into a verified Knowledge Base vector entry."""
    res = await db.execute(
        select(UnansweredQuery).where(
            UnansweredQuery.id == query_id,
            UnansweredQuery.company_id == current_user.company_id,
        )
    )
    unanswered = res.scalar_one_or_none()
    if not unanswered:
        raise HTTPException(status_code=404, detail="Unanswered query not found")

    company = await get_company(db, current_user.company_id)
    api_key = company.llm_api_key if company else None

    # Format into QA knowledge chunk
    kb_content = f"Frequently Asked Question:\nQuestion: {unanswered.question}\nAnswer: {payload.answer.strip()}"
    embedding = await create_embedding(kb_content, api_key=api_key)

    new_knowledge = ProductKnowledge(
        company_id=current_user.company_id,
        product_id=payload.product_id,
        content=kb_content,
        embedding=embedding,
    )
    db.add(new_knowledge)
    unanswered.status = "resolved"
    await db.commit()

    return {"message": "Successfully resolved and added to Knowledge Base", "knowledge_id": new_knowledge.id}


@router.post("/unanswered-queries/{query_id}/dismiss")
async def dismiss_unanswered_query_api(
    query_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dismiss an unanswered query that is not relevant."""
    res = await db.execute(
        select(UnansweredQuery).where(
            UnansweredQuery.id == query_id,
            UnansweredQuery.company_id == current_user.company_id,
        )
    )
    unanswered = res.scalar_one_or_none()
    if not unanswered:
        raise HTTPException(status_code=404, detail="Unanswered query not found")

    unanswered.status = "dismissed"
    await db.commit()
    return {"message": "Query dismissed"}