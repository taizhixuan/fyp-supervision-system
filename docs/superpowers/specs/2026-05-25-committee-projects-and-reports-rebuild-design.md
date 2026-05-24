# Committee Projects & Reports — Rebuild Design

Date: 2026-05-25
Owner: Httpsouls
Scope: Backend + Frontend rebuild of `/committee/projects` (Project & Pairing Overview, Unpaired Students, Supervisor Load, Export) and `/committee/reports` (Reports Module + History). No new milestone subsystem — progress and risk are derived from existing student-module signals (proposal, meetings, meeting logs).

---

## 1. Background — what's broken today

### 1.1 `/committee/projects`
- **Cycle filter is dead.** `CommitteeProjectController.getProjects` accepts `?cycle=<Long>` but the frontend sends the string `"FYP1"` / `"FYP2"`. Type conversion fails silently → the filter is a no-op.
- **`status` and `pairingStatus` query params** are sent by the frontend, **never read** by the controller.
- **Project-status dropdown is wrong**: shows `NOT_STARTED / IN_PROGRESS / COMPLETED / ON_HOLD`. The real enum is `ACTIVE / COMPLETED / SUSPENDED / DROPPED`.
- **Hardcoded DTO fields**: `CommitteeService.buildProjectOverviewDto` puts `cycle="FYP1"`, `progress=0`, `riskLevel="LOW"` for every project. `getSupervisorLoadDtos` hardcodes `fyp2Students=0`. `getUnpairedStudentDtos` hardcodes `requestsSent=0`, `requestsRejected=0`. This is why "Ahmad" looks fake.
- **Export button 404s.** Page calls `POST /committee/projects/export` — endpoint does not exist.
- **Scope confusion.** `projectRepository.findAll(pageable)` returns *every* project ever — no cycle-status default scope.
- **No pagination UX.** Backend returns a Spring `Page`, frontend ignores `totalElements / totalPages / number`.

### 1.2 `/committee/reports`
- **Endpoint mismatch.** Frontend `POST /committee/reports`, backend exposes `POST /committee/reports/generate` only.
- **Field-name drift.** Backend returns `reportType`, frontend reads `report.type`; backend has no `status`, frontend reads `report.status` to drive PENDING/COMPLETED/FAILED badges; backend has no `previewUrl`, frontend renders a Preview button bound to it.
- **Download button has no `onClick`.** Even when status renders "Ready", the button is inert.
- **Report types are mostly fake.** UI exposes 6 (`PROGRESS_SUMMARY, SUPERVISION_LOAD, PAIRING_STATUS, PROPOSAL_ANALYSIS, MILESTONE_TRACKING, RISK_ASSESSMENT`). Backend `buildCsvReport` only branches on `SUPERVISOR_LOAD`, `PAIRING_STATUS`; everything else defaults to `PROPOSAL_SUMMARY`. 4 of 6 buttons silently produce the same CSV.
- **Filters ignored.** Form collects `cycle / programme / dateFrom / dateTo`. Backend only reads `cycleId` (a Long, not the `"FYP1"` string the form sends), drops everything else.

### 1.3 Cycle model
`fyp_cycle` rows are **distinct semesters**: PK `cycleId`, `cycleType` ('FYP1'/'FYP2'), `academicYear`, `semester`, `startDate`, `endDate`, `status` (`UPCOMING` / `ACTIVE` / `COMPLETED` / `ARCHIVED`). "FYP1 2024/25 Sem 1" and "FYP1 2025/26 Sem 1" are different cycle IDs. The current code flattens both into the string `"FYP1"`.

---

## 2. Goals

1. Every value shown to the committee must come from real DB state. No hardcoded `0` / `"LOW"` / `"FYP1"`.
2. Filters work end-to-end (cycle, cycle status, project status, pairing status, risk, search) and are applied server-side.
3. Default scope = projects in cycles with `status = ACTIVE`. Committee can switch to "All Cycles (incl. past)" or pick a specific cycle.
4. Server-side pagination with a real paginator UI.
5. One-click export from the page header (CSV / XLSX / PDF) reflecting the active filters. Dedicated `ExportOverview` configurator page is retired.
6. Reports module exposes only types that produce real, useful output and respects all advertised filters.
7. Progress and risk are derived from existing student-module data (proposal, meetings, meeting logs). No new milestone schema.

---

## 3. Domain decisions

