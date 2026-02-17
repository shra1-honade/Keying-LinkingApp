# BizMatch - Business Matching Platform

A modern B2B SaaS application for Equifax that enables customers to map data columns, run matching jobs, and analyze results against Equifax's business reference dataset.

## 🚀 Quick Start

### Backend (FastAPI + SQLite)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn faker

# Seed the database
python seed.py

# Start server
uvicorn main:app --reload --port 8000
```

Backend will run on **http://localhost:8000**

### Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on **http://localhost:5173**

## 📁 Architecture

```
bizmatch/
├── backend/
│   ├── main.py           # FastAPI app + endpoints
│   ├── database.py       # SQLite connection setup
│   ├── seed.py           # Data seeding script
│   └── bizmatch.db       # SQLite database (generated)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/       # Reusable UI primitives (Button, Card, Badge)
    │   │   └── layout/   # Layout components (Sidebar, Topbar, AppLayout)
    │   ├── pages/        # Route pages (Runs, NewRun, Analysis, Configs)
    │   ├── lib/          # API client, utils, query configuration
    │   └── types/        # TypeScript type definitions
    └── tailwind.config.ts # EFX brand colors
```

## 🎨 Tech Stack

### Frontend (Cutting-Edge)
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with custom EFX brand tokens
- **TanStack Query v5** - Server state management
- **TanStack Table v8** - Advanced data tables
- **React Router v6** - Client-side routing
- **Recharts** - Data visualizations
- **Sonner** - Toast notifications
- **Lucide React** - Icons
- **Radix UI** - Accessible primitives

### Backend (Minimal)
- **FastAPI** - Modern Python web framework
- **SQLite** - Local database (demonstrates Snowflake pattern)
- **Faker** - Mock data generation

## 🗄️ Database Schema

**4 Tables:**
1. **configs** - Connection and mapping configurations
2. **runs** - Job execution records
3. **match_results** - Individual match records
4. **reference_businesses** - Mock EFX reference data (1000 records)

## 📊 Seed Data

- ✅ 1000 reference businesses (mock EFX data)
- ✅ 10 pre-configured mappings
- ✅ 20 sample runs (completed, in_progress, error states)
- ✅ 2000 match results (70% match rate average)

## 🌐 API Endpoints

All endpoints under `/api/v1`:

- `GET /configs` - List all configurations
- `POST /configs` - Create new configuration
- `GET /runs` - List all runs (filterable by status)
- `POST /runs` - Create and execute matching run
- `GET /runs/{id}` - Get run details
- `GET /runs/{id}/results` - Get paginated match results (with filters)
- `GET /runs/{id}/download` - Download CSV export

## 🎯 Key Features

### ✅ Implemented
- **My Runs Page** - Table with all runs, status badges, match rates
- **New Run Form** - Select config and launch matching job
- **Match Analysis** - Detailed results with stats cards and paginated table
- **Configurations** - View saved configurations
- **Auto-refresh** - Runs page polls every 10s for in_progress runs
- **CSV Download** - Export match results
- **Responsive Layout** - Sidebar navigation with EFX branding
- **Loading States** - Skeleton loaders throughout
- **Error Handling** - Toast notifications for success/error

### 🎨 UI Highlights
- **EFX Brand Colors** - Navy, red, blue, custom gray palette
- **Status Badges** - Colored badges with pulse animation for in_progress
- **Match Rate Colors** - Green (≥80%), Yellow (50-79%), Red (<50%)
- **Professional Tables** - Hover states, alternating rows
- **Clean Cards** - White backgrounds with subtle shadows

## 🔄 Snowflake Migration Path

The SQLite implementation demonstrates the pattern for Snowflake integration:

```python
# Current: SQLite (demonstration)
cursor.execute("""
    SELECT * FROM reference_businesses
    WHERE LOWER(business_name) = LOWER(?) AND zip = ?
""", (input_name, input_zip))

# Future: Snowflake (just swap)
snowflake_cursor.execute("""
    CALL match_business_procedure(?, ?)
""", (input_name, input_zip))
```

**To migrate:**
1. Update `backend/database.py` connection to use `snowflake-connector-python`
2. Replace SQL queries with Snowflake syntax
3. Call Snowflake stored procedures for matching
4. Frontend remains unchanged!

## 🧪 Testing

### Verify Backend
```bash
curl http://localhost:8000/api/v1/runs
curl http://localhost:8000/api/v1/configs
```

### E2E Flow
1. Open http://localhost:5173
2. See My Runs page with 20 pre-seeded runs
3. Click "+ New Run"
4. Select a configuration from dropdown
5. Click "Launch Job" → creates run and returns to /runs
6. Click "View Analysis" on any completed run
7. See stats cards and match results table
8. Click "Download CSV" to export results
9. Navigate to "Configurations" in sidebar
10. View all saved configurations

## 🎨 EFX Brand Colors

```typescript
{
  'efx-navy':    '#003087',  // Primary buttons, nav highlights
  'efx-red':     '#E31837',  // Danger actions, alerts
  'efx-blue':    '#0066CC',  // Interactive elements, links
  'efx-gray-50':  '#F7F8FA', // Background
  'efx-gray-100': '#EEF0F4', // Card backgrounds
  'efx-gray-200': '#D8DCE6', // Borders
  'efx-gray-400': '#8C93A3', // Disabled text
  'efx-gray-700': '#3D4457', // Secondary text
  'efx-gray-900': '#1A1F2E', // Primary text
}
```

## 📝 Environment Variables

### Backend
No environment variables required (uses local SQLite)

### Frontend
Create `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

## ⚡ Performance Notes

- **TanStack Query** caches API responses (5 min staleTime)
- **Auto-refresh** only when runs are in_progress
- **Pagination** limits table rows to 25 per page
- **Debounced search** would be implemented if search filters added

## 🚧 Future Enhancements

1. **3-Step Wizard** for New Run (Connect → Map → Review)
2. **Charts** - Recharts donut for score distribution
3. **Slide-Over Panel** - Run details on row click
4. **Row Expansion** - Side-by-side field comparison
5. **Advanced Filters** - Score dropdown, business name search
6. **Status Tabs** - All/Active/Completed/Error filters
7. **Framer Motion** - Smooth page transitions and animations

## 📄 License

Equifax Proprietary

---

**Built with ❤️ using cutting-edge frontend technologies**
