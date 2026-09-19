# NaviOps Source Code Architecture

Welcome to the **NaviOps** source code directory. This folder contains the complete full-stack implementation of the NaviOps Smart Port Operations Management & 72-Hour Combinatorial Optimization platform.

---

## 📁 Source Code Directory Structure

```
src/
├── backend/                  # FastAPI Python backend & optimization engine
│   ├── app/
│   │   ├── api/              # REST API route handlers (vessels, berths, cranes, yards, disruptions, etc.)
│   │   ├── congestion/       # Transparent 0–100 Port Congestion Index calculator
│   │   ├── core/             # Security (JWT, RBAC), configuration, and database connection
│   │   ├── models/           # Pydantic v2 data models and request/response schemas
│   │   ├── optimization/     # Google OR-Tools CP-SAT 72-hour scheduling solver
│   │   ├── services/         # Bob Copilot (Groq LLM), controlled tool layer, and conversation repo
│   │   └── main.py           # FastAPI application entry point, CORS, and exception handlers
│   ├── tests/                # Automated pytest suite (156 passing tests)
│   ├── requirements.txt      # Python dependencies manifest
│   └── .env.example          # Backend environment variable template
│
├── frontend/                 # Next.js 14 App Router frontend application
│   ├── app/                  # Application routes (overview, operations, vessels, berths, optimization, etc.)
│   ├── components/           # Reusable UI components, design system, and layouts
│   │   ├── design-system/    # Accessible badges, KPI cards, tables, modal, toast, and confirm dialog
│   │   ├── dialogs/          # Operational modals (add vessel, report disruption, update resource)
│   │   ├── layout/           # AppShell, sidebar, sticky header with dynamic congestion pill, asset tabs
│   │   └── providers/        # Global ToastProvider and ConfirmDialogProvider client wrappers
│   ├── lib/                  # Centralized API client, semantic color tokens, and utility functions
│   ├── types/                # Shared TypeScript interface and enum definitions
│   ├── package.json          # Node dependencies manifest
│   └── tailwind.config.ts    # Curated NaviOps maritime design tokens and theme configuration
│
├── database/                 # Relational database schemas and seed datasets
│   ├── schema.sql            # PostgreSQL DDL table definitions, foreign keys, and indexes
│   └── seed.sql              # Pre-seeded demo dataset (14 vessels, 5 berths, 10 cranes, 5 yards, disruptions)
│
└── .env.example              # Consolidated environment configuration reference
```

---

## ⚙️ Backend Architecture (`src/backend`)

The backend is built with **FastAPI** (Python 3.11) designed for sub-millisecond API response times and asynchronous execution.

### Key Subsystems:
1. **API Routing Layer (`app/api/`)**:
   - `auth.py`: User authentication, JWT issuance, and RBAC profile verification.
   - `dashboard.py`: Unified telemetry aggregation and live KPI calculation.
   - `vessels.py`, `berths.py`, `cranes.py`, `yards.py`: Quayside asset management and status tracking.
   - `disruptions.py`: Incident logging, severity mapping, and automatic penalty injection.
   - `optimization.py`: One-click solver triggers and schedule application endpoints.
   - `copilot.py` & `conversations.py`: Bob Copilot chat endpoints with conversation persistence.

2. **Google OR-Tools CP-SAT Solver (`app/optimization/optimizer.py`)**:
   - Models the **Berth Allocation Problem (BAP)** and **Quay Crane Assignment Problem (QCAP)** over a 72-hour planning horizon in 1-hour discrete slots.
   - Enforces physical vessel-berth length and draft compatibility, crane throughput dynamics (35 moves/hr/crane), and non-overlapping berthing intervals (`model.AddNoOverlap`).
   - Minimizes priority-weighted waiting times and unberth tardiness.

3. **Port Congestion Calculator (`app/congestion/calculator.py`)**:
   - Computes a deterministic 0–100 Congestion Index factoring anchorage queue pressure (35%), berth load (25%), crane saturation (25%), yard storage density (15%), and additive disruption severity penalties.

4. **Bob Copilot Agentic AI (`app/services/`)**:
   - High-speed conversational reasoning powered by Groq (`openai/gpt-oss-120b`).
   - Equipped with **9 controlled, strictly read-only tools** (`copilot_tools.py`) to query live port telemetry safely.
   - Multi-turn conversation persistence (`conversation_repo.py`) stored in PostgreSQL with server-side user ownership isolation.

5. **Security & RBAC (`app/core/auth.py`)**:
   - Enforces role-based permissions separating **Port Manager / Admin**, **Operations Staff**, and **Viewer / Executive**.

---

## 🖥️ Frontend Architecture (`src/frontend`)

The frontend is built with **Next.js 14** (App Router), **React 18**, **TypeScript**, and **Tailwind CSS**.

### Key Modules & Capabilities:
- **Overview Command Center (`app/page.tsx`)**: Hero banner with live 5-tier Congestion Index pill, factor breakdown bars, and 4 KPI telemetry cards.
- **Operations Control (`app/operations/page.tsx`)**: Real-time quayside monitoring table with quick berth dispatch and wait-time threshold alerts.
- **Asset Directories (`app/vessels/`, `app/berths/`, `app/cranes/`, `app/yards/`)**: Dedicated asset management tables with capacity progress indicators and status modifiers.
- **Disruption Center (`app/disruptions/page.tsx`)**: Incident logging interface that injects equipment faults and recalculates port congestion dynamically.
- **72-Hour Optimization & Gantt Timeline (`app/optimization/page.tsx`)**: Interactive timeline displaying vessel berthing intervals, disruption overlays, and one-click schedule approval.
- **Bob AI Copilot Drawer (`app/copilot/page.tsx`)**: Persistent conversational interface with tool execution progress indicators and suggestion chips.
- **Design System (`components/design-system/`)**:
  - `toast.tsx`: Centralized bottom-right toast notifications with 4.5s auto-dismiss and hover pause.
  - `confirm-dialog.tsx`: Accessible confirmation modal for destructive and high-impact actions.
  - `badge.tsx` & `lib/semantic-colors.ts`: Centralized 5-tier semantic color system preventing visual green-bias.

---

## 🗄️ Database Layer (`src/database`)

- **PostgreSQL / Supabase**: Production persistence backed by relational integrity, foreign key constraints, and performance indexes.
- **Fallback In-Memory Repository (`app/core/database.py`)**: Embedded fallback pre-seeded with identical data to ensure seamless offline hackathon evaluations when external database connections are unavailable.

---

## 🚀 Running & Verifying the Code

### 1. Backend Server
```bash
cd src/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Endpoint: [http://localhost:8000](http://localhost:8000)
- Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Development Server
```bash
cd src/frontend
npm install
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

### 3. Automated Test Suite
```bash
cd src/backend
python -m pytest tests/ -v
```
All 156 automated test cases validate REST endpoints, CP-SAT optimizer constraints, congestion math, RBAC permissions, and Copilot tools.