# Ledgerline Architecture & Design Decisions

## Overview

Ledgerline is a redesigned **employee attrition prediction system** that reimagines the UI as a vintage case-file / personnel-ledger console. The backend has been completely refactored into modular, cloud-ready routes with a pluggable persistence layer and optional AI integration.

## Core Design Principles

### 1. **Separation of Concerns**

- **`src/shared/`** — Business logic (risk model, CSV parsing, type definitions) shared by client & server
- **`src/server/`** — HTTP routes, database operations, AI integration
- **`src/client/`** — React UI, styling, page composition
- **Routes are thin** — they delegate to shared logic; no business rules in HTTP handlers

### 2. **Cloud-Ready from Day One**

- **MongoDB integration** via `server/store.ts` — automatically detected and used if `MONGODB_URI` is set
- **Graceful fallback** — in-memory ledger if no database configured
- **Stateless API** — each request is independent; easy to scale horizontally
- **Environment-driven config** — all secrets & endpoints come from `.env`

### 3. **Aesthetic > Generic UI Patterns**

The original project used generic "progress bars" and flat design. The redesign introduces:

- **Pressure-gauge dial** (`RiskDial.tsx`) — risk is a physical instrument, not a bar
- **Folder-tab cards** (CSS clip-path) — evoke a case-file system
- **Monospace data** — tables and metrics use IBM Plex Mono
- **Serif display headings** — Fraunces (serif) for warmth & authority
- **Ink + kraft palette** — reminiscent of vintage office ledgers
- **Semantic color scale** — rust (critical), amber (high), fog (medium), teal (low)

This isn't just styling; it's an **intentional visual language** that makes the app feel like you're working with actual personnel files, not generic dashboards.

### 4. **AI as a Fallback, Not a Requirement**

- Gemini API is optional (`GEMINI_API_KEY` can be omitted)
- Rule-based summaries are deterministic & predictable
- When Gemini is available, it drafts richer narratives
- When Gemini fails, the app degrades gracefully to rule-based text

## Backend Architecture

### Route Structure

```
src/server/routes/
├── employees.ts      → CRUD, filtering, what-if scenarios
├── system.ts         → Analytics, database status
└── narratives.ts     → AI summaries, leave-reason interpretations
```

Each route file is self-contained:
- No cross-module imports (except types + store)
- No shared route logic
- Clear HTTP contract (req/res)

### Persistence Layer (`server/store.ts`)

```
┌─────────────────────────────────────────┐
│  Application Code                       │
│  (routes, handlers)                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Store API                              │
│  fetchEmployees()                       │
│  persistEmployee(emp)                   │
│  importEmployees(list)                  │
│  resetAllData()                         │
│  getDbStatus()                          │
└─────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   ┌─────────────┐      ┌──────────────┐
   │  MongoDB    │      │ In-Memory    │
   │  (if URI)   │      │ List         │
   └─────────────┘      └──────────────┘
```

**Key features:**

- **Auto-detection**: Checks `MONGODB_URI` env var at startup
- **Single API**: Identical function signatures regardless of backend
- **Fallback transparency**: App code doesn't care which backend is active
- **Seed cleanup**: On first MongoDB connection, pre-filled test data is cleared
- **Connection pooling**: MongoDB client is lazily instantiated once, reused

### AI Integration (`server/gemini.ts`)

```typescript
// Pseudocode
async function generateExecutiveSummary(emp, analysis) {
  const aiClient = getClient();  // null if no GEMINI_API_KEY
  if (!aiClient) {
    return { text: getRuleBasedSummary(emp, analysis), isFallback: true };
  }
  
  try {
    const response = await aiClient.generateContent(prompt);
    return { text: response.text, isFallback: false };
  } catch (error) {
    // API failed; use rule-based fallback
    return { text: getRuleBasedSummary(emp, analysis), isFallback: true };
  }
}
```

**Rule-based fallbacks:**

- **Executive summary**: Generates a plain-English summary based on risk level + drivers
- **Leave-reason interpretation**: Explains the top ranked leave reason (burnout, salary, etc.)

These ensure the app is **always functional**, even without external APIs.

## Frontend Architecture

### Component Hierarchy

```
App (main shell)
├── Sidebar (navigation rail)
├── TopBar (breadcrumb + status)
└── [Page Component]
    ├── Landing
    ├── UploadPanel
    ├── Overview
    ├── Departments
    ├── Directory
    │   ├── EmployeeList
    │   └── EmployeeDetail
    │       ├── RiskDial
    │       └── [What-if sliders]
    ├── ReasonPredictor
    │   ├── EmployeeList
    │   └── [Reason rankings + AI explanation]
    └── EmptyState
```

### State Management

All state is in **App.tsx** using React hooks. Why?

1. **Predictable** — single source of truth
2. **Simple** — no Redux / Zustand / Context API boilerplate
3. **Sufficient** — data size is small (100s of employees)
4. **Dev-friendly** — easy to debug with React DevTools

State categories:

