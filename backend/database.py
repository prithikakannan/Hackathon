import os
import sys
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from supabase import create_client, Client

# Add project root and backend dir to sys.path
FILE_PATH = Path(__file__).resolve()
PROJECT_ROOT = FILE_PATH.parent.parent
BACKEND_DIR = FILE_PATH.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from backend.config import settings
    from backend.models import ResumeChunk, JobApplicationResponse, ApplicationStatus
except ImportError:
    from config import settings
    from models import ResumeChunk, JobApplicationResponse, ApplicationStatus

logger = logging.getLogger(__name__)

# Initialize Supabase Client if credentials are provided
supabase: Optional[Client] = None
try:
    if settings.SUPABASE_URL and settings.SUPABASE_KEY and "xyzcompany" not in settings.SUPABASE_URL:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info("Supabase client initialized successfully.")
    else:
        logger.warning("Supabase credentials not set or using placeholder. Fallback in-memory/mock storage enabled.")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")

# In-memory storage fallback for local development & testing without live Supabase
_in_memory_db: Dict[str, Dict[str, Any]] = {}
_in_memory_resume_chunks: List[Dict[str, Any]] = []

async def get_embedding(text: str) -> List[float]:
    """Generates text embedding vector using OpenAI, Gemini or deterministic fallback."""
    text_clean = text.replace("\n", " ").strip()
    
    if settings.OPENAI_API_KEY:
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            res = await client.embeddings.create(
                input=[text_clean],
                model=settings.DEFAULT_EMBEDDING_MODEL
            )
            return res.data[0].embedding
        except Exception as err:
            logger.warning(f"OpenAI embedding generation failed, using mock embedding: {err}")

    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            result = genai.embed_content(
                model="models/embedding-001",
                content=text_clean
            )
            emb = result['embedding']
            # Resize or pad to 1536 if necessary for consistency
            if len(emb) < 1536:
                emb = emb + [0.0] * (1536 - len(emb))
            return emb[:1536]
        except Exception as err:
            logger.warning(f"Gemini embedding generation failed: {err}")

    # Deterministic fallback vector generation based on character frequencies (1536 dimensions)
    logger.info("Using deterministic vector embedding generator for local execution.")
    import math
    vec = [0.0] * 1536
    for i, char in enumerate(text_clean[:1536]):
        idx = (ord(char) * (i + 1)) % 1536
        vec[idx] += math.sin(i) * 0.1
    # Normalize vector
    norm = math.sqrt(sum(x*x for x in vec)) or 1.0
    return [x / norm for x in vec]

async def save_master_resume_chunks(chunks: List[Dict[str, Any]]) -> bool:
    """Embeds and saves master resume chunks to pgvector database."""
    global _in_memory_resume_chunks
    processed_chunks = []
    
    for idx, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        category = chunk.get("category", "experience")
        meta = chunk.get("metadata", {})
        
        embedding = await get_embedding(content)
        row = {
            "chunk_index": idx,
            "category": category,
            "content": content,
            "metadata": meta,
            "embedding": embedding
        }
        processed_chunks.append(row)
        _in_memory_resume_chunks.append(row)

    if supabase:
        try:
            # Delete existing resume chunks first
            supabase.table("master_resume_chunks").delete().neq("chunk_index", -1).execute()
            supabase.table("master_resume_chunks").insert(processed_chunks).execute()
            logger.info(f"Successfully inserted {len(processed_chunks)} resume chunks into Supabase pgvector.")
            return True
        except Exception as e:
            logger.error(f"Error inserting into Supabase master_resume_chunks: {e}")
    
    logger.info(f"Stored {len(processed_chunks)} resume chunks in memory.")
    return True

async def search_resume_chunks(query_text: str, top_k: int = 5) -> List[ResumeChunk]:
    """Queries master resume chunks using vector cosine similarity via RPC."""
    query_vector = await get_embedding(query_text)
    
    if supabase:
        try:
            response = supabase.rpc(
                "match_resume_chunks",
                {
                    "query_embedding": query_vector,
                    "match_threshold": 0.1,
                    "match_count": top_k
                }
            ).execute()
            
            results = []
            for item in response.data:
                results.append(ResumeChunk(
                    id=str(item.get("id", "")),
                    chunk_index=item.get("chunk_index", 0),
                    category=item.get("category", "general"),
                    content=item.get("content", ""),
                    metadata=item.get("metadata", {}),
                    similarity=float(item.get("similarity", 0.0))
                ))
            return results
        except Exception as e:
            logger.error(f"Supabase RPC match_resume_chunks failed: {e}. Falling back to in-memory vector search.")

    # In-memory vector similarity calculation fallback
    import math
    def cosine_similarity(v1, v2):
        dot = sum(a * b for a, b in zip(v1, v2))
        n1 = math.sqrt(sum(a * a for a in v1)) or 1.0
        n2 = math.sqrt(sum(b * b for b in v2)) or 1.0
        return dot / (n1 * n2)

    scored_chunks = []
    for item in _in_memory_resume_chunks:
        sim = cosine_similarity(query_vector, item["embedding"])
        scored_chunks.append((sim, item))
        
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    results = []
    for sim, item in scored_chunks[:top_k]:
        results.append(ResumeChunk(
            id=str(item.get("chunk_index")),
            chunk_index=item.get("chunk_index", 0),
            category=item.get("category", "general"),
            content=item.get("content", ""),
            metadata=item.get("metadata", {}),
            similarity=float(sim)
        ))
    return results

async def save_job_application(record: Dict[str, Any]) -> str:
    """Creates a new job application record."""
    import uuid
    app_id = record.get("id") or str(uuid.uuid4())
    record["id"] = app_id
    
    if supabase:
        try:
            supabase.table("job_applications").insert(record).execute()
            return app_id
        except Exception as e:
            logger.error(f"Failed to insert into Supabase job_applications: {e}")
            
    _in_memory_db[app_id] = record
    return app_id

async def update_job_application(app_id: str, updates: Dict[str, Any]) -> bool:
    """Updates an existing job application record."""
    if supabase:
        try:
            supabase.table("job_applications").update(updates).eq("id", app_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to update Supabase job_application {app_id}: {e}")
            
    if app_id in _in_memory_db:
        _in_memory_db[app_id].update(updates)
        return True
    return False

async def get_job_application(app_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves job application record by ID."""
    if supabase:
        try:
            res = supabase.table("job_applications").select("*").eq("id", app_id).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Error fetching job application from Supabase: {e}")
            
    return _in_memory_db.get(app_id)

async def list_job_applications() -> List[Dict[str, Any]]:
    """Lists all job applications."""
    if supabase:
        try:
            res = supabase.table("job_applications").select("*").order("created_at", desc=True).execute()
            return res.data
        except Exception as e:
            logger.error(f"Error listing job applications from Supabase: {e}")
            
    return list(_in_memory_db.values())
