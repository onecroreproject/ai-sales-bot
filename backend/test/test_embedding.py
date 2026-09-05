import pytest
from app.ai.embeddings import create_embedding


@pytest.mark.anyio
async def test_create_embedding_dimension():
    embedding = await create_embedding(
        "AI Sales Assistant helps businesses generate more leads."
    )
    assert isinstance(embedding, list)
    assert len(embedding) == 1536