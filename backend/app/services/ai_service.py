import os
import json
import logging
from typing import Dict, Optional
from firecrawl import FirecrawlApp
import ollama

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL_QWEN", "qwen3.5:latest")

        if self.firecrawl_api_key:
            self.firecrawl_app = FirecrawlApp(api_key=self.firecrawl_api_key)
        else:
            self.firecrawl_app = None
            logger.warning("FIRECRAWL_API_KEY not set. Markdown fetching will fail.")

    def fetch_markdown(self, url: str) -> Optional[str]:
        if not self.firecrawl_app:
            return None
        try:
            # scrape_url returns a dictionary with 'markdown' content
            result = self.firecrawl_app.scrape(url, formats=["markdown"])
            return result.markdown
        except Exception as e:
            logger.error(f"Error fetching markdown from Firecrawl: {e}")
            return None

    def extract_tech_params(self, markdown_content: str) -> Dict:
        prompt = f"""
        Extract technical parameters from the following 3D model description markdown.
        Return ONLY a JSON object with the following fields:
        - weight_g (float, estimated weight in grams)
        - filament_type (string, e.g. PLA, PETG, etc.)
        - print_time_minutes (int, estimated print time)
        - nozzle_temp (int, recommended)
        - bed_temp (int, recommended)
        - dimensions (string, e.g. 100x100x100mm)
        
        Markdown Content:
        {markdown_content}
        """

        try:
            response = ollama.generate(
                model=self.ollama_model, prompt=prompt, format="json", stream=False
            )
            return json.loads(response["response"])
        except Exception as e:
            logger.error(f"Error extracting parameters with Ollama: {e}")
            return {}
