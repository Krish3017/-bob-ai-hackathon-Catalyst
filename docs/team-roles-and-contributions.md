# NaviOps (ASTRA) — Team Roles & Feature Contribution Report
**Autonomous Maritime Terminal Operations System**  
*IBM & BOB AI Hackathon 2026*  
*Official Engineering Division & Feature Ownership Document*

---

## Executive Team Contribution Matrix

| Team Member | Official Role | Primary Ownership Focus | Core Technology Stack |
|---|---|---|---|
| **Smit Sureja** | Team Lead & Solutions Architect | **Main New Features & Overall System Design** (GreenPort ESG Ledger, What-If Digital Twin Sandbox Architecture, Sentinel Design) | FastAPI, OR-Tools, Next.js, System Architecture |
| **Krish** | Frontend & AI Systems Lead | **Full Frontend & AI Copilot System** (All 14 Routes, What-If Studio UI, Gantt Chart, Groq LPU LLM, Tool Calling) | Next.js 14, Tailwind CSS, Groq LPU, Agentic Tools |
| **Harshit** | Backend & Operations Research Lead | **Mathematical Optimization & CP-SAT Engine** (BAP/QCAP Solver, Simulation Solver Engine, OR-Tools Math) | Google OR-Tools, Python 3.11, CP-SAT, Discrete Math |
| **Sarthak** | Backend, Telemetry & Security Lead | **Core REST Services, Telemetry & Testing** (FastAPI Repositories, Congestion Index, Sentinel Backend, RBAC, 159 Tests) | FastAPI, Pydantic v2, Pytest, JWT/PBKDF2 |

---

## 1. Smit Sureja — Team Lead & Solutions Architect
> **Badge:** Architecture & Main Features Lead  
> **Ownership:** Overall System Architecture, Domain Modeling, and Flagship "Must-Have" Innovations

* **Full-Stack Architecture & Micro-Modular System Design:**
  * Designed the complete architectural blueprint integrating Next.js 14, FastAPI REST services, Google OR-Tools CP-SAT, and Groq LPU with zero cross-service schema corruption.
  * Formulated the domain entities: 14 vessels, 4 quayside berths, 6 STS cranes, container yards, and disruption event lifecycles.
* **GreenPort ESG & Demurrage Financial Ledger (Main Innovation):**
  * Formulated the economic equation converting raw CP-SAT wait-time reductions into hard corporate ledger metrics:
    * **Demurrage Benchmark:** $1,250 / vessel-waiting-hour saved.
    * **Environmental Benchmark:** 0.35 MT CO₂ bunker fuel emissions abated / hour.
  * Integrated financial metrics across backend schemas and frontend executive widgets.
* **"What-If" Port Digital Twin Sandbox (Core Design & Formulation):**
  * Designed the counterfactual simulation framework allowing terminal operators to stress-test crane outages and berth closures in isolated memory without mutating live operational port schedules.
* **Proactive Disruption Sentinel Architecture:**
  * Architected the real-time quayside monitoring model that flags vessels at risk of compounding delays and prescribes 1-click mitigation runbooks.
* **Production Hardening & Offline Guarantee:**
  * Engineered pre-seeded datasets, fail-safe offline fallbacks, and deployment configurations ensuring seamless evaluation without external paid APIs.

---

## 2. Krish — Frontend & AI Systems Lead
> **Badge:** UI Part & AI Part Lead  
> **Ownership:** Complete Frontend Implementation, Interactive Dashboards, and Bob Copilot AI Engine

* **Complete Next.js 14 Application & Route Architecture:**
  * Implemented and deployed all 14 application routes with full TypeScript type safety, responsive layout, and enterprise dark-mode UI.
* **Bob Copilot AI Engine & Groq LPU Integration:**
  * Integrated Groq's high-speed inference running `openai/gpt-oss-120b`, authoring specialized maritime terminal prompts with grounding guardrails.
* **Autonomous Agentic Tool-Calling Framework:**
  * Implemented the AI tool execution dispatcher supporting 10 operational tools including `get_vessels`, `get_congestion`, `log_disruption`, and the new `simulate_scenario` tool.
* **"What-If" Scenario Studio Interface (`/optimization`):**
  * Built the interactive tabbed sandbox interface featuring 1-click incident presets (*Crane CR-02 Outage*, *Berth B-01 Maintenance*, *Severe Fog*), manual disruption toggles, live simulation execution, and a 4-card counterfactual delta comparison grid.
