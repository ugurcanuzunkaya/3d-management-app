import os
import json
import base64
import logging
from typing import Optional

# Core libraries
import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from firecrawl import FirecrawlApp

# AI Provider libraries
from google import genai
from google.genai import types
import openai
import anthropic

from app.config import AppSettings
from app.schemas.model3d import ModelExtractionResult

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, settings: AppSettings):
        self.settings = settings

        # 1. Firecrawl Client
        self.firecrawl_api_key = settings.firecrawl_api_key or os.getenv(
            "FIRECRAWL_API_KEY"
        )
        if self.firecrawl_api_key:
            try:
                self.firecrawl_app = FirecrawlApp(api_key=self.firecrawl_api_key)
            except Exception as e:
                logger.error(f"Failed to initialize FirecrawlApp: {e}")
                self.firecrawl_app = None
        else:
            self.firecrawl_app = None
            logger.warning(
                "FIRECRAWL_API_KEY not set. Firecrawl scraping will be bypassed."
            )

        # 2. Gemini Client (Uses gemini-3.1-flash-lite)
        self.gemini_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
        if self.gemini_key:
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_key)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self.gemini_client = None
        else:
            self.gemini_client = None
            logger.warning("GEMINI_API_KEY not set. Gemini features will be disabled.")

        # 3. OpenAI Client (Uses gpt-4o-mini)
        self.openai_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
        if self.openai_key:
            try:
                self.openai_client = openai.OpenAI(api_key=self.openai_key)
                self.async_openai_client = openai.AsyncOpenAI(api_key=self.openai_key)
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI Client: {e}")
                self.openai_client = None
                self.async_openai_client = None
        else:
            self.openai_client = None
            self.async_openai_client = None
            logger.warning("OPENAI_API_KEY not set. OpenAI features will be disabled.")

        # 4. Anthropic Client (Uses claude-3-5-haiku for text, claude-3-5-sonnet for images)
        self.anthropic_key = settings.anthropic_api_key or os.getenv(
            "ANTHROPIC_API_KEY"
        )
        if self.anthropic_key:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_key)
                self.async_anthropic_client = anthropic.AsyncAnthropic(
                    api_key=self.anthropic_key
                )
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic Client: {e}")
                self.anthropic_client = None
                self.async_anthropic_client = None
        else:
            self.anthropic_client = None
            self.async_anthropic_client = None
            logger.warning(
                "ANTHROPIC_API_KEY not set. Claude features will be disabled."
            )

    async def fetch_markdown_or_text(self, url: str) -> Optional[str]:
        """
        Robust 3-tiered webpage scraper:
        Tier 1: Firecrawl (if key available)
        Tier 2: Playwright headless browser rendering
        Tier 3: standard HTTP GET (httpx + BeautifulSoup text extractor)
        """
        # Tier 1: Firecrawl
        if self.firecrawl_app:
            try:
                logger.info(f"Scraping with Firecrawl (Tier 1): {url}")
                result = self.firecrawl_app.scrape(url, formats=["markdown"])
                if result and hasattr(result, "markdown") and result.markdown:
                    return result.markdown
                elif isinstance(result, dict) and "markdown" in result:
                    return result["markdown"]
            except Exception as e:
                logger.warning(
                    f"Firecrawl scrape failed, trying Playwright fallback: {e}"
                )

        # Tier 2: Playwright Headless Browser
        try:
            logger.info(f"Scraping with Playwright (Tier 2): {url}")
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                try:
                    context = await browser.new_context(
                        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    )
                    page = await context.new_page()
                    # Set a realistic viewport and headers
                    await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    await page.wait_for_timeout(
                        3000
                    )  # Safe buffer for hydration on SPA (Makerworld/Printables)
                    text_content = await page.locator("body").inner_text()
                    if text_content and len(text_content.strip()) > 100:
                        return text_content
                finally:
                    await browser.close()
        except Exception as e:
            logger.warning(
                f"Playwright scrape failed, trying BeautifulSoup fallback: {e}"
            )

        # Tier 3: standard HTTP GET + BeautifulSoup Clean Text
        try:
            logger.info(f"Scraping with HTTP GET + BeautifulSoup (Tier 3): {url}")
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    # Decompose non-content elements
                    for script in soup(
                        [
                            "script",
                            "style",
                            "nav",
                            "footer",
                            "header",
                            "noscript",
                            "aside",
                        ]
                    ):
                        script.decompose()
                    text = soup.get_text(separator="\n")
                    lines = (line.strip() for line in text.splitlines())
                    chunks = (
                        phrase.strip() for line in lines for phrase in line.split("  ")
                    )
                    text_content = "\n".join(chunk for chunk in chunks if chunk)
                    if text_content and len(text_content.strip()) > 100:
                        return text_content[:50000]
        except Exception as e:
            logger.error(f"HTTP BS4 scrape failed: {e}")

        return None

    def _get_active_provider(self, requested_provider: str) -> str:
        """Determines the active AI Provider based on API key availability and fallback logic."""
        req = requested_provider.lower().strip()
        if req == "gemini" and self.gemini_client:
            return "gemini"
        elif req == "openai" and self.openai_client:
            return "openai"
        elif req == "claude" and self.anthropic_client:
            return "claude"
        elif req == "ollama_gemma4":
            return "ollama_gemma4"
        elif req == "ollama_qwen3.5":
            return "ollama_qwen3.5"

        # Fallbacks based on availability
        if self.gemini_client:
            return "gemini"
        elif self.openai_client:
            return "openai"
        elif self.anthropic_client:
            return "claude"
        return "ollama_qwen3.5"

    def _clean_and_parse_json(self, text: str) -> dict:
        """Strips markdown block wraps and parses JSON safely."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        return json.loads(text)

    async def extract_tech_params_from_text(
        self, text: str, provider: str = "gemini"
    ) -> ModelExtractionResult:
        """Extracts technical 3D model properties from text content using the chosen active AI Provider."""
        active_provider = self._get_active_provider(provider)
        logger.info(
            f"Extracting technical specifications from text using AI Provider: {active_provider}"
        )

        prompt = f"""
        Extract technical parameters from the following 3D model description text.
        Return ONLY a valid JSON object matching the structure of this schema:
        {{
            "name": "string (The name of the 3D model or design)",
            "weight_g": float or null (Estimated weight/filament required in grams)",
            "filament_type": "string or null (Recommended material, e.g., PLA, PETG, ABS, TPU)",
            "print_time_minutes": int or null (Total estimated print time in minutes)",
            "nozzle_temp": int or null (Recommended nozzle temperature in °C)",
            "bed_temp": int or null (Recommended build plate temperature in °C)",
            "dimensions": "string or null (e.g. 120x120x95mm or 50x50x50mm)",
            "tech_details": {{
                "any_other_spec": "its_value"
            }}
        }}

        Source text description:
        {text[:40000]}
        """

        try:
            if active_provider == "gemini" and self.gemini_client:
                response = await self.gemini_client.aio.models.generate_content(
                    model="gemini-3.1-flash-lite",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ModelExtractionResult,
                    ),
                )
                data = json.loads(str(response.text))
                return ModelExtractionResult.model_validate(data)

            elif active_provider == "openai" and self.async_openai_client:
                response = await self.async_openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful 3D printing assistant that extracts structural and technical specifications from unstructured text into rigid JSON formats.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )
                data = json.loads(str(response.choices[0].message.content))
                return ModelExtractionResult.model_validate(data)

            elif active_provider == "claude" and self.async_anthropic_client:
                from typing import Any

                claude_text_payload: Any = [{"role": "user", "content": prompt}]
                response = await self.async_anthropic_client.messages.create(
                    model="claude-3-5-haiku-20241022",
                    max_tokens=4000,
                    messages=claude_text_payload,
                    temperature=0.1,
                )
                first_content: Any = response.content[0]
                data = self._clean_and_parse_json(str(first_content.text))
                return ModelExtractionResult.model_validate(data)

            elif active_provider in ("ollama_qwen3.5", "ollama_gemma4"):
                import ollama

                client = ollama.AsyncClient(host=self.settings.ollama_base_url)
                if active_provider == "ollama_gemma4":
                    models_to_try = [
                        self.settings.ollama_model_gemma,
                        self.settings.ollama_model_qwen,
                    ]
                else:
                    models_to_try = [
                        self.settings.ollama_model_qwen,
                        self.settings.ollama_model_gemma,
                    ]

                last_err = None
                for model_name in models_to_try:
                    if not model_name:
                        continue

                    # Strategy A: Chat with format='json'
                    try:
                        logger.info(
                            f"Ollama spec extraction: trying model {model_name} (chat, json format)"
                        )
                        messages = [
                            {
                                "role": "system",
                                "content": "You are a helpful 3D printing assistant. Extract the technical parameters. Return ONLY a valid JSON object matching the requested schema.",
                            },
                            {"role": "user", "content": prompt},
                        ]
                        response = await client.chat(
                            model=model_name,
                            messages=messages,
                            format="json",
                            options={"temperature": 0.1},
                        )
                        content = (
                            response.message.content
                            if hasattr(response, "message")
                            else (
                                response.get("message", {}).get("content", "")
                                if isinstance(response, dict)
                                else ""
                            )
                        )
                        if content and content.strip():
                            data = json.loads(content)
                            return ModelExtractionResult.model_validate(data)
                    except Exception as e:
                        logger.warning(
                            f"Ollama chat with format='json' failed on {model_name}: {e}"
                        )
                        last_err = e

                    # Strategy B: Chat without format constraint + custom json cleaning
                    try:
                        logger.info(
                            f"Ollama spec extraction: trying model {model_name} (chat, clean parse)"
                        )
                        messages = [
                            {
                                "role": "system",
                                "content": "You are a helpful 3D printing assistant. Extract the technical parameters. Return the result in a ```json ``` block matching the requested schema.",
                            },
                            {"role": "user", "content": prompt},
                        ]
                        response = await client.chat(
                            model=model_name,
                            messages=messages,
                            options={"temperature": 0.1},
                        )
                        content = (
                            response.message.content
                            if hasattr(response, "message")
                            else (
                                response.get("message", {}).get("content", "")
                                if isinstance(response, dict)
                                else ""
                            )
                        )
                        if content and content.strip():
                            data = self._clean_and_parse_json(content)
                            return ModelExtractionResult.model_validate(data)
                    except Exception as e:
                        logger.warning(
                            f"Ollama chat without format constraint failed on {model_name}: {e}"
                        )
                        last_err = e

                if last_err:
                    raise last_err
                raise ValueError(
                    "Ollama failed to return any parsable JSON spec results."
                )

        except Exception as e:
            logger.error(
                f"AI Spec Extraction failed on provider {active_provider}: {e}"
            )
            raise ValueError(f"AI Spec Extraction failed: {str(e)}")

        raise ValueError(f"Unsupported or inactive AI Provider: {active_provider}")

    async def extract_tech_params_from_image(
        self, image_bytes: bytes, mime_type: str, provider: str = "gemini"
    ) -> ModelExtractionResult:
        """Extracts technical 3D model properties from an uploaded image using the chosen active AI Provider."""
        active_provider = self._get_active_provider(provider)
        logger.info(
            f"Extracting technical specifications from image using AI Provider: {active_provider}"
        )

        # Construct basic schema instruction
        schema_instruction = """
        Analyze this 3D model image or slicer/settings screenshot.
        Extract technical parameters and return ONLY a valid JSON object matching the structure of this schema:
        {
            "name": "string (The name of the 3D model or print)",
            "weight_g": float or null (Estimated weight in grams)",
            "filament_type": "string or null (Recommended material, e.g., PLA, PETG, ABS, TPU)",
            "print_time_minutes": int or null (Total estimated print time in minutes)",
            "nozzle_temp": int or null (Recommended nozzle temperature in °C)",
            "bed_temp": int or null (Recommended build plate temperature in °C)",
            "dimensions": "string or null (e.g. 100x100x100mm)",
            "tech_details": {
                "any_other_spec": "its_value"
            }
        }
        """

        try:
            if active_provider == "gemini" and self.gemini_client:
                response = await self.gemini_client.aio.models.generate_content(
                    model="gemini-3.1-flash-lite",
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        schema_instruction,
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ModelExtractionResult,
                    ),
                )
                data = json.loads(str(response.text))
                return ModelExtractionResult.model_validate(data)

            elif active_provider == "openai" and self.async_openai_client:
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                response = await self.async_openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": schema_instruction},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}"
                                    },
                                },
                            ],
                        }
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )
                data = json.loads(str(response.choices[0].message.content))
                return ModelExtractionResult.model_validate(data)

            elif active_provider == "claude" and self.async_anthropic_client:
                from typing import Any

                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                claude_payload: Any = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": mime_type,
                                    "data": base64_image,
                                },
                            },
                            {"type": "text", "text": schema_instruction},
                        ],
                    }
                ]
                response = await self.async_anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4000,
                    messages=claude_payload,
                    temperature=0.1,
                )
                first_content: Any = response.content[0]
                data = self._clean_and_parse_json(str(first_content.text))
                return ModelExtractionResult.model_validate(data)

            elif active_provider in ("ollama_qwen3.5", "ollama_gemma4"):
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                import ollama

                client = ollama.AsyncClient(host=self.settings.ollama_base_url)
                if active_provider == "ollama_gemma4":
                    models_to_try = [
                        self.settings.ollama_model_gemma,
                        self.settings.ollama_model_qwen,
                    ]
                else:
                    models_to_try = [
                        self.settings.ollama_model_qwen,
                        self.settings.ollama_model_gemma,
                    ]

                last_err = None
                for model_name in models_to_try:
                    try:
                        logger.info(
                            f"Attempting Ollama image analysis with model: {model_name}"
                        )
                        response = await client.generate(
                            model=model_name,
                            prompt="Analyze this 3D model image or slicer screenshot. Extract the technical parameters. Return the result in a ```json ``` block matching the schema:\n"
                            + json.dumps(ModelExtractionResult.model_json_schema()),
                            images=[base64_image],
                        )
                        content = (
                            response.response
                            if hasattr(response, "response")
                            else (
                                response.get("response", "")
                                if isinstance(response, dict)
                                else ""
                            )
                        )
                        data = self._clean_and_parse_json(content or "")
                        return ModelExtractionResult.model_validate(data)
                    except Exception as ex:
                        logger.warning(
                            f"Ollama image analysis failed with model {model_name}: {ex}"
                        )
                        last_err = ex

                if last_err:
                    raise last_err

        except Exception as e:
            logger.error(
                f"AI Spec Image Extraction failed on provider {active_provider}: {e}"
            )
            raise ValueError(f"AI Spec Image Extraction failed: {str(e)}")

        raise ValueError(f"Unsupported or inactive AI Provider: {active_provider}")
