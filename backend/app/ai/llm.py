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


def _get_async_client(api_key: str | None = None, provider: str = "openai") -> AsyncOpenAI:
    """Lazy initialization of the AsyncOpenAI client configured with timeouts, retries, and provider base_url."""
    provider_lower = (provider or "openai").lower()
    base_url = None
    if provider_lower == "deepseek":
        base_url = "https://api.deepseek.com"
    elif provider_lower == "groq":
        base_url = "https://api.groq.com/openai/v1"
    elif provider_lower == "openrouter":
        base_url = "https://openrouter.ai/api/v1"

    return AsyncOpenAI(
        api_key=api_key or settings.OPENAI_API_KEY,
        base_url=base_url,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_retries=settings.OPENAI_MAX_RETRIES,
    )


async def generate_response_with_usage(
    question: str,
    context: str,
    history: list[dict[str, Any]] | None = None,
    api_key: str | None = None,
    model: str | None = None,
    provider: str | None = None,
    persona: str = "professional",
    custom_instructions: str | None = None,
    guardrails: dict | None = None,
) -> tuple[SalesAssistantResponse, dict[str, int]]:
    """
    Asynchronously generates a structured sales assistant response and returns token usage details.
    """
    prompt = build_sales_prompt(
        question=question,
        context=context,
        history=history,
        persona=persona,
        custom_instructions=custom_instructions,
        guardrails=guardrails,
    )

    target_model = model or settings.OPENAI_MODEL
    client = _get_async_client(api_key=api_key, provider=provider or "openai")

    try:
        try:
            response = await client.beta.chat.completions.parse(
                model=target_model,
                temperature=settings.OPENAI_TEMPERATURE,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                response_format=SalesAssistantResponse,
            )
            parsed_response = response.choices[0].message.parsed
        except Exception as parse_err:
            # Fallback to standard chat completion for models that don't support beta parse
            logger.info(f"Structured parse failed for {target_model}, attempting standard JSON completion: {parse_err}")
            res = await client.chat.completions.create(
                model=target_model,
                temperature=settings.OPENAI_TEMPERATURE,
                messages=[
                    {"role": "system", "content": "You are a sales assistant. Respond strictly with valid JSON with keys: 'answer' (string), 'lead_ready' (boolean), and 'lead' (object or null)."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            import json
            raw_text = res.choices[0].message.content or "{}"
            data = json.loads(raw_text)
            parsed_response = SalesAssistantResponse.model_validate(data)
            usage_dict = {
                "prompt_tokens": res.usage.prompt_tokens if res.usage else 0,
                "completion_tokens": res.usage.completion_tokens if res.usage else 0,
                "total_tokens": res.usage.total_tokens if res.usage else 0,
            }
            return parsed_response, usage_dict

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
    api_key: str | None = None,
) -> SalesAssistantResponse:
    parsed_response, _ = await generate_response_with_usage(question, context, history, api_key)
    return parsed_response