### 3.1 Cycle representation
All committee DTOs that previously carried `cycle: "FYP1"|"FYP2"` now carry:

```
cycleId: number
cycleCode: string         // e.g. "FYP1-2024S1"
cycleType: "FYP1" | "FYP2"
academicYear: string      // e.g. "2024/2025"
cycleStatus: "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
```

`StudentProfile.programme` continues to be the programme source. `fyp_phase` on `MeetingLog` continues as the phase partition (independent of cycleId — see § 3.4).

### 3.2 Progress formula (no milestones)
Weighted from real signals:

```
proposalScore =
  DRAFT             → 0
  SUBMITTED         → 33
  REVISION_REQUIRED → 50
  REJECTED          → 20
  APPROVED          → 100

meetingLogScore = min(100, lockedLogsForPhase / 6 * 100)        // uses MeetingLogComplianceService
conductedScore  = min(100, completedMeetings / 8 * 100)         // 8 ≈ one per fortnight in a 16-week semester
timeScore       = clamp(0..100, (today - cycle.startDate) / (cycle.endDate - cycle.startDate) * 100)

progress = round(0.30*proposalScore + 0.40*meetingLogScore + 0.20*conductedScore + 0.10*timeScore)
```

When no cycle dates exist (placeholder projects), `timeScore = 0`.

### 3.3 Risk rules (no milestones)
```
daysIn         = daysBetween(cycle.startDate, today)
cycleDuration  = daysBetween(cycle.startDate, cycle.endDate)
requiredByNow  = max(0, round(6 * daysIn / cycleDuration))
lastConducted  = max(meeting.confirmedStartAt) where meeting.project = p AND meeting.status = COMPLETED

factors = []
if pairingStatus == UNPAIRED and daysIn > 30        → "Unpaired 30+ days into cycle"
if proposalStatus == REJECTED                       → "Proposal rejected"
if proposalStatus == DRAFT and daysIn > 30          → "Proposal not yet submitted"
if lockedLogs < requiredByNow / 2 and daysIn > 30   → "Behind on meeting logs (X of expected Y)"
if lastConducted == null and daysIn > 21            → "No meetings conducted yet"
if lastConducted != null and daysSince(lastConducted) > 21 and cycleStatus == ACTIVE
                                                    → "No conducted meeting in N days"

riskLevel =
  HIGH    if  unpaired-late OR proposal-rejected OR (behind-logs AND daysIn > 60)
  MEDIUM  if  any other factor present
  LOW     otherwise
```

DTO returns both `riskLevel: "LOW"|"MEDIUM"|"HIGH"` and `riskFactors: string[]`. The detail page lists the factors.

For projects whose cycle has `status = COMPLETED` or `ARCHIVED`, risk is reported as `LOW` with an empty `riskFactors` array regardless — past projects are not "at risk".

### 3.4 What "cycleId" means on `MeetingLog`
`MeetingLog` currently keys by `fypPhase` string ("FYP1"/"FYP2"), not `cycleId`. The compliance service stays as-is — the design does not need a new FK because phase + student already uniquely scopes the count needed for a given project.

---

## 4. Backend changes

### 4.1 New endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/committee/cycles` | Returns all cycles for dropdowns. Ordered: status priority (ACTIVE > UPCOMING > COMPLETED > ARCHIVED), then `startDate DESC`. Each row: `cycleId, cycleCode, cycleType, academicYear, semester, startDate, endDate, status, projectCount` |
| `GET` | `/committee/projects/export` | Streams the filtered project list as a file. Query: `format=csv\|xlsx\|pdf` plus the same filters as `GET /committee/projects`. `Content-Disposition: attachment`. |
| `POST` | `/committee/reports` | Alias for `/committee/reports/generate` (back-compat — both keep working). |

### 4.2 Modified endpoints

