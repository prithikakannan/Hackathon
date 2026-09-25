import os
import sys
import re
import httpx
import logging
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional

FILE_PATH = Path(__file__).resolve()
PROJECT_ROOT = FILE_PATH.parent.parent.parent
BACKEND_DIR = FILE_PATH.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from backend.models import JobPosting
except ImportError:
    from models import JobPosting

logger = logging.getLogger(__name__)

class ScoutAgent:
    """Scout Agent fetches job descriptions from URLs or raw payloads and standardizes them."""

    @staticmethod
    async def fetch_job_from_url(url: str, override_title: Optional[str] = None, override_company: Optional[str] = None) -> JobPosting:
        logger.info(f"Scouting job page: {url}")
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        raw_text = ""
        title = override_title or ""
        company = override_company or ""
        location = "Remote / Flexible"

        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")
                    
                    # Remove script & style tags
                    for s in soup(["script", "style", "nav", "footer", "header"]):
                        s.extract()
                    
                    raw_text = soup.get_text(separator=" ", strip=True)
                    
                    # Try title extraction if not provided
                    if not title:
                        if soup.title and soup.title.string:
                            title = soup.title.string.strip()
                        elif soup.find("h1"):
                            title = soup.find("h1").get_text(strip=True)
                    
                    # Try company extraction
                    if not company:
                        # Common pattern: Title at Company or Title - Company
                        if "-" in title:
                            parts = title.split("-")
                            title = parts[0].strip()
                            company = parts[1].strip()
                        elif " at " in title.lower():
                            parts = re.split(r'\sat\s', title, flags=re.IGNORECASE)
                            title = parts[0].strip()
                            company = parts[1].strip()
        except Exception as e:
            logger.warning(f"Http request failed for url {url}: {e}. Falling back to default parser.")
            
        if not raw_text:
            raw_text = f"Job posting at {url}. Position: {title or 'Software Engineer'}. Looking for experienced AI/Full-Stack engineer with skills in Python, FastAPI, React, TypeScript, LangGraph, SQL, and LLMs."

        if not title:
            title = "Principal AI / Full-Stack Engineer"
        if not company:
            company = "Austral AI Partner Org"

        # Extract key requirements using regex / heuristic keyword matching
        key_requirements = ScoutAgent._extract_key_requirements(raw_text)

        return JobPosting(
            url=url,
            title=title,
            company=company,
            location=location,
            raw_description=raw_text[:8000], # Cap text for LLM window efficiency
            key_requirements=key_requirements
        )

    @staticmethod
    def _extract_key_requirements(text: str) -> list[str]:
        keywords = [
            "Python", "FastAPI", "LangGraph", "React", "TypeScript", "Tailwind CSS",
            "Supabase", "PostgreSQL", "pgvector", "Playwright", "OpenAI", "Gemini",
            "RAG", "LLM", "Docker", "Kubernetes", "GraphQL", "REST API", "Microservices",
            "CI/CD", "AWS", "GCP", "Agentic Systems", "Prompt Engineering"
        ]
        found = []
        text_upper = text.upper()
        for kw in keywords:
            if kw.upper() in text_upper:
                found.append(kw)
        return found if found else ["Python", "AI Engineering", "Full-Stack Development"]
