import logging
from openai import AsyncOpenAI
import openai

from app.core.config import settings
from app.ai.llm import AIServiceError

logger = logging.getLogger(__name__)


def _get_client(api_key: str | None = None) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key or settings.OPENAI_API_KEY)


async def create_embedding(text: str, api_key: str | None = None) -> list[float]:
    """Generates text embedding asynchronously using OpenAI text-embedding-3-small."""
    try:
        client = _get_client(api_key)
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding
    except openai.OpenAIError as e:
        logger.error(f"OpenAI embedding error: {e}", exc_info=True)
        raise AIServiceError("AI embedding service error. Please verify your AI API key.") from e
    except Exception as e:
        logger.error(f"Unexpected error creating embedding: {e}", exc_info=True)
        raise AIServiceError("Failed to generate embedding.") from e