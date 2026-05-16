from functools import lru_cache
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

    # Server Configuration
    ip_address: str = "0.0.0.0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
