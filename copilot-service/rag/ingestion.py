import os
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import pypdf
import chromadb
from chromadb.config import Settings as ChromaSettings
from config import settings

def get_chroma_client():
    """
    Returns a persistent ChromaDB client using configured directory.
    """
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
    return chromadb.PersistentClient(
        path=settings.CHROMA_PERSIST_DIR,
        settings=ChromaSettings(anonymized_telemetry=False)
    )

def get_or_create_collection(client=None):
    """
    Retrieves or creates the policy vector collection.
    """
    if client is None:
        client = get_chroma_client()
    return client.get_or_create_collection(name=settings.COLLECTION_NAME)

def chunk_text(
    text: str,
    chunk_size_chars: int = 1500,
    overlap_chars: int = 200
) -> List[str]:
    """
    Chunks raw text into ~500-token (~1500 char) segments with sliding overlap.
    """
    if not text or not text.strip():
        return []
    
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para)
        if current_len + para_len > chunk_size_chars and current_chunk:
            combined = "\n\n".join(current_chunk)
            chunks.append(combined)
            # Keep tail for overlap if long enough
            if len(combined) > overlap_chars:
                current_chunk = [combined[-overlap_chars:], para]
                current_len = overlap_chars + para_len
            else:
                current_chunk = [para]
                current_len = para_len
        else:
            current_chunk.append(para)
            current_len += para_len

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks

from typing import List, Dict, Any, Optional, Tuple

def parse_iso_datetime(dt_str: Optional[str], default_future: bool = True) -> Tuple[str, int]:
    """
    Parses ISO date string into (iso_str, timestamp_int).
    """
    if not dt_str:
        if default_future:
            # 100 years in future
            dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=36500)
        else:
            dt = datetime.datetime.now(datetime.timezone.utc)
    else:
        try:
            # handle formats like 2026-08-31 or 2026-08-31T00:00:00Z
            clean = dt_str.replace("Z", "+00:00")
            dt = datetime.datetime.fromisoformat(clean)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
        except Exception:
            dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=36500)

    return dt.isoformat(), int(dt.timestamp())

def ingest_document(
    company_id: str,
    file_path: str,
    source_doc_name: Optional[str] = None,
    valid_from: Optional[str] = None,
    valid_until: Optional[str] = None,
    section_name: Optional[str] = None,
    client=None,
) -> Dict[str, Any]:
    """
    Ingests a PDF or text document into ChromaDB with multi-tenant metadata isolation.
    """
    if not company_id:
        raise ValueError("company_id is mandatory for document ingestion.")

    doc_name = source_doc_name or Path(file_path).name
    valid_from_iso, _ = parse_iso_datetime(valid_from, default_future=False)
    valid_until_iso, valid_until_ts = parse_iso_datetime(valid_until, default_future=True)

    collection = get_or_create_collection(client)
    
    chunks_to_insert = []
    metadatas_to_insert = []
    ids_to_insert = []

    path_obj = Path(file_path)
    if not path_obj.exists():
        raise FileNotFoundError(f"Source file not found: {file_path}")

    # Check file type
    if path_obj.suffix.lower() == ".pdf":
        reader = pypdf.PdfReader(file_path)
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if not page_text.strip():
                continue
            
            page_num = page_idx + 1
            page_chunks = chunk_text(page_text)
            for chunk_idx, chunk in enumerate(page_chunks):
                chunk_id = f"{company_id}_{doc_name}_p{page_num}_c{chunk_idx}_{uuid.uuid4().hex[:6]}"
                
                # Detect heading if present in first line
                first_line = chunk.strip().split("\n")[0][:80]
                sec = section_name or (first_line if first_line.isupper() or first_line.startswith("#") else f"Page {page_num}")

                chunks_to_insert.append(chunk)
                ids_to_insert.append(chunk_id)
                metadatas_to_insert.append({
                    "company_id": str(company_id),
                    "source_doc": str(doc_name),
                    "page_number": int(page_num),
                    "section": str(sec),
                    "valid_from": valid_from_iso,
                    "valid_until": valid_until_iso,
                    "valid_until_ts": int(valid_until_ts),
                })
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

        text_chunks = chunk_text(text)
        for chunk_idx, chunk in enumerate(text_chunks):
            chunk_id = f"{company_id}_{doc_name}_c{chunk_idx}_{uuid.uuid4().hex[:6]}"
            first_line = chunk.strip().split("\n")[0][:80]
            sec = section_name or (first_line if first_line.isupper() or first_line.startswith("#") else "General")

            chunks_to_insert.append(chunk)
            ids_to_insert.append(chunk_id)
            metadatas_to_insert.append({
                "company_id": str(company_id),
                "source_doc": str(doc_name),
                "page_number": 1,
                "section": str(sec),
                "valid_from": valid_from_iso,
                "valid_until": valid_until_iso,
                "valid_until_ts": int(valid_until_ts),
            })

    if chunks_to_insert:
        collection.add(
            ids=ids_to_insert,
            documents=chunks_to_insert,
            metadatas=metadatas_to_insert,
        )

    return {
        "success": True,
        "company_id": company_id,
        "source_doc": doc_name,
        "chunks_ingested": len(chunks_to_insert),
        "valid_until": valid_until_iso,
    }

def ingest_raw_text(
    company_id: str,
    text: str,
    source_doc_name: str,
    valid_from: Optional[str] = None,
    valid_until: Optional[str] = None,
    section_name: Optional[str] = None,
    client=None,
) -> Dict[str, Any]:
    """
    Directly ingest raw text chunks for a specific company tenant.
    """
    if not company_id:
        raise ValueError("company_id is mandatory for text ingestion.")

    valid_from_iso, _ = parse_iso_datetime(valid_from, default_future=False)
    valid_until_iso, valid_until_ts = parse_iso_datetime(valid_until, default_future=True)

    collection = get_or_create_collection(client)
    chunks = chunk_text(text)
    
    chunks_to_insert = []
    metadatas_to_insert = []
    ids_to_insert = []

    for idx, chunk in enumerate(chunks):
        chunk_id = f"{company_id}_{source_doc_name}_raw_{idx}_{uuid.uuid4().hex[:6]}"
        chunks_to_insert.append(chunk)
        ids_to_insert.append(chunk_id)
        metadatas_to_insert.append({
            "company_id": str(company_id),
            "source_doc": str(source_doc_name),
            "page_number": 1,
            "section": str(section_name or "Policy Section"),
            "valid_from": valid_from_iso,
            "valid_until": valid_until_iso,
            "valid_until_ts": int(valid_until_ts),
        })

    if chunks_to_insert:
        collection.add(
            ids=ids_to_insert,
            documents=chunks_to_insert,
            metadatas=metadatas_to_insert,
        )

    return {
        "success": True,
        "company_id": company_id,
        "source_doc": source_doc_name,
        "chunks_ingested": len(chunks_to_insert),
        "valid_until": valid_until_iso,
    }
