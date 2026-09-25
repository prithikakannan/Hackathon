import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Load env variables from backend/.env or root .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://fkwfalhuacublpwyilvo.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    
    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-3-small"
    DEFAULT_LLM_MODEL: str = "gpt-4o"
    
    PLAYWRIGHT_HEADLESS: bool = True
    SIMULATE_SUBMISSION: bool = True  # Safety default so Playwright fills form but waits before final click unless confirmed
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
