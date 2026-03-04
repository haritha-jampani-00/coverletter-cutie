import os
import re
import requests
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pypdf import PdfReader
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from langchain_core.prompts import ChatPromptTemplate

# ================= CONFIG =================

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "").strip()
TOGETHER_MODEL = os.getenv(
    "TOGETHER_MODEL",
    "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
)
TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"

MAX_RESUME_CHARS = 9000
MAX_JD_CHARS = 6000

LENGTH_MAP = {
    "short": 180,
    "medium": 300,
    "long": 400
}

# ================= APP =================

limiter = Limiter(key_func=get_remote_address, default_limits=["20/hour"])
app = FastAPI(title="CoverLetter Cutie API")
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded."})

# ================= HELPERS =================

def extract_pdf_text(file_bytes: bytes) -> str:
    from io import BytesIO
    reader = PdfReader(BytesIO(file_bytes))
    return " ".join(page.extract_text() or "" for page in reader.pages)

def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def fetch_jd_from_url(url: str) -> str:
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        raise HTTPException(400, "Could not fetch job description from URL.")
    return clean_text(resp.text)

def together_generate(prompt: str, max_tokens: int):
    if not TOGETHER_API_KEY:
        raise HTTPException(500, "TOGETHER_API_KEY not set")

    resp = requests.post(
        TOGETHER_API_URL,
        headers={
            "Authorization": f"Bearer {TOGETHER_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": TOGETHER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 0.9
        },
        timeout=60
    )

    if resp.status_code >= 400:
        raise HTTPException(502, resp.text[:300])

    return resp.json()["choices"][0]["message"]["content"].strip()

# ================= PROMPTS =================

skills_prompt = ChatPromptTemplate.from_template("""
Extract 6–10 relevant skills from the job description.
Return ONLY a JSON array.

Job description:
{job_description}
""")

match_prompt = ChatPromptTemplate.from_template("""
Match each skill to resume evidence.

Skills:
{skills_json}

Resume:
{resume_text}

Return ONLY a JSON object:
skill → evidence or "Not mentioned"
""")

cover_prompt = ChatPromptTemplate.from_template("""
Write a professional cover letter.

STRICT FORMAT RULES:
- No address, date, salutation, or signature
- Start directly with the opening paragraph

STYLE:
- Tone: {tone}
- Max {max_words} words
- 3–5 paragraphs
- ATS-friendly, specific, confident

CONSTRAINTS:
- Role: {role_name}
- Company: {company_name}
- Use ONLY provided skill evidence
- Do NOT invent experience

Job description:
{job_description}

Skill evidence:
{mapping_json}
""")

# ================= API =================

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate")
@limiter.limit("10/hour")
async def generate(
    request: Request,
    resume_pdf: UploadFile = File(...),
    company_name: str = Form(...),
    role_name: str = Form(...),
    tone: str = Form("professional"),
    length: str = Form("medium"),
    job_description: str | None = Form(None),
    job_description_url: str | None = Form(None),
):
    if job_description:
        job_description = job_description.strip()
    if not job_description and not job_description_url:
        raise HTTPException(400, "Provide job description text or URL.")

    if job_description_url and not job_description:
        job_description = fetch_jd_from_url(job_description_url)

    resume_bytes = await resume_pdf.read()
    resume_text = clean_text(extract_pdf_text(resume_bytes))[:MAX_RESUME_CHARS]
    job_description = clean_text(job_description)[:MAX_JD_CHARS]

    max_words = LENGTH_MAP.get(length, 300)

    skills = together_generate(
        skills_prompt.format(job_description=job_description),
        max_tokens=250
    )

    mapping = together_generate(
        match_prompt.format(skills_json=skills, resume_text=resume_text),
        max_tokens=400
    )

    letter = together_generate(
        cover_prompt.format(
            tone=tone,
            max_words=max_words,
            role_name=role_name,
            company_name=company_name,
            job_description=job_description,
            mapping_json=mapping
        ),
        max_tokens=700
    )

    return {
        "company_name": company_name,
        "cover_letter": letter,
        "skills_json": skills,
        "mapping_json": mapping,
        "word_count": len(letter.split()),
        "disclaimer": "Generated content may contain mistakes. Review before use."
    }