| Endpoint | Change |
|---|---|
| `GET /committee/projects` | Accepts: `cycleId: Long?`, `cycleStatus: CycleStatus?` (defaults to `ACTIVE` when no `cycleId` given), `projectStatus: ProjectStatus?`, `pairingStatus: PAIRED\|UNPAIRED\|PENDING_APPROVAL?`, `riskLevel: LOW\|MEDIUM\|HIGH?`, `search: String?`, `Pageable`. Default sort `lastActivity DESC`, default size 20. |
| `GET /committee/projects/unpaired-students` | Accepts `cycleId: Long?`. When absent, falls back to *all* `ACTIVE` cycles (not just the first FYP1 active cycle as today). |
| `GET /committee/projects/supervisor-loads` | Accepts `cycleId: Long?`. `fyp1Students` / `fyp2Students` are derived from real project counts grouped by `cycle.cycleType`. |
| `GET /committee/reports` | Returns `{reports: [{reportId, reportType, title, status, format, fileSize, downloadUrl, filters, generatedBy, generatedAt, expiresAt}], total}`. `status` defaults to `"COMPLETED"` (generation is synchronous today; the field is reserved for future async). |
| `POST /committee/reports/generate` (and alias `/committee/reports`) | Payload `{reportType, format: "CSV"\|"XLSX"\|"PDF", title?, filters: {cycleId?, cycleStatus?, programme?, dateFrom?, dateTo?, supervisorId?}}`. Returns `{reportId, reportType, status, fileSize, downloadUrl, generatedAt}`. |
| `GET /committee/reports/{id}/download` | Responds with the file using the correct `Content-Type` based on stored format (`text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/pdf`). |

### 4.3 New / modified services

#### `ProjectProgressService` (new)
```
int progressFor(Project p)
ProjectRisk riskFor(Project p)
record ProjectRisk(String level, List<String> factors)
```
Pure function over: `Proposal` (latest by student), `MeetingLogComplianceService.completedLogCount`, `MeetingRepository.findMaxConfirmedStartAtByProjectAndStatus(projectId, COMPLETED)`, `FypCycle`.

Used by:
- `CommitteeService.buildProjectOverviewDto` / `buildProjectDetailDto`
- Risk-assessment report builder
- Engagement panel on supervisor's supervisee detail (read-only)

#### `CommitteeService` (modified)
- `buildProjectOverviewDto`: replace hardcoded `cycle="FYP1"`, `progress=0`, `riskLevel="LOW"` with values from `project.getCycle()` and `ProjectProgressService`.
- `getProjectDtos(filters, pageable)`: switch to a `Specification<Project>` builder so all filters compose into one `findAll`.
- `buildSupervisorLoadDto(profile, cycleId?)`: compute `fyp1Students` / `fyp2Students` from project counts grouped by `cycle.cycleType` (no more hardcoded zero).
- `getUnpairedStudentDtos(cycleId?)`: support multi-cycle when `cycleId` null; compute `requestsSent` / `requestsRejected` / `lastRequestAt` from `SupervisionRequestRepository` (counts of `PENDING/ACCEPTED/REJECTED` per student).

#### `CommitteeReportService` (modified)
- Switch on the *real* report-type set: `PAIRING_STATUS`, `SUPERVISOR_LOAD`, `PROPOSAL_SUMMARY`, `MEETING_LOG_COMPLIANCE` (new), `RISK_ASSESSMENT` (new).
- Honour `filters.cycleId`, `filters.cycleStatus`, `filters.programme`, `filters.dateFrom`, `filters.dateTo`, `filters.supervisorId` in every builder.
- Dispatch to `CsvReportRenderer` / `XlsxReportRenderer` / `PdfReportRenderer` based on `format`.
- Persist `format` and computed `fileSize` on `GeneratedReport`. The `status` column already exists on the entity — start populating it (`COMPLETED` on success, `FAILED` on exception).

#### `CsvReportRenderer` (new — extracted from existing helpers)
- Pure tabular CSV. Same data shapes as today, just isolated for reuse.

#### `XlsxReportRenderer` (new)
- Apache POI (`org.apache.poi:poi-ooxml:5.2.5`). One sheet per report, header row styled bold, freeze first row, auto-size columns. Used for tabular reports + project export.

#### `PdfReportRenderer` (new)
- OpenPDF (`com.github.librepdf:openpdf:1.3.30`). Layout: title block (report name + generated-at + applied-filters chips) → summary stats row → data table → footer page numbers. Used for all reports + project export.

#### `ProjectExportService` (new)
- One method per format. Calls `CommitteeService.getProjectDtos(filters, unboundedPageable)` to obtain the same DTOs the list endpoint serves, then renders to bytes.

### 4.4 Repository changes

