from openai import AsyncOpenAI

from app.core.config import settings


client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY
)


async def create_embedding(text: str) -> list[float]:
    """Generates text embedding asynchronously using OpenAI text-embedding-3-small."""
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )

    return response.data[0].embedding