- **UI state** — activeTab, dragActive, isLoading
- **Data state** — employees, analytics, dbStatus
- **Selection state** — selectedEmpId, selectedEmployee
- **Simulation state** — sim (what-if sliders)
- **Form state** — searchQuery, deptFilter, riskFilter
- **Async state** — isLoadingSummary, summaryError, aiSummary

### API Client (`lib/api.ts`)

A thin fetch-based wrapper that mirrors backend routes:

```typescript
const api = {
  dbStatus: (): Promise<DbStatus>,
  analytics: (): Promise<AnalyticsSummary>,
  employees: (params?: Filters): Promise<Employee[]>,
  employee: (id: string): Promise<Employee>,
  updateScenario: (id: string, payload): Promise<Employee>,
  resetAll: (): Promise<{ success: boolean }>,
  importEmployees: (list): Promise<{ success, count }>,
  summary: (id: string): Promise<{ summary, isFallback? }>,
  predictReason: (id: string): Promise<{ explanation, isFallback? }>,
};
```

Benefits:

- **No external HTTP lib** — uses native `fetch()`
- **Error handling** — centralized Centralized `.then(json)` wrapper
- **Type-safe** — mirrors shared types from server
- **Testable** — can be mocked in tests

### UI Primitives (`components/ui.tsx`)

Reusable, composable components:

- `RiskPill` — color-coded risk badge
- `Eyebrow` — small uppercase label
- `FolderCard` — bordered card with folder-tab clipping
- `EmptyState` — placeholder with CTA buttons
- `StatCard` — metric display with accent rule

### Styling: Tailwind + Custom Layer Rules

The design system lives in `src/client/index.css`:

```css
@theme {
  --color-ink: #14171c;        /* CSS variable */
  --color-bone: #ece7db;
  --font-display: "Fraunces", ui-serif, Georgia, serif;
  /* ... */
}

@layer base {
  html { background-color: var(--color-ink); }
  body { font-family: var(--font-sans); }
  h1, h2, h3, h4 { font-family: var(--font-display); }
}

.tab-card {
  /* Folder tab clip-path */
  clip-path: polygon(0 14px, 14px 0, 150px 0, 164px 14px, 100% 14px, 100% 100%, 0 100%);
}

.ledger-ground {
  /* Subtle ruled paper effect */
  background-image: linear-gradient(rgba(...) 1px, transparent 1px);
  background-size: 100% 2rem;
}
```

Benefits:

- **Single source of truth** — colors & fonts defined once
- **Consistent palette** — riskTone() function maps probability → color scale
- **Accessibility** — respects `prefers-reduced-motion`
- **Print-friendly** — hides UI, preserves data

## Risk Model

The shared risk-scoring logic in `src/shared/riskModel.ts`:

```typescript
function analyzeEmployeeRisk(emp: Employee): RiskAnalysis {
  // 1. Compute weighted score from features
  const factors = [
    { name: 'salary_gap', weight: 0.18, value: emp.compensation.salaryGap },
    { name: 'overtime', weight: 0.14, value: emp.workload.overtimeHours },
    { name: 'years_since_promo', weight: 0.12, value: emp.employment.yearsSinceLastPromotion },
    // ... 12 more factors
  ];
  
  let score = 0;
  const contributions: FeatureContribution[] = [];
  
  for (const f of factors) {
    const normalized = f.value / MAX_VALUE;
    const contribution = normalized * f.weight * 100;
    score += contribution;
    
    contributions.push({
      featureName: f.name,
      shapValue: contribution,
      displayName: humanize(f.name),
      currentValue: f.value,
    });
  }
  
  // 2. Clamp score to 0-100
  const probability = Math.min(100, Math.max(0, score));
  
  // 3. Assign risk level
  const riskLevel = probability >= 75 ? 'Critical'
                  : probability >= 50 ? 'High'
                  : probability >= 25 ? 'Medium'
                  : 'Low';
  
  // 4. Rank top drivers
  const topDrivers = contributions
    .sort((a, b) => b.shapValue - a.shapValue)
    .slice(0, 3)
    .map(c => c.displayName);
  
  // 5. Generate recommendations based on drivers
  const recommendations = generateRecommendations(emp, contributions);
  
  // 6. Predict leave reason
  const reasonPrediction = predictAttritionReason(emp);
  
  return {
    probability,
    riskLevel,
    confidence: calculateConfidence(emp), // e.g., 85%
    topDrivers,
    contributions,
    recommendations,
    reasonPrediction,
  };
}
```

The model is **deterministic** — same input always produces the same output. No randomness or training required.

### Leave-Reason Prediction

```typescript
function predictAttritionReason(emp: Employee): AttritionReasonPrediction {
  const reasonScores: Record<string, number> = {
    'Burnout': emp.workload.overtimeHours * 2 + (5 - emp.environment.workLifeBalance) * 3,
    'Salary': Math.max(0, emp.compensation.salaryGap) * 0.01,
    'Career Growth': (emp.employment.yearsSinceLastPromotion + 1) * 2,
    'Manager Fit': (5 - emp.environment.managerRelationship) * 2,
    'Work-Life': (5 - emp.environment.workLifeBalance) * 2.5,
  };
  
  const sorted = Object.entries(reasonScores)
    .map(([reason, score]) => ({
      reason,
      probability: Math.min(100, Math.round(score * 10)),
      description: REASON_DESCRIPTIONS[reason],
    }))
    .sort((a, b) => b.probability - a.probability);
  
  return {
    primaryReason: sorted[0].reason,
    confidence: sorted[0].probability,
    reasoning: `${sorted[0].reason} is the primary driver based on...`,
    reasonProbabilities: sorted,
  };
}
```