| Repository | New method |
|---|---|
| `ProjectRepository` | `Page<Project> findAll(Specification<Project> spec, Pageable pageable)` (already inherited if extending `JpaSpecificationExecutor`; add the interface marker if missing) |
| `MeetingRepository` | `Optional<LocalDateTime> findMaxConfirmedStartAtByProjectAndStatus(Long projectId, MeetingStatus status)` |
| `FypCycleRepository` | `List<FypCycle> findAllByOrderByStatusAscStartDateDesc()` — used by `/committee/cycles`. Status ordering via a CASE; implemented as a JPQL with `ORDER BY CASE status WHEN 'ACTIVE' THEN 0 WHEN 'UPCOMING' THEN 1 WHEN 'COMPLETED' THEN 2 WHEN 'ARCHIVED' THEN 3 END, startDate DESC` |
| `SupervisionRequestRepository` | `long countByStudent_UserIdAndStatus(Long, RequestStatus)`, `Optional<LocalDateTime> findMaxCreatedAtByStudent_UserId(Long)` |
| `MeetingRepository` | `long countByProject_ProjectIdAndStatus(Long projectId, MeetingStatus status)` |

### 4.5 Dependencies
Add to `backend/pom.xml`:
```xml
<dependency>
  <groupId>org.apache.poi</groupId>
  <artifactId>poi-ooxml</artifactId>
  <version>5.2.5</version>
</dependency>
<dependency>
  <groupId>com.github.librepdf</groupId>
  <artifactId>openpdf</artifactId>
  <version>1.3.30</version>
</dependency>
```
No native deps; both work on the existing Java 17 target.

### 4.6 Migrations
All progress/risk/engagement data is derived from existing tables. One small migration is needed for the reports module:

- **`V37__generated_report_status_and_size.sql`** — adds two columns to `generated_report` (verified missing in V12):
  ```sql
  ALTER TABLE generated_report
    ADD COLUMN file_size BIGINT NULL AFTER file_path,
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' AFTER format;
  CREATE INDEX idx_report_status ON generated_report(status);
  ```
  Add matching fields to `GeneratedReport` entity (`fileSize: Long`, `status: String`).

### 4.7 Security
All new endpoints under `/committee/**` → `FYP_COMMITTEE` authority via existing URL-prefix rule in `SecurityConfig`. No changes to `SecurityConfig` required.

---

## 5. Frontend changes

### 5.1 New / modified types (`frontend/src/types/committee.ts`)

```ts
export interface CycleSummary {
  cycleId: number
  cycleCode: string
  cycleType: 'FYP1' | 'FYP2'
  academicYear: string
  semester: number
  startDate: string
  endDate: string
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  projectCount: number
}

// ProjectOverview, UnpairedStudent, SupervisorLoad, ProjectDetail:
//   - REMOVE  cycle: 'FYP1' | 'FYP2'
//   - ADD     cycleId, cycleCode, cycleType, academicYear, cycleStatus
//   - ProjectOverview adds riskFactors: string[]
//   - ProjectDetail adds engagement: {
//       lockedLogs: number; requiredLogs: number;
//       completedMeetings: number; lastConductedMeetingAt: string | null;
//       proposalStatus: CommitteeProposalStatus; proposalVersion: number;
//     }

// ProjectStatus options:
//   - REPLACE NOT_STARTED|IN_PROGRESS|COMPLETED|ON_HOLD with ACTIVE|COMPLETED|SUSPENDED|DROPPED

export type ReportType =
  | 'PAIRING_STATUS'
  | 'SUPERVISOR_LOAD'
  | 'PROPOSAL_SUMMARY'
  | 'MEETING_LOG_COMPLIANCE'
  | 'RISK_ASSESSMENT'

export type ReportFormat = 'CSV' | 'XLSX' | 'PDF'

export interface ReportConfig {
  reportType: ReportType
  format: ReportFormat
  title?: string
  filters: {
    cycleId?: number
    cycleStatus?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'UPCOMING'
    programme?: string
    dateFrom?: string
    dateTo?: string
    supervisorId?: number
  }
}

export interface GeneratedReport {
  reportId: number
  reportType: ReportType
  title: string
  status: 'COMPLETED' | 'FAILED' | 'PENDING'
  format: ReportFormat
  fileSize: number
  downloadUrl: string
  filters: ReportConfig['filters']
  generatedBy: string
  generatedAt: string
  expiresAt: string
}
```

The `index.ts` barrel must keep prefixed re-exports (`CommitteeReportType`, `CommitteeReportFormat`, etc.) to avoid collisions with `student.ts` / `supervisor.ts`.

