from openai import AsyncOpenAI

from app.core.config import settings


def _get_client(api_key: str | None = None) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key or settings.OPENAI_API_KEY)


async def create_embedding(text: str, api_key: str | None = None) -> list[float]:
    """Generates text embedding asynchronously using OpenAI text-embedding-3-small."""
    client = _get_client(api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )

    return response.data[0].embedding