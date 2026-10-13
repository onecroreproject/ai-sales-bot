import json
import logging
import re
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


def _extract_sales_response(raw_text: str) -> SalesAssistantResponse:
    """Extract and validate SalesAssistantResponse from model output, handling markdown fences and reasoning tags."""
    if not raw_text or not raw_text.strip():
        return SalesAssistantResponse(
            answer="I am here to help you explore our products and solutions. How can I assist you today?",
            lead_ready=False,
            lead=None,
        )

    clean_text = raw_text.strip()
    # Strip <think>...</think> if reasoning model output contains thinking traces
    clean_text = re.sub(r"<think>[\s\S]*?</think>", "", clean_text).strip()

    # Try finding JSON block within markdown ```json ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean_text)
    candidate_json = match.group(1).strip() if match else clean_text

    # Try parsing JSON
    try:
        data = json.loads(candidate_json)
        if isinstance(data, dict):
            return SalesAssistantResponse.model_validate(data)
    except Exception:
        # Also try locating first { and last }
        start = candidate_json.find("{")
        end = candidate_json.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                sub_data = json.loads(candidate_json[start:end + 1])
                if isinstance(sub_data, dict):
                    return SalesAssistantResponse.model_validate(sub_data)
            except Exception:
                pass

    # If JSON parsing was not successful, treat clean text directly as conversational answer
    return SalesAssistantResponse(
        answer=clean_text or raw_text,
        lead_ready=False,
        lead=None,
    )


def _get_async_client(api_key: str | None = None, provider: str = "openai") -> AsyncOpenAI:
    """Lazy initialization of the AsyncOpenAI client configured with timeouts, retries, and provider base_url."""
    provider_lower = (provider or "openai").lower()
    base_url = None
    if provider_lower in ("nvidia", "nvidia_nim"):
        base_url = "https://integrate.api.nvidia.com/v1"
    elif provider_lower == "deepseek":
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
    Supports OpenAI, NVIDIA NIM (integrate.api.nvidia.com), DeepSeek, Groq, and OpenRouter.
    """
    prompt = build_sales_prompt(
        question=question,
        context=context,
        history=history,
        persona=persona,
        custom_instructions=custom_instructions,
        guardrails=guardrails,
    )

    provider_name = (provider or "openai").lower()
    target_model = model or ("openai/gpt-oss-20b" if provider_name in ("nvidia", "nvidia_nim") else settings.OPENAI_MODEL)
    client = _get_async_client(api_key=api_key, provider=provider_name)

    try:
        # OpenAI native provider supports beta.chat.completions.parse
        if provider_name == "openai":
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
                if parsed_response is not None:
                    usage_dict = {
                        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                        "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                        "total_tokens": response.usage.total_tokens if response.usage else 0,
                    }
                    return parsed_response, usage_dict
            except Exception as parse_err:
                logger.info(f"OpenAI beta parse failed for {target_model}, falling back to standard completion: {parse_err}")

        # NVIDIA NIM / DeepSeek / Groq / OpenRouter / Fallback
        extra_kwargs: dict[str, Any] = {}
        if provider_name in ("nvidia", "nvidia_nim"):
            extra_kwargs["max_tokens"] = 4096
            extra_kwargs["top_p"] = 1.0

        messages_payload = [
            {
                "role": "system",
                "content": (
                    "You are a sales assistant. Respond strictly in JSON format matching this schema:\n"
                    "{\n"
                    '  "answer": "string",\n'
                    '  "lead_ready": boolean,\n'
                    '  "lead": {"name": "string or null", "email": "string or null", "phone": "string or null", "company_name": "string or null", "requirement": "string or null"} or null\n'
                    "}"
                ),
            },
            {"role": "user", "content": prompt},
        ]

        # Attempt with response_format={"type": "json_object"} first
        try:
            res = await client.chat.completions.create(
                model=target_model,
                temperature=settings.OPENAI_TEMPERATURE if provider_name != "nvidia" else 0.7,
                messages=messages_payload,
                response_format={"type": "json_object"},
                **extra_kwargs,
            )
        except Exception as json_format_err:
            logger.info(f"JSON response_format unsupported by {target_model} on {provider_name}, retrying standard: {json_format_err}")
            res = await client.chat.completions.create(
                model=target_model,
                temperature=settings.OPENAI_TEMPERATURE if provider_name != "nvidia" else 0.7,
                messages=messages_payload,
                **extra_kwargs,
            )

        choice_msg = res.choices[0].message

        # Capture and log reasoning content if model supports reasoning (e.g. openai/gpt-oss-20b, DeepSeek-R1)
        reasoning = getattr(choice_msg, "reasoning_content", None)
        if reasoning:
            logger.info(f"[{provider_name.upper()} NIM] Reasoning [{target_model}]: {reasoning[:400]}")

        raw_text = choice_msg.content or "{}"
        parsed_response = _extract_sales_response(raw_text)

        usage_dict = {
            "prompt_tokens": res.usage.prompt_tokens if res.usage else 0,
            "completion_tokens": res.usage.completion_tokens if res.usage else 0,
            "total_tokens": res.usage.total_tokens if res.usage else 0,
        }

        return parsed_response, usage_dict

    except openai.APIConnectionError as e:
        logger.error(f"AI connection error ({provider_name}): {e}", exc_info=True)
        raise AIServiceError(f"Unable to connect to {provider_name.upper()} AI service. Please verify network or base_url.") from e
    except openai.RateLimitError as e:
        logger.error(f"AI rate limit exceeded ({provider_name}): {e}", exc_info=True)
        raise AIServiceError(f"{provider_name.upper()} AI rate limit reached. Please wait a moment.") from e
    except openai.APIStatusError as e:
        logger.error(f"AI status error ({provider_name}, status {e.status_code}): {e.response}", exc_info=True)
        raise AIServiceError(f"{provider_name.upper()} AI returned error status {e.status_code}: {e.message}") from e
    except openai.OpenAIError as e:
        logger.error(f"AI service error ({provider_name}): {e}", exc_info=True)
        raise AIServiceError(f"An error occurred while communicating with {provider_name.upper()}: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error in generate_response ({provider_name}): {e}", exc_info=True)
        raise AIServiceError("An unexpected error occurred during AI generation.") from e


async def generate_response(
    question: str,
    context: str,
    history: list[dict[str, Any]] | None = None,
    api_key: str | None = None,
) -> SalesAssistantResponse:
    parsed_response, _ = await generate_response_with_usage(question, context, history, api_key)
    return parsed_response