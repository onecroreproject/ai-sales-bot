import logging
from typing import Any
import openai
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from app.core.config import settings
from app.ai.prompts.sales_assistant import build_sales_prompt

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Custom exception raised when AI generation fails."""
    pass


class LeadInfo(BaseModel):
    name: str | None = Field(default=None, description="Full name of the prospect")
    email: str | None = Field(default=None, description="Email address of the prospect")
    phone: str | None = Field(default=None, description="Phone number of the prospect")
    company_name: str | None = Field(default=None, description="Company name of the prospect")
    requirement: str | None = Field(default=None, description="Specific business or product requirement")


class SalesAssistantResponse(BaseModel):
    answer: str = Field(..., description="Helpful, professional response to the customer")
    lead_ready: bool = Field(default=False, description="True only when all five lead fields are captured")
    lead: LeadInfo | None = Field(default=None, description="Lead details object when lead_ready is true")


def _get_async_client() -> AsyncOpenAI:
    """Lazy initialization of the AsyncOpenAI client configured with timeouts and retries."""
    return AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_retries=settings.OPENAI_MAX_RETRIES,
    )


async def generate_response_with_usage(
    question: str,
    context: str,
    history: list[dict[str, Any]] | None = None,
) -> tuple[SalesAssistantResponse, dict[str, int]]:
    """
    Asynchronously generates a structured sales assistant response and returns token usage details.
    """
    prompt = build_sales_prompt(
        question=question,
        context=context,
        history=history,
    )

    client = _get_async_client()

    try:
        response = await client.beta.chat.completions.parse(
            model=settings.OPENAI_MODEL,
            temperature=settings.OPENAI_TEMPERATURE,
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format=SalesAssistantResponse,
        )

        parsed_response = response.choices[0].message.parsed

        if parsed_response is None:
            logger.error("OpenAI model returned null parsed response")
            raise AIServiceError("Failed to parse structured AI response.")

        usage_dict = {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
        }

        return parsed_response, usage_dict

    except openai.APIConnectionError as e:
        logger.error(f"OpenAI connection error: {e}", exc_info=True)
        raise AIServiceError("Unable to connect to AI service. Please try again later.") from e
    except openai.RateLimitError as e:
        logger.error(f"OpenAI rate limit exceeded: {e}", exc_info=True)
        raise AIServiceError("AI service rate limit reached. Please wait a moment.") from e
    except openai.APIStatusError as e:
        logger.error(f"OpenAI status error ({e.status_code}): {e.response}", exc_info=True)
        raise AIServiceError(f"AI service returned error status {e.status_code}.") from e
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error: {e}", exc_info=True)
        raise AIServiceError("An error occurred while processing the AI response.") from e
    except Exception as e:
        logger.error(f"Unexpected error in generate_response: {e}", exc_info=True)
        raise AIServiceError("An unexpected error occurred during AI generation.") from e


async def generate_response(
    question: str,
    context: str,
    history: list[dict[str, Any]] | None = None,
) -> SalesAssistantResponse:
    parsed_response, _ = await generate_response_with_usage(question, context, history)
    return parsed_response