from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    # Database Configuration
    database_url: str = "sqlite:///./3d_management.db"

    # Bambu Lab Printer Configuration
    bambu_printer_ip: str = ""
    bambu_printer_serial: str = ""
    bambu_printer_access_code: str = ""

    # AI Configuration
    firecrawl_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    ollama_model_qwen: str = "qwen3.5:latest"
    ollama_model_gemma: str = "gemma4:latest"
    gemini_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    default_ai_provider: str = "gemini"

    # Server Configuration
    ip_address: str = "0.0.0.0"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @classmethod
    @field_validator("allowed_origins", mode="before")
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
