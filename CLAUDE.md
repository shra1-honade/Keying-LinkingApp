# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BizMatch is a B2B SaaS application for Equifax that enables customers to map data columns, run matching jobs, and analyze results against Equifax's business reference dataset. The codebase is a full-stack application with a FastAPI backend and React/TypeScript frontend.

## Running the Application

### Backend (FastAPI + SQLite)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn faker

# Seed the database (creates bizmatch.db and populates test data)
python seed.py

# Start the API server
uvicorn main:app --reload --port 8000
```
Backend runs on http://localhost:8000

### Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

## Architecture

### Backend Structure

**Single-file API pattern**: The entire FastAPI application lives in `backend/main.py` (~313 lines). This is intentionally minimal to demonstrate patterns for future Snowflake integration.

**Database abstraction**: `backend/database.py` provides a context manager (`get_db()`) that handles connection lifecycle. This pattern allows easy swapping from SQLite to Snowflake:
- SQLite uses `sqlite3.connect(DATABASE_PATH)`
- Future: Replace with `snowflake.connector.connect(...)` without changing API endpoints

**Schema**: 4 tables defined in `database.py`:
- `configs` - Connection and column mapping configurations (JSON stored as TEXT)
- `runs` - Job execution records with status tracking
- `match_results` - Individual match records (many-to-one with runs)
- `reference_businesses` - Mock EFX reference data (1000 records)

**Matching logic**: Currently in `main.py:create_run()` (lines 109-188). Demonstrates the pattern:
```python
# Current: Simple SQLite query
cursor.execute("SELECT * FROM reference_businesses LIMIT 100")

# Future: Snowflake stored procedure
snowflake_cursor.execute("CALL match_business_procedure(?)", (config_id,))
```

### Frontend Structure

**State management**: Uses TanStack Query (v5) for server state - no Redux/Context needed. All API calls are wrapped in React Query hooks with automatic caching, refetching, and loading states.

**API layer**: `frontend/src/lib/api.ts` centralizes all API calls via axios. Exports namespaced functions:
- `configsApi.getAll()`, `configsApi.create()`
- `runsApi.getAll()`, `runsApi.getById()`, `runsApi.create()`, `runsApi.getResults()`, `runsApi.download()`

**Type safety**: `frontend/src/types/index.ts` defines all TypeScript interfaces. Zero `any` types throughout codebase. Key types:
- `Run`, `Config`, `MatchResult` mirror backend Pydantic models
- `PaginatedResults<T>` generic for paginated API responses
- `RunStatus` union type ensures exhaustive status handling

**Routing**: React Router v6 with routes defined in `App.tsx`:
- `/runs` - My Runs page (default)
- `/runs/new` - New Run form
- `/runs/:id/analysis` - Match Analysis page
- `/configs` - Configurations page

**Component organization**:
- `components/ui/` - Reusable primitives (Button, Card, Badge) with Tailwind variants
- `components/layout/` - App shell (Sidebar, Topbar, AppLayout)
- `components/features/` - Feature-specific components (if any)
- `pages/` - Route pages that compose UI and layout components

**Styling**: Tailwind CSS with custom EFX brand tokens in `tailwind.config.ts`:
- `efx-navy` (#003087) - Primary actions, navigation highlights
- `efx-red` (#E31837) - Danger actions, alerts
- `efx-blue` (#0066CC) - Interactive elements, links
- `efx-gray-*` - Custom gray scale for backgrounds, borders, text

**Auto-refresh pattern**: The Runs page uses React Query's `refetchInterval` to poll every 10 seconds when any run has status `in_progress`. This ensures real-time updates without WebSockets.

## Database Seeding

The `backend/seed.py` script must be run after `database.py:init_db()` creates tables. It populates:
- 1000 reference businesses (mock EFX data using Faker)
- 10 pre-configured mappings with various column combinations
- 20 sample runs (mix of completed, in_progress, error states)
- 2000 match results (~70% match rate average)

**Important**: If you modify the schema in `database.py`, delete `backend/bizmatch.db` and re-run `seed.py` to recreate with new schema.

## API Patterns

All endpoints follow `/api/v1/<resource>` convention with CORS configured for localhost:5173 and localhost:3000.

**Pagination**: The `/runs/{id}/results` endpoint supports:
- `page` (default: 1), `page_size` (default: 25, max: 100)
- `min_score` (0-5 confidence filter)
- `search` (LIKE query on business names)
- `show_unmatched` (filter for confidence_score = 0)

Response format:
```json
{
  "results": [...],
  "total": 2000,
  "page": 1,
  "page_size": 25,
  "total_pages": 80
}
```

**CSV download**: `/runs/{id}/download` returns JSON with `filename` and `content` (CSV string). Frontend triggers browser download via `Blob` and `URL.createObjectURL`.

## Development Workflows

### Adding a new API endpoint
1. Add endpoint function to `backend/main.py`
2. Use `with get_db() as conn:` context manager for database access
3. Define Pydantic models for request/response at top of file
4. Add corresponding function to `frontend/src/lib/api.ts`
5. Update `frontend/src/types/index.ts` if new types are needed
6. Create React Query hook in the page component that uses it

### Modifying database schema
1. Update table definition in `database.py:init_db()`
2. Delete `backend/bizmatch.db`
3. Run `python backend/seed.py` to recreate database with new schema
4. Update Pydantic models in `backend/main.py` if API contracts change
5. Update TypeScript interfaces in `frontend/src/types/index.ts`

### Adding a new page
1. Create component in `frontend/src/pages/<PageName>.tsx`
2. Add route in `frontend/src/App.tsx` router configuration
3. Add navigation link in `frontend/src/components/layout/Sidebar.tsx`

### Testing backend endpoints
```bash
# List all runs
curl http://localhost:8000/api/v1/runs

# Get specific run
curl http://localhost:8000/api/v1/runs/1

# Create new run
curl -X POST http://localhost:8000/api/v1/runs \
  -H "Content-Type: application/json" \
  -d '{"config_id": 1}'
```

## Frontend Build and Deployment

```bash
cd frontend
npm run build      # TypeScript compile + Vite build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint check
```

Build artifacts go to `frontend/dist/` and can be served statically from any CDN/web server. The frontend expects API at `VITE_API_BASE_URL` environment variable (defaults to http://localhost:8000).

## Key Dependencies

**Backend**:
- FastAPI - Modern Python web framework with automatic OpenAPI docs
- Uvicorn - ASGI server for FastAPI
- Faker - Mock data generation for seeding

**Frontend**:
- React 19 + TypeScript - Type-safe UI framework
- Vite - Fast build tool and dev server
- TanStack Query v5 - Server state management with caching
- TanStack Table v8 - Advanced data tables (used in Analysis page)
- React Router v6 - Client-side routing
- Tailwind CSS v4 - Utility-first styling
- Radix UI - Accessible headless components
- Recharts - Data visualizations (configured but not heavily used yet)
- Sonner - Toast notifications
- Lucide React - Icon library

## Notes for Future Development

**Snowflake migration**: The codebase is designed for easy migration. Only `backend/database.py` and `backend/main.py` need changes:
1. Replace `sqlite3.connect()` with `snowflake.connector.connect()`
2. Swap matching logic to call stored procedures
3. Frontend requires zero changes

**Type safety**: Maintain strict TypeScript typing. All API responses should have corresponding interfaces in `types/index.ts`. Never use `any` types.

**Component composition**: Follow existing pattern of small, focused UI components in `components/ui/` composed into feature-rich pages. Avoid creating monolithic components.