* **72-Hour Quayside Gantt Timeline & Executive UI:**
  * Built the quayside berth timeline rendering vessel allocation windows across 4 berths and 6 STS cranes, plus the homepage Sentinel alert banner and Copilot chat UI.

---

## 3. Harshit — Backend & Operations Research Lead
> **Badge:** Mathematical Optimization & Solver Lead  
> **Ownership:** Google OR-Tools CP-SAT 72-Hour Optimization Engine & Simulation Solver

* **Google OR-Tools CP-SAT 72-Hour Optimization Engine:**
  * Formulated the exact mathematical model for the joint Berth Allocation Problem (BAP) and Quay Crane Assignment Problem (QCAP), incorporating non-overlapping spatial intervals, crane capacity, and draft constraints.
* **In-Memory Counterfactual Simulation Solver (`POST /api/optimization/simulate`):**
  * Programmed the side-effect-free simulation engine that accepts disruption overrides, executes CP-SAT in memory, and computes exact comparative deltas against the baseline schedule.
* **Mathematical Constraint Formulation:**
  * Programmed discrete interval variables, resource cumulative constraints for STS cranes, vessel arrival windows, and berth depth draft safety factors.
* **Solver Delta Computation Engine:**
  * Implemented the mathematical engine calculating changes in wait times, berth utilization, demurrage exposure, and carbon footprint deltas.
* **Optimization Endpoint Architecture:**
  * Designed high-throughput optimization execution endpoints with side-effect-free in-memory safety.

---

## 4. Sarthak — Backend Engineering, Telemetry & Security Lead
> **Badge:** Core Services, Telemetry Scanner & Quality Lead  
> **Ownership:** FastAPI Microservices, Congestion Scoring, Disruption Sentinel Telemetry, RBAC & 159-Test Suite

* **Core REST Microservices & Domain Repositories:**
  * Implemented FastAPI endpoints and repositories for Vessels, Berths, Cranes, Yards, and Disruptions with Pydantic v2 validation.
* **Congestion Index Mathematical Calculation Engine:**
  * Developed the 0–100 congestion algorithm weighting queue length, crane utilization, and turn-around delay ratios.
* **Proactive Disruption Sentinel Engine (`GET /api/disruptions/sentinel`):**
  * Implemented the quayside telemetry scanner identifying delayed vessels, aggregating financial exposure ($1,250/hr), and formulating runbook recommendations.
* **Enterprise RBAC & Authentication:**
  * Implemented PBKDF2 password hashing, JWT bearer tokens, and endpoint permissions across Admin, Operator, Port Master, and Analyst tiers.
* **159-Test Automated Verification Suite:**
  * Built and maintained the complete `pytest` suite (**159/159 passing**) covering API endpoints, data persistence, RBAC permissions, and congestion algorithms.

---

## Hackathon Presentation Defense: "Who Answers What?"

| Judge Topic / Question | Primary Speaker | Winning Key Talking Points |
|---|---|---|
| **"What makes NaviOps unique compared to traditional port software?"** | **Smit Sureja** | Explain the transition from reactive tracking to a **proactive Digital Twin** with our **GreenPort ESG ledger ($1,250/hr demurrage saved)** and **What-If Sandbox**. |
| **"Walk us through the UI and how the AI Copilot works."** | **Krish** | Demo the **Gantt timeline**, the **What-If Studio presets**, and explain the **Groq LPU tool-calling agent** executing live terminal actions without hallucination. |
| **"How does your CP-SAT solver handle complex scheduling constraints?"** | **Harshit** | Explain that **Google OR-Tools CP-SAT** solves BAP and QCAP simultaneously as an exact constraint program in ~1.2s without heuristic drift. |
| **"How do you score port congestion and secure the system?"** | **Sarthak** | Detail the **0-100 Congestion Index formula**, the **Sentinel telemetry risk scanner**, and the **PBKDF2/JWT enterprise RBAC** architecture. |

---

## Verification & Quality Sign-Off

* **Backend Test Suite:** 159 / 159 passing (`pytest tests/`)
* **Frontend Compilation:** 14 / 14 routes successfully compiled (`npm run build`)
* **Offline Guarantee:** 100% functional out-of-the-box with pre-seeded SQLite/in-memory data
