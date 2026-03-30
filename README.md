# InterviewOS

InterviewOS is an AI-powered interview practice platform built to help someone go from "I uploaded a resume and JD" to "I know what I need to improve next."

It combines:

- resume analysis
- job description analysis
- adaptive AI interviews
- learning paths with quizzes and XP
- a lightweight community area
- token usage tracking for LLM-heavy flows

The project has a FastAPI backend, a Next.js frontend, and PostgreSQL for storage.

## What It Does

At a high level, InterviewOS tries to cover the full prep loop:

- upload and analyze resumes
- analyze a job description and extract role context
- run an AI interview that adapts based on your answers
- score answers across confidence, correctness, depth, and clarity
- generate follow-up questions instead of random disconnected ones
- show a richer result screen with transcript, metrics, and feedback
- practice skills separately in the Learn module through quizzes and XP

There is also support for candidate guidance during interview setup, so a user can say things like:

`I know Python well, ask fewer Python questions and focus more on system design.`

## Stack

Frontend:

- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion
- Axios

Backend:

- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic v2
- JWT auth

LLM support:

- Ollama
- OpenAI
- Groq

## Project Structure

```text
interviewos/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # routes
│   │   ├── db/              # models + session
│   │   ├── services/        # interview, resume, jd, learning logic
│   │   ├── core/            # config, prompts, security
│   │   └── seed/            # learning skill/topic seed utilities
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next app routes
│   ├── components/          # shared UI
│   ├── context/             # auth context
│   └── lib/                 # axios client
└── docker-compose.yml
```

## Main Features

### 1. Resume + JD Analysis

The backend parses resumes and job descriptions, extracts role signals, and tries to identify gaps between current skills and target expectations.

### 2. Adaptive AI Interview

The interview flow is no longer just "ask a question, score it, move on."

It now supports:

- LLM-based answer evaluation
- explainable scoring
- sentence-level feedback
- follow-up question generation based on the previous answer
- adaptive difficulty
- session-level intelligence like momentum, weak areas, and topic coverage

### 3. Learn Module

The Learn section lets users practice specific skills through topic-based quizzes.

It includes:

- skill-wise topic trees
- XP and streak tracking
- leaderboard
- "Generate Similar Skills" to expand into adjacent topics
- official-style skill logos in the skill tabs

## Running the Project

### Option 1: Backend with Docker, frontend locally

This is the easiest setup if you want PostgreSQL ready quickly.

#### 1. Create a `.env` file in the project root

At minimum, you will need values like:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=interviewos

DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/interviewos
SECRET_KEY=replace-me
FRONTEND_URL=http://localhost:3000

LLM_PROVIDER=ollama
OLLAMA_URL=http://host.docker.internal:11434/api/generate
OLLAMA_MODEL=llama3.2

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

If you want to use OpenAI or Groq instead of Ollama, set the relevant provider keys too.

#### 2. Start backend + Postgres

```bash
docker compose up --build
```

Backend will be available at:

`http://localhost:8000`

Health check:

`http://localhost:8000/health`

#### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at:

`http://localhost:3000`

### Option 2: Run everything locally

If you already have PostgreSQL installed locally, you can run both apps without Docker.

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Make sure your environment variables point to your local database and backend URL.

## Seeding Learning Skills

The learning module has seed utilities for creating skills and topics.

Once the backend and database are up, you can seed data through the seed route or by using the seed script logic in:

`backend/app/seed/seed_data.py`

This is useful for setting up the Learn section with initial skills and topic trees.

## API Notes

A few important backend routes:

- `/api/v1/auth/*` for auth
- `/api/v1/resumes/*` for resume upload and analysis
- `/api/v1/jd/*` for JD analysis
- `/api/v1/interview/*` for interview start, answer submission, follow-up, and result generation
- `/api/v1/learn/*` for skills, topics, quizzes, leaderboard, and similar skill generation

The interview API includes newer adaptive routes such as:

- `POST /api/v1/interview/evaluate-answer`
- `POST /api/v1/interview/generate-followup`
- `GET /api/v1/interview/session-insights/{session_id}`

## A Few Practical Notes

- Database tables are created on backend startup through `Base.metadata.create_all(...)`
- frontend build lint is configured to be forgiving during builds, but it is still worth running lint locally while developing
- remote skill logos are loaded from `cdn.simpleicons.org`
- the interview session is intentionally designed to support long-form practice, not just 5-question mocks

## Why This Project Is Interesting

What makes this project different from a basic "AI interviewer" demo is that it is trying to be a full prep workspace, not just a chatbot.

The more interesting parts are:

- adaptive questioning instead of static prompts
- explainable scoring instead of a single vague number
- skill-learning paths connected to interview prep
- transcript-aware post-interview review
- user guidance that shapes question distribution

## Current Rough Edges

This is still an actively evolving codebase, so there are a few things you should expect:

- some modules are more polished than others
- there are places where old patterns and newer patterns coexist
- LLM quality depends heavily on your configured provider/model
- generated learning skills/topics are useful, but still model-dependent

## Contributing

If you want to improve it, good areas to work on are:

- better prompt design
- stronger topic generation and deduping
- more robust speech-to-text handling
- tighter session memory and topic balancing in interviews
- improved test coverage

## License

No license file is currently included in this repository, so treat it as private/internal unless the owner adds one.
