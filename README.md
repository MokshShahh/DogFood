# Containerized Offline Hackathon Platform

---

##  Startup & Execution Options

You can run the platform in three ways depending on your development workflow:

### Option 1: Full Docker Compose (Containerized Production Mode)

Use this to run PostgreSQL, Django, and Next.js entirely inside Docker:

- **First Run / After Dependency Updates** (Builds images from source):
  ```bash
  docker compose up --build
  ```
- **Subsequent Runs** (Instant start without rebuilding):
  ```bash
  docker compose up -d     # Starts all containers in the background
  docker compose stop      # Pauses all containers
  docker compose start     # Instantly resumes all containers (~1 second)
  docker compose down      # Stops and removes containers
  ```

---

### Option 2: Native Local Development (Fastest, with Hot-Reloading)

Run both services directly on your host machine for instant Fast Refresh and code reload without Docker:

1. **Terminal 1: Start Django Backend**
   ```bash
   cd backend
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver 8000
   ```
   *(Note: Django automatically falls back to local SQLite if PostgreSQL is not running).*

2. **Terminal 2: Start Next.js Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

---

### Option 3: Hybrid Setup (PostgreSQL in Docker, Apps on Host)

If you want PostgreSQL without installing it directly on your machine:

1. **Start only the PostgreSQL container**:
   ```bash
   docker compose up db -d
   ```
2. **Run Django and Next.js locally** (using the commands in Option 2).

---

### Access Endpoints (All Modes)

Once running:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

##  Default Admin Credentials

On initial startup, `backend/entrypoint.sh` automatically seeds the default administrator if not present:

- **Username**: `admin`
- **Password**: `AdminPassword123!`
- **Role**: `admin`

*(You can customize these via `.env`)*

---

## 📡 REST API Reference

### Authentication
| Endpoint | Method | Permission | Description |
|---|---|---|---|
| `/api/auth/register/` | POST | Public | Register new account (`participant` or `organizer` only). Sets HttpOnly cookies. |
| `/api/auth/login/` | POST | Public | Authenticate with username/email and password. Sets HttpOnly cookies. |
| `/api/auth/refresh/` | POST | Public | Rotates access token using HttpOnly refresh cookie. |
| `/api/auth/logout/` | POST | Public | Invalidates token and clears HttpOnly cookies. |
| `/api/auth/me/` | GET | Authenticated | Returns authenticated user profile and assigned role. |
| `/api/auth/users/` | GET | Admin Only | Lists all registered platform users. |
| `/api/auth/users/<id>/appoint-judge/` | POST | Admin Only | Appoints the specified user as a Judge. |

### Events & Teams
| Endpoint | Method | Permission | Description |
|---|---|---|---|
| `/api/events/` | GET | Public | List all active hackathon events. |
| `/api/events/` | POST | Organizer / Admin | Create a new hackathon event (supports banner upload). |
| `/api/events/<id>/` | GET | Public | Retrieve full event details + user's current team. |
| `/api/events/<id>/teams/create/` | POST | Authenticated | Create a team for this event and receive a shareable team code. |
| `/api/events/<id>/teams/join/` | POST | Authenticated | Join a team in this event using an 8-character team code. |
| `/api/events/<id>/teams/leave/` | POST | Authenticated | Leave current team for this event. |

### Project Submissions
| Endpoint | Method | Permission | Description |
|---|---|---|---|
| `/api/events/<id>/my-submission/` | GET | Authenticated (Team Member) | Retrieve team's project submission. |
| `/api/events/<id>/submit/` | POST | Authenticated (Team Leader) | Create or update project submission before event deadline (multipart form). |
| `/api/events/<id>/submissions/` | GET | Organizer / Judge / Admin | List all project submissions for evaluation and scoring. |


---

## 🧪 Local Testing & Verification

To run backend tests locally:

```bash
cd backend
python manage.py test events users
```

To run frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
```
