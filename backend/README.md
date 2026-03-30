# InterviewOS Backend

FastAPI backend for InterviewOS. It powers auth, JD analysis, resume analysis, AI interview flows, learning APIs, community, and token usage tracking.

## Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic v2
- JWT auth
- Ollama / OpenAI / Groq

## Main Features

- User signup and login
- Job description analysis
- Resume upload and JD comparison
- Adaptive AI interview sessions
- Learn module with skills, quizzes, XP, and leaderboard
- Community comments
- Daily token usage limits

## Project Structure

```text
backend/
├── app/
│   ├── api/v1/        # route modules
│   ├── core/          # config, security, prompts
│   ├── db/            # session + models
│   ├── seed/          # learning seed utilities
│   ├── services/      # jd, resume, interview, learn logic
│   ├── utils/         # helpers
│   └── main.py        # app entrypoint
├── Dockerfile
└── requirements.txt
```

## Environment

Required:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/interviewos
SECRET_KEY=replace-me
FRONTEND_URL=http://localhost:3000
```

Optional:

```env
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DAILY_TOKEN_LIMIT=10000

LLM_PROVIDER=ollama
OLLAMA_URL=http://host.docker.internal:11434/api/generate
OLLAMA_MODEL=llama3.2

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

GROQ_API_KEY=
GROQ_MODEL=
```

## Run Locally

From repo root:

```bash
docker compose up --build
```

Or run backend only:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```text
GET /health
```

## Important Routes

- `/api/v1/auth/*`
- `/api/v1/jd/*`
- `/api/v1/resumes/*`
- `/api/v1/interview/*`
- `/api/v1/learn/*`
- `/api/v1/community/*`
- `/api/v1/dashboard/*`
- `/api/v1/tokens/*`

## Notes

- Tables are created on startup from SQLAlchemy models.
- Most feature routes currently rely on `user_id` passed by the client.
- Learn module data may need seeding before skills/topics appear.