### 5.2 New / modified hooks (`frontend/src/lib/hooks/useCommittee.ts`)

```ts
export function useCommitteeCycles()
  // GET /committee/cycles → CycleSummary[]

export function useProjectOverview(params: {
  cycleId?: number
  cycleStatus?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'UPCOMING'
  projectStatus?: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'DROPPED'
  pairingStatus?: 'PAIRED' | 'UNPAIRED' | 'PENDING_APPROVAL'
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  search?: string
  page?: number
  size?: number
})
  // Server-side paged, uses placeholderData: keepPreviousData

export function useExportProjects()
  // POST → triggers blob download (CSV/XLSX/PDF). Streams the response, builds a Blob, save-as.
  // No more configurator-page mutation.

export function useDownloadReport()
  // GET /committee/reports/{id}/download responseType:'blob' + save-as
```

The existing `useGenerateReport` keeps its signature but its payload now matches § 4.2.

### 5.3 Page changes

#### `pages/committee/ProjectOverview.tsx`
- State: `{ cycleId, projectStatus, pairingStatus, riskLevel, search, page, size }`. Default `cycleId = undefined` and the page calls `useCommitteeCycles` to derive the default cycle-status filter (`ACTIVE`).
- Header **Export** button becomes a small dropdown (CSV / XLSX / PDF) wired to `useExportProjects`. Filename: `projects-{cycleCode-or-all}-{YYYYMMDD}.{ext}`.
- Cycle dropdown lists every `CycleSummary` formatted as `FYP1 · 2024/25 Sem 1 · Active`. First option is "All Active Cycles" (cycleStatus=ACTIVE), then "All Cycles (incl. past)" (no filter), then each specific cycle. Selecting a past cycle adds a grey "Past" badge to each card.
- Project-status dropdown options changed to the real enum.
- New "Risk" dropdown: All / High / Medium / Low.
- Search debounces 300 ms and resets `page` to 0.
- New `<Paginator>` under the list: prev/next, page-jump, "Showing X–Y of N", page-size selector (20/50/100).
- Card body shows the real cycle code chip (`FYP1 · 2024/25 Sem 1`) instead of the bare "FYP1" badge. Risk badge tooltips show the first `riskFactor`.

#### `pages/committee/ProjectDetail.tsx`
- New **Engagement** card replaces the milestone panel: meeting-log progress bar (`lockedLogs/requiredLogs`), recent meetings list (link to `/committee/projects/:id` → Meeting Detail when one exists), proposal status + version, "Last conducted meeting: 12 days ago".
- Risk factors are listed under the risk badge.

#### `pages/committee/UnpairedStudents.tsx`
- Adds the same cycle dropdown. Default = all active cycles.

#### `pages/committee/SupervisorLoad.tsx` / `SupervisorLoadDetail.tsx`
- Adds the cycle dropdown. `fyp1Students` / `fyp2Students` reflect real per-type counts in the chosen scope.

#### `pages/committee/ExportOverview.tsx` (deleted)
- Functionality moved into the Project Overview header dropdown. Route `ROUTES.COMMITTEE.EXPORT_OVERVIEW` removed; any incoming visit redirects to `/committee/projects` to avoid 404s for bookmarks. Remove the route definition from `app/router.tsx`.

#### `pages/committee/ReportsModule.tsx`
- Report types trimmed to the 5 real ones.
- Filters: cycle dropdown (`useCommitteeCycles`), programme dropdown (sourced from the existing `programmes` constant), date range, supervisor (autocomplete — phase-2; for v1 omit if it adds time).
- Format toggle: CSV / XLSX / PDF.
- Generate button → `useGenerateReport({reportType, format, filters})` → on success, navigates to history.

#### `pages/committee/ReportsHistory.tsx`
- Reads `report.reportType` (not `report.type`) and `report.status`.
- Status badge: COMPLETED (success), PENDING (warning, spinner), FAILED (error).
- Download button wired to `useDownloadReport`. Filename comes from server's `Content-Disposition` when present.
- Preview button removed (not implemented server-side).

### 5.4 Routing
- `frontend/src/app/router.tsx` — remove the `EXPORT_OVERVIEW` lazy route. Add a redirect element so `/committee/projects/export` → `/committee/projects`.
- `frontend/src/lib/constants/routes.ts` — delete `COMMITTEE.EXPORT_OVERVIEW`. Update any reference in `SideNav.tsx`.

