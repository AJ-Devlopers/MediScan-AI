# MediScan AI

> **AI-powered medical report analysis system** — extracts, interprets, and explains lab reports using LLMs, RAG, and multi-agent pipelines.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=flat&logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA3-FF6B35?style=flat)
![LangGraph](https://img.shields.io/badge/LangGraph-Agents-4A90D9?style=flat)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-8B5CF6?style=flat)

---

## What It Does

MediScan AI takes a patient's PDF lab report and runs it through three independent AI modules, each building on the last:

| Module | Name | What it does |
|--------|------|-------------|
| **M1** | Report Extractor | Parses the PDF, extracts every test value, compares against normal ranges, scores overall health, and generates suggestions |
| **M2** | RAG Knowledge | Answers natural-language questions about medical conditions using a vector knowledge base |
| **M3** | AI Agents | Runs a LangGraph multi-agent pipeline — Warning Agent → Comparator Agent → Suggestion Agent |
| **Dashboard** | Full Pipeline | Combines all three modules in a single run |


## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web framework** | FastAPI + Uvicorn |
| **Templating** | Jinja2 |
| **LLM provider** | Groq (LLaMA 3) |
| **PDF parsing** | PyMuPDF (fitz) |
| **Embeddings** | Sentence-Transformers |
| **Vector store** | ChromaDB |
| **Agent framework** | LangGraph + LangChain |
| **PDF generation** | ReportLab |
| **Database** | SQLAlchemy |
| **Frontend** | Vanilla JS + CSS custom properties |
| **Fonts** | Inter · JetBrains Mono · Playfair Display |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/medical-ai-system.git
cd medical_ai_system
```

### 2. Create and activate a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your free Groq API key at [console.groq.com](https://console.groq.com).

### 5. Run the server

```bash
uvicorn app.main:app --reload
```

Open your browser at **http://127.0.0.1:8000**

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Module 1 — Report Extractor page |
| `POST` | `/upload` | Upload a PDF and run M1 pipeline |
| `GET` | `/module2` | Module 2 — RAG Knowledge page |
| `POST` | `/module2/ask` | Ask a medical question (returns JSON) |
| `GET` | `/module3` | Module 3 — AI Agents page |
| `POST` | `/module3/analyze` | Upload PDF and run agent pipeline |
| `GET` | `/dashboard` | Full Dashboard page |
| `POST` | `/analyze-full` | Run all three modules combined |

---

## Module 1 — Report Extractor

**Pipeline flow:**

```
PDF Upload
    │
    ▼
pdf_extractor.py       — Extracts raw text using PyMuPDF
    │
    ▼
patient_extractor.py   — Pulls name, age, gender, doctor, date, lab
    │
    ▼
groq_service.py        — Sends text to Groq LLaMA3, gets structured JSON
    │
    ▼
comparator.py          — Compares each value to normal_ranges.json
    │
    ▼
categorizer_ai.py      — Groups tests (CBC, Lipid Panel, Metabolic, etc.)
    │
    ▼
suggestion_service.py  — Generates human-readable health suggestions
    │
    ▼
Health Score           — score = 100 − (HIGH×5) − (LOW×2), clamped 0–100
```

**Output shape:**

```python
{
  "patient":     { "name", "age", "gender", "lab", "date", "doctor" },
  "summary":     { "score", "high", "low", "normal" },
  "data":        [ { "name", "value", "unit", "normal_range", "status", "category", "subcategory" } ],
  "suggestions": [ "..." ]
}
```

---

## Module 2 — RAG Knowledge

Uses **ChromaDB** + **Sentence-Transformers** to embed a curated medical knowledge base. When a user asks a question, the system retrieves the most relevant passages and sends them with the question to Groq for a grounded answer.

```
User Question
    │
    ▼
Sentence-Transformers  — Embeds the question
    │
    ▼
ChromaDB retriever     — Top-K similarity search
    │
    ▼
Groq LLaMA3            — Answers using retrieved context
    │
    ▼
JSON response          — { "answer": "..." }
```

---

## Module 3 — AI Agents

A **LangGraph** state machine with three sequential agents:

```
PDF Upload
    │
    ▼
Extractor Agent    — Pulls structured test data from the report
    │
    ▼
Warning Agent      — Flags values that exceed critical thresholds
    │
    ▼
Comparator Agent   — Benchmarks values against population norms
    │
    ▼
Suggestion Agent   — Synthesises final clinical recommendations
```

---

## UI Features

- **Dark / Light theme toggle** — persisted in `localStorage`, zero page reload
- **Drag & drop PDF upload** with instant filename preview
- **Animated health score ring** (SVG stroke-dashoffset)
- **Staggered table row animations** on results load
- **Live RAG chat** with typing indicator (Module 2)
- **Step-by-step loading overlay** with animated progress during AI processing
- **Fully responsive** down to mobile

---

## Running Tests

```bash
# Run all tests
pytest tests/

# Run individual module tests
pytest tests/test_module1.py -v
pytest tests/test_module2.py -v
pytest tests/test_module3.py -v
pytest tests/test_combined.py -v
```

---

## Docker Deployment

```bash
# Build and run with Docker Compose
cd devops
docker-compose up --build

# Or build manually
docker build -f devops/Dockerfile -t mediscan-ai .
docker run -p 8000:8000 --env-file .env mediscan-ai
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key for LLaMA3 access |

---

## Important Notes

- **Medical disclaimer** — This system is for research and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a licensed physician.
- The `uploads/` folder is created automatically on first run.
- The ChromaDB vector store is persisted in `chroma_db/` — delete this folder to reset the knowledge base.
- Never commit your `.env` file — add it to `.gitignore`.

---

## .gitignore Recommendation

```gitignore
venv/
__pycache__/
*.pyc
.env
uploads/
outputs/
chroma_db/
*.db
.DS_Store
```

---

## License

This project is for educational and research use. See `LICENSE` for details.

---

*Built with FastAPI · Groq · LangGraph · ChromaDB · Sentence-Transformers*
