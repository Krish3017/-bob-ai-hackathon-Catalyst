# NaviOps: Complete Setup & Execution Guide

This document provides step-by-step, reproducible instructions to configure, run, test, and verify the **NaviOps Smart Port Optimization Platform** across Windows, Linux, and macOS environments.

---

## 1. System Requirements & Prerequisites

Ensure the following runtimes and tools are installed on your workstation:

| Runtime / Tool | Minimum Version | Tested Version | Verification Command |
|---|---|---|---|
| **Python** | 3.10+ | 3.11.7 | `python --version` (or `py -3.11 --version`) |
| **Node.js** | 18.0+ | 22.14.0 | `node --version` |
| **npm** | 9.0+ | 10.9.0 | `npm --version` |
| **Git** | 2.x+ | 2.44+ | `git --version` |

---

## 2. Quick Start (Windows PowerShell)

Open PowerShell in the project root directory (`-bob-ai-hackathon-Catalyst`):

### Terminal 1: Backend Setup & Launch
```powershell
# 1. Navigate to backend directory
cd src/backend

# 2. Create and activate Python virtual environment
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create environment configuration
Copy-Item .env.example .env

# 5. Start the FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend Setup & Launch
```powershell
# 1. Navigate to frontend directory
cd src/frontend

# 2. Install Node.js dependencies
npm install

# 3. Start Next.js development server
npm run dev
```

---

## 3. Quick Start (Linux / macOS Bash)

### Terminal 1: Backend Setup & Launch
```bash
# 1. Navigate to backend directory
cd src/backend

# 2. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create environment configuration
cp .env.example .env

# 5. Start the FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend Setup & Launch
```bash
# 1. Navigate to frontend directory
cd src/frontend

# 2. Install Node.js dependencies
npm install

# 3. Start Next.js development server
npm run dev
```

---

## 4. Application Endpoints & Verification

Once both servers are running, access the following URLs in your browser:

