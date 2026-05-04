from pathlib import Path

from pypdf import PdfReader
from sqlalchemy.orm import Session

from models import PolicyDocument


POLICY_DIR = Path(__file__).resolve().parent / "data" / "policy_uploads"


def extract_pdf_text(file_path: Path) -> str:
    reader = PdfReader(str(file_path))
    chunks = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    return "\n".join(chunks).strip()


def get_active_policy_text(db: Session) -> str:
    docs = (
        db.query(PolicyDocument)
        .filter(PolicyDocument.is_active.is_(True))
        .order_by(PolicyDocument.created_at.desc())
        .all()
    )
    if not docs:
        return ""
    return "\n\n".join(doc.extracted_text for doc in docs if doc.extracted_text)