### 5.5 Reusable components
- Reuse the existing `<Paginator>` if one already exists in `components/ui/`; else add a small one (prev/next/jump + page-size selector). Decided during implementation.
- Header export dropdown is a small popover — reuse `components/ui/Menu` if it exists, else a controlled menu inline.

---

## 6. Out of scope

- Milestone tracking subsystem (template + per-project tables). Tracking lives on existing student modules (meetings, meeting logs, proposals).
- Per-supervisor utilization trend chart over time.
- Async report generation / job queue (synchronous generation continues; the `status` field is reserved).
- Email-the-report.
- Supervisor autocomplete on reports filter (v1.5).
- Search server-side full-text (v1 keeps `?search=` as a `LIKE %x%` on title / student name / supervisor name).
- Audit log of who exported what (the existing audit log captures controller hits; no new event).

---

## 7. Migration & rollout

1. Backend changes ship first (DTO additions are additive — old TS still compiles because the new fields just appear in responses).
2. Frontend ships in one PR after backend is on `main`. Stale clients keep working with the legacy `cycle: "FYP1"` field present alongside the new fields for one release; the legacy `cycle` field will be removed in the PR after this one.
3. No data migration. `ProjectProgressService` is read-only.

---

## 8. Verification

- Filters: each filter combination returns a strict subset of "no filter" results (tested in a backend integration test against the H2 + Flyway test profile).
- Pagination: total count is stable across pages of the same filter set.
- Export: rows in CSV/XLSX/PDF match the count in the response header for the same filter set.
- Reports: each report-type CSV/XLSX/PDF parses without errors; row counts match what the corresponding list endpoint returns under the same filters.
- Hardcoded-value regression: a backend test asserts no project DTO has `cycle == "FYP1"` for an FYP2 project, and that at least one fixture project has `progress > 0` and one has `riskFactors.size > 0`.
- Frontend smoke (manual): switching cycle dropdown updates list, badge, and stats; export downloads a file with the chosen format; risk factor reasons show on detail.

---

## 9. File map

### New
- `backend/src/main/java/com/fyp/supervision/service/ProjectProgressService.java`
- `backend/src/main/java/com/fyp/supervision/service/report/CsvReportRenderer.java`
- `backend/src/main/java/com/fyp/supervision/service/report/XlsxReportRenderer.java`
- `backend/src/main/java/com/fyp/supervision/service/report/PdfReportRenderer.java`
- `backend/src/main/java/com/fyp/supervision/service/ProjectExportService.java`
- `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeCycleController.java`
- `backend/src/main/resources/db/migration/V37__generated_report_status_and_size.sql`

### Modified
- `backend/pom.xml` (POI + OpenPDF)
- `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeProjectController.java`
- `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeReportController.java`
- `backend/src/main/java/com/fyp/supervision/service/CommitteeService.java`
- `backend/src/main/java/com/fyp/supervision/service/CommitteeReportService.java`
- `backend/src/main/java/com/fyp/supervision/repository/FypCycleRepository.java`
- `backend/src/main/java/com/fyp/supervision/repository/MeetingRepository.java`
- `backend/src/main/java/com/fyp/supervision/repository/ProjectRepository.java` (add `JpaSpecificationExecutor`)
- `backend/src/main/java/com/fyp/supervision/repository/SupervisionRequestRepository.java`
- `backend/src/test/java/com/fyp/supervision/service/CommitteeServiceTest.java` (extend with new assertions)
- `frontend/src/types/committee.ts`, `frontend/src/types/index.ts`
- `frontend/src/lib/hooks/useCommittee.ts`
- `frontend/src/lib/constants/routes.ts`
- `frontend/src/app/router.tsx`
- `frontend/src/pages/committee/ProjectOverview.tsx`
- `frontend/src/pages/committee/ProjectDetail.tsx`
- `frontend/src/pages/committee/UnpairedStudents.tsx`
- `frontend/src/pages/committee/SupervisorLoad.tsx`
- `frontend/src/pages/committee/SupervisorLoadDetail.tsx`
- `frontend/src/pages/committee/ReportsModule.tsx`
- `frontend/src/pages/committee/ReportsHistory.tsx`
- `frontend/src/components/layout/SideNav.tsx` (drop Export Overview link if present)

### Deleted
- `frontend/src/pages/committee/ExportOverview.tsx`