- **Frontend Command Center:** [http://localhost:3000](http://localhost:3000)
- **Backend API Root / Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive OpenAPI / Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 5. Environment Variables Reference

The backend configuration is managed via `src/backend/.env` using Pydantic Settings.

| Variable Name | Required | Default Value | Description |
|---|:---:|---|---|
| `GROQ_API_KEY` | Optional | `""` (Empty string) | API key for Groq LPU inference. When omitted, Bob Copilot operates in simulated fallback mode. |
| `GROQ_MODEL` | Optional | `openai/gpt-oss-120b` | Model identifier used by Groq API for agentic tool calling. |
| `DATABASE_URL` | Optional | `""` | Direct PostgreSQL connection string (fallback to local `SyncedTable` in-memory mode when unset). |
| `SUPABASE_URL` | Optional | `""` | Supabase project URL for cloud persistence. |
| `SUPABASE_KEY` | Optional | `""` | Supabase anonymous / service API key. |
| `JWT_SECRET` | Optional | `naviops-dev-secret-key-change-in-production-2024` | Secret key used to sign and verify HMAC-SHA256 JWT tokens. |
| `JWT_ALGORITHM` | Optional | `HS256` | Cryptographic algorithm for JWT session tokens. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | `480` | JWT token validity lifetime (8 hours by default). |

> [!NOTE]
> **Zero-Configuration Offline Evaluation:** NaviOps does not require external database credentials to evaluate. When `SUPABASE_URL` and `DATABASE_URL` are left blank, the backend automatically initializes an in-memory `SyncedTable` pre-seeded with 14 vessels, 5 berths, 10 cranes, 5 yard zones, 3 active disruptions, and 3 RBAC user accounts.

---

## 6. Pre-Seeded Demo Accounts & RBAC

The platform includes three pre-configured personas to test Role-Based Access Control (RBAC):

| Role Persona | Email Address | Password | Permissions & Capabilities |
|---|---|---|---|
| **Port Manager / Admin** | `admin@naviops.port` | `admin123` | **Full Authority:** Manage vessels, berths, cranes, yards; log and resolve disruptions; generate and **approve/apply** 72h optimization schedules; create users and change roles. |
| **Operations Staff** | `ops@naviops.port` | `admin123` | **Operational Execution:** View and update quayside telemetry; report disruptions; run candidate 72h optimization schedules. *(Restricted from approving plans or managing user roles).* |
| **Executive Viewer** | `executive@naviops.port` | `admin123` | **Strategic Read-Only:** Access real-time dashboards, Congestion Index breakdowns, 72h Gantt schedules, and reports. *(All write, edit, and deletion actions disabled).* |

> [!TIP]
> You can easily switch between roles at any time using the **Role Switcher** badge in the bottom-left corner of the sidebar, or log in via [http://localhost:3000/login](http://localhost:3000/login).

---

## 7. Automated Test Suites & Build Verification

### 7.1 Backend Automated Tests (157 Passing Tests)
The backend includes a comprehensive pytest suite covering authentication, RBAC authorization, CRUD endpoints, OR-Tools CP-SAT optimization, congestion index scoring, and agentic copilot tool calling.

To execute the test suite:
```powershell
# From src/backend with virtualenv activated
pytest tests/ -v
```

Expected output:
```
============================== 157 passed in 24.31s ==============================
```

### 7.2 Frontend Production Build Check
To verify that all 14 Next.js routes, TypeScript interfaces, and Tailwind styles compile cleanly without errors:
```powershell
# From src/frontend
npm run build
```

Expected output:
```
✓ Compiled successfully
✓ Generating static pages (14/14)
✓ Finalizing page optimization
```

---

## 8. Guided Evaluation Walkthrough

Follow these steps to evaluate the end-to-end capabilities of NaviOps:

### Step 1: Real-Time Congestion Diagnostic
1. Open [http://localhost:3000](http://localhost:3000).
2. Review the **Overview Command Center**:
   - Observe the **Port Congestion Index** gauge (0–100) and the four underlying diagnostic factors (Anchorage Queue, Berth Occupancy, Crane Saturation, Yard Density).
   - Notice the breakdown cards showing 14 Vessels, 5 Berths, 10 Cranes, and 5 Yard Zones.

### Step 2: Injecting an Operational Disruption
1. Navigate to **Disruptions** (`/disruptions`) via the left sidebar.
2. Click **Report Incident**:
   - Select Type: `Equipment Fault`.
   - Affected Asset: `CR-02` (Ship-to-Shore Crane 2).
   - Severity: `High`.
   - Description: `Motor drive overheating on Crane CR-02; quay operations suspended`.
3. Submit the incident.
4. Notice that the **Congestion Index** immediately updates, reflecting an additive **+5 point High Disruption penalty**, and Crane CR-02 status transitions to `Maintenance`.

### Step 3: Running the Google OR-Tools 72h Optimization Engine
1. Navigate to **Optimization** (`/optimization`).
2. Click **Generate Optimized 72-Hour Plan**.
3. Observe the Google OR-Tools CP-SAT solver executing in the background:
   - Resolves all non-overlapping berth intervals over the next 72 hours.
   - Enforces physical length and draft compatibility constraints.
   - Re-allocates crane handling moves while excluding the disabled Crane CR-02.
   - Minimizes priority-weighted vessel delay.
4. Inspect the interactive **72-Hour Gantt Timeline**:
   - Vessels appear as color-coded blocks across berths B-01 through B-05.
   - View the calculated **Total Wait Time Reduction** and **Average Turnaround Improvement**.
5. As an Admin user (`admin@naviops.port`), click **Approve & Apply Plan** to lock in the operational schedule.

### Step 4: Interacting with Bob Copilot (Agentic AI)
1. Navigate to **Bob Copilot** (`/copilot`).
2. Try asking operational questions:
   - *"What is our current port congestion score and what factors are driving it?"*
   - *"Which berths are currently available for a vessel with a 320-meter length?"*
   - *"List all vessels waiting at anchorage ordered by priority."*
   - *"Which cranes are currently offline due to disruptions?"*
3. Notice that Bob Copilot calls internal tools (`get_congestion_status`, `get_berths`, `get_waiting_vessels`, `get_active_disruptions`) and responds with verified, live terminal metrics.
4. Try typing: *"Can you run an optimization to resolve the anchorage backlog?"*
   - Bob Copilot detects an action request, calls `run_optimization`, and presents a confirmation card with wait-time reduction metrics before proceeding.

### Step 5: User Administration & Role Management
1. Navigate to **Users & Roles** (`/users`).
2. Click **Add New User**:
   - Create a user (e.g., `dispatcher@naviops.port`, Role: `Operations Staff`).
   - The user is instantly registered via the backend API and appears in the directory table.
3. Test modifying a user's role using the interactive role selector:
   - Switch a user between `Operations Staff`, `Executive Viewer`, and `Port Manager`.
   - Notice safety guards: the system automatically prevents demoting the sole remaining administrator.

---

## 9. Troubleshooting & FAQ

### Issue: Port 8000 or 3000 is already in use
- **Symptom:** `ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)` or `Port 3000 is in use, trying 3001 instead`.
- **Resolution (Windows):**
  ```powershell
  # Find process using port 8000
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  # Find process using port 3000
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```
- **Resolution (Linux/macOS):**
  ```bash
  lsof -ti:8000 | xargs kill -9
  lsof -ti:3000 | xargs kill -9
  ```

### Issue: PowerShell virtualenv script execution error
- **Symptom:** `File Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Resolution:**
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\.venv\Scripts\Activate.ps1
  ```

### Issue: 401 Unauthorized when accessing protected routes
- **Symptom:** API returns 401 Unauthorized; frontend redirects to `/login`.
- **Resolution:** Your session token has expired or has not been initialized.
  1. Go to [http://localhost:3000/login](http://localhost:3000/login).
  2. Log in using `admin@naviops.port` and password `admin123`.
  3. Tokens are automatically stored in `localStorage` and sent with subsequent API requests.

### Issue: Bob Copilot displays "Bob Copilot is not configured"
- **Symptom:** Bob Copilot message states that Groq API key is missing.
- **Resolution:**
  1. Open `src/backend/.env`.
  2. Ensure `GROQ_API_KEY=gsk_...` is populated with a valid Groq key.
  3. Ensure `GROQ_MODEL=openai/gpt-oss-120b` (or another valid Groq model such as `llama-3.3-70b-versatile`).
  4. Restart the backend server (`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`).
