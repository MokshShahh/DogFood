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

##  Local Testing & Verification

To run backend tests locally:

```bash
cd backend
python manage.py test users
```

To run frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
```