## What-If Simulation

When a user adjusts salary, overtime, or survey ratings, the app:

1. Updates local state immediately (optimistic UI)
2. Sends a POST to `/api/employees/:id/update-scenario`
3. Server recalculates `RiskAnalysis` with new values
4. Returns updated Employee object
5. UI re-renders with new risk level + dial

The simulation **does not mutate the database** — it's persisted for this session. On page reload or "Reset to baseline", the original values are restored.

```typescript
// Client side
const applySimulation = async () => {
  const updated = await api.updateScenario(empId, {
    salary: sim.salary,
    overtime: sim.overtime,
    // ...
  });
  setSelectedEmployee(updated);  // re-render with new risk
};

// Server side
router.post('/:id/update-scenario', async (req, res) => {
  const emp = await store.fetchEmployeeById(req.params.id);
  emp.compensation.salary = req.body.salary;
  emp.workload.overtimeHours = req.body.overtimeHours;
  emp.analysis = analyzeEmployeeRisk(emp);
  await store.persistEmployee(emp);
  res.json(emp);
});
```

## Data Flow: Import → Score → Analyze

```
User uploads CSV
         ↓
parseCSVToEmployees() [shared/csvHelper.ts]
         ↓
Array<Employee> (no analysis yet)
         ↓
POST /api/employees/import
         ↓
Server: analyze each record
  for (const emp of employees) {
    emp.analysis = analyzeEmployeeRisk(emp);
  }
         ↓
Store in MongoDB / in-memory
         ↓
GET /api/employees
         ↓
Client: renderList with RiskPill colors
         ↓
GET /api/analytics
         ↓
Client: build Overview + Departments charts
```

## Deployment Topology

### Development

```
npm run dev
  ↓
Vite dev server (port 5173)
  + Hot module replacement
  + Proxy to backend
  ↓
Express server (port 3000)
  + Serves Vite middleware
  + Routes API requests
  ↓
In-memory ledger (or local MongoDB)
```

### Production

```
npm run build
  ↓
dist/
  ├── index.html + assets/
  ├── server.cjs (esbuild bundle)
  └── server.cjs.map
  
node dist/server.cjs
  ↓
Express (port 3000)
  + Serves dist/index.html
  + Routes API requests
  ↓
MongoDB (or in-memory fallback)
```

## Testing Strategy

No unit tests included, but the architecture supports them:

```typescript
// Example: test the risk model
import { analyzeEmployeeRisk } from '../shared/riskModel';

const emp: Employee = {
  id: 'TEST-1',
  name: 'Test User',
  compensation: { salary: 50000, estimatedMarketSalary: 100000, salaryGap: 50000 },
  workload: { overtimeHours: 20, weeklyWorkingHours: 55 },
  environment: { workLifeBalance: 1, managerRelationship: 1, jobSatisfaction: 1 },
  // ...
};

const analysis = analyzeEmployeeRisk(emp);
expect(analysis.probability).toBeGreaterThan(70);
expect(analysis.riskLevel).toBe('Critical');
```

To add tests:
1. Create `src/__tests__/riskModel.test.ts`
2. Add `vitest` or `jest` to devDeps
3. Run `npm test` in CI/CD

## Performance & Scalability

**Current bottleneck**: Frontend bundle size (~300 KB gzipped).

To optimize:
- Split Recharts into dynamic import (only load on Overview/Departments)
- Replace recharts with a simpler charting lib
- Use React.lazy() for page components

**Database**: MongoDB scales to millions of records. Query by department/risk level is O(n) in-memory but indexed in MongoDB.

**API**: Each endpoint is stateless; can be run on multiple servers behind a load balancer.

## Security Considerations

**Current gaps**:
1. No authentication — add JWT or session middleware
2. No RBAC — all users see all employees
3. No audit logging — add write-to-logs on import/reset
4. API keys visible in .env — use secrets manager (AWS Secrets, Vercel Env, etc.)

**To harden**:

```typescript
// Example: add JWT middleware
import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.use('/api/employees', authenticateToken);
```

## Future Enhancements

1. **Batch interventions** — simulate salary raises across a whole department
2. **Retention history** — track which employees did resign, validate model accuracy
3. **Cohort analysis** — compare attrition rates across hire date / department / role
4. **Alerts** — email HR when critical employees enter high-risk zone
5. **Integrations** — sync with Workday / ADP payroll systems
6. **Mobile app** — Expo/React Native version for on-the-go case review
7. **Export to PDF** — print case summaries for file archival

---

**Last updated**: July 2026
**Maintained by**: Your team
