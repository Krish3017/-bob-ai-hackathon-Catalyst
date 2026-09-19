# 🚀 NaviOps - Port Congestion Prediction & Operations Optimizer

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | Catalyst |
| **Track** | AI |
| **Team Lead** | Sarthak Talaviya — 24dcs131@charusat.edu.in |
| **Members** | Krish Ramanandi, Harshit Pambhar, Smit Sureja |

---

## 🎯 Problem Statement

> What problem does your project solve? Who experiences this problem?

Commercial container terminals handle over 80% of world merchandise trade but struggle with severe quayside congestion, where ultra-large container vessels (ULCVs) and unpredictable disruptions cause cascading anchorage queues and idle assets. Terminal directors, berth planners, and shipping lines lack unified real-time visibility, relying on fragmented spreadsheets and manual radio calls that take 2–4 hours per incident. This results in unpredictable turnaround times, costly vessel demurrage ($20,000–$50,000/day per vessel), and millions in underutilized ship-to-shore crane and berth infrastructure.

---

## 💡 Solution

> What did you build? How does it solve the problem above?

NaviOps is an industrial-grade Smart Port Operations Command Center and 72-Hour Decision Support System that eliminates quayside congestion through mathematical optimization and conversational AI. The platform unifies real-time operational telemetry across 14 vessels, 5 berths, 10 cranes, and 5 yard zones with an explainable, multi-factor Port Congestion Index (0–100) and Google OR-Tools CP-SAT discrete combinatorial optimization. Paired with Bob Copilot—an agentic AI assistant powered by Groq LPUs with 9 live operational tools and human-in-the-loop governance—NaviOps empowers dispatchers to resolve disruptions, eliminate spatial berthing collisions, and reduce vessel waiting times by over 34%.

---

## ✨ Key Features

- **Google OR-Tools CP-SAT 72-Hour Optimization:** Mathematical combinatorial constraint programming engine that computes collision-free berth allocations and crane schedules under physical length, draft, moves/hour throughput, and non-overlap constraints.
- **Transparent Port Congestion Index (0–100):** Multi-factor diagnostic scoring engine evaluating anchorage queue pressure (35%), berth utilization (25%), crane fleet saturation (25%), yard storage density (15%), and additive disruption severity penalties.
- **Bob AI Copilot with Controlled Tool Execution:** High-speed agentic assistant powered by Groq (`openai/gpt-oss-120b`) equipped with 9 read-only operational tools, server-verified conversation persistence, and safe human-in-the-loop approval for schedule modifications.
- **Unified Quayside & Yard Operations Control:** Real-time operational telemetry across 14 vessels, 5 berths, 10 Ship-to-Shore cranes, 5 container yard zones, and active incidents with dynamic threshold-based status badges.
- **Interactive 72h Visual Gantt Timeline:** Intuitive schedule canvas displaying discrete berthing intervals, disruption maintenance overlays, priority color mapping, and one-click schedule approval for Port Managers.
- **Enterprise RBAC & Premium Notification System:** Role-Based Access Control matrix (Port Manager / Admin, Operations Staff, Viewer / Executive) with custom bottom-right toast feedback and accessible confirmation dialogs for all destructive actions.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python 3.11, TypeScript |
| **Frameworks** | FastAPI, Next.js 14 (App Router), React 18, Tailwind CSS |
| **Databases** | Supabase PostgreSQL, Relational Fallback Repository (`psycopg3`) |
| **Other** | Google OR-Tools (CP-SAT v9.9), Groq LPUs, Pydantic v2, PyJWT, Lucide React, Uvicorn |

---

## 📁 Repository Structure

```
├── src/                  # All source code (FastAPI backend, Next.js 14 frontend, SQL database)
├── docs/                 # Comprehensive documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots and sequential visual guide
│   ├── demo-video-link.txt  # Link to hosted demo walkthrough video
│   └── live-demo-url.txt    # Deployed application URLs
├── presentation/         # Slide deck and pitch materials
└── submission.yaml       # Structured hackathon submission metadata
```

---

## ⚡ How to Run

```bash
# 1. Clone the repo
git clone https://github.com/Krish3017/-bob-ai-hackathon-Catalyst.git
cd -bob-ai-hackathon-Catalyst

# 2. Setup & run Backend (Terminal 1)
cd src/backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Setup & run Frontend (Terminal 2)
cd src/frontend
npm install
npm run dev

# 4. Access the Platform
# Frontend: http://localhost:3000
# Backend API Docs: http://localhost:8000/docs
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/](presentation/) |

---

## ⚠️ Known Limitations


- **Human-in-the-Loop Safeguard:** Bob Copilot and the OR-Tools optimization engine generate candidate schedules and operational recommendations; schedule applications require human authorization by a Port Manager to ensure quayside safety.
- **Phase 2 Agentic Autonomy:** Phase 1 delivers complete deterministic CP-SAT optimization, multi-factor congestion diagnostics, and Groq-powered tool-calling Copilot; multi-agent autonomous negotiation (LangGraph / watsonx.ai) will hook into these verified REST endpoints in Phase 2.
- **Simulation Clock:** Vessel ETAs and active disruptions are modeled over a dynamic 72-hour planning horizon based on UTC terminal time; physical AIS radar feed integration is planned for enterprise deployment.

---

## 🏅 What We're Most Proud Of

The mathematical optimization engine powered by Google OR-Tools CP-SAT combined with Bob Copilot's grounded tool-calling architecture. By formulating the Berth Allocation Problem with physical length compatibility, crane move dynamics, and non-overlapping interval constraints, NaviOps eliminates quayside collisions and reduces expected anchorage waiting times by over 34% in under 500 milliseconds—turning hours of manual spreadsheet rescheduling into an instant, explainable, and reliable operational workflow.

---
