# Meeting Log Export to MMU FCI DOCX Template — Design Spec

**Date:** 2026-05-25
**Status:** Draft, awaiting user approval
**Owner:** student module

## Goal

Let a student download any of their meeting logs as a DOCX file that visually matches the official MMU FCI "Meeting Log FYP1" / "Meeting Log FYP2" form templates. Two entry points: a per-log "Download DOCX" button on the log detail page, and a bulk "Export All" button on the log list that produces a ZIP of every log in the chosen phase.

## Non-goals

- PDF export (the templates only need .docx fidelity for compliance).
- Editing the template structure at runtime (the .docx file shape is fixed; only cell values change).
- Exporting other students' logs (ownership check stays scoped to the requesting student's userId).
- Replacing the proposal DOCX render path (`ProposalDocumentService`) — this is a parallel, narrower service.

## Architecture

A new `MeetingLogDocumentService` mirrors the pattern of `ProposalDocumentService`:

1. Two template files are copied from `docs-project/template/` into
   `backend/src/main/resources/templates/meeting-log-fyp1.docx` and
   `meeting-log-fyp2.docx`. They become part of the JAR via classpath.
2. Service loads the appropriate template per the log's `fypPhase` field using
   `ClassPathResource`. Apache POI XWPF (already on the classpath for
   `ProposalDocumentService`) opens it as `XWPFDocument`.
3. Service walks every `XWPFTable` in the document, and for each row:
   - Reads the label text from cell 0 (and sometimes cell 2 — the header table
     has multiple label/value pairs per row).
   - Looks up the corresponding value in a precomputed `Map<String,String>`
     keyed by normalised label.
   - Calls `replaceCellContent` (same helper as the proposal service, copied
     and adapted) to wipe the existing value-cell content and write the
     populated value while preserving font.
4. Tasks-checkbox rows use a different code path: the service scans for the
   literal task label text (e.g. "Planning") inside the table cells of
   section 1 and section 2, finds the empty checkbox glyph in the preceding
   cell, and replaces it with a ticked glyph when `tasksJson` says that task
   is selected.
5. Signature rows: if a `MeetingLogSignature` exists for the role (STUDENT,
   SUPERVISOR), the service replaces the "……………………………" line with an embedded
   image via POI's `XWPFRun.addPicture()`, sized to ~120×40 pt. If no
   signature is present for that role, the line stays as the placeholder
   dotted line.
6. Bytes are written to a `ByteArrayOutputStream` and returned to the
   controller as a `byte[]`.

For bulk export, a separate method renders each matching log in turn and
streams the bytes into a `ZipOutputStream` entry. The controller streams the
zip back as a single response.

## Field mapping

The two templates share most of their fields. The mapping below uses the
**normalised label** convention (`label.toLowerCase().replaceAll("\\s+", " ").trim()`)
that `ProposalDocumentService` already uses.

### Header table (FYP1 + FYP2)

| Template label (normalised)             | Source                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `meeting date:`                         | `MeetingLog.meetingDate` formatted `dd MMM yyyy`                               |
| `meeting no.:`                          | `MeetingLog.meetingNumber`                                                     |
| `meeting mode:`                         | (handled via checkbox path — see below)                                        |
| `project id:`                           | `Project.projectId` zero-padded to 4 digits                                    |
| `project type:`                         | (handled via checkbox path — see below)                                        |
| `project title:`                        | `Project.projectTitle` (fallback `Proposal.title` if project title is blank)   |
| `student id:`                           | `UserAccount.mmuId` of the student                                             |
| `student name:`                         | `UserAccount.fullName` of the student                                          |
| `student programme and specialisation:` | `StudentProfile.programme` + " / " + `StudentProfile.specialisation`           |
| `supervisor name:`                      | `UserAccount.fullName` of the supervisor                                       |
| `co-supervisor name:`                   | "" (no entity field; reserved for future)                                      |
| `collaborating company:`                | "" (no entity field; reserved for future)                                      |
| `company supervisor name:`              | "" (no entity field; reserved for future)                                      |

Co-supervisor / collaborating company / company supervisor are left blank
because the schema doesn't carry them today; the template uses "(if applicable)"
so blank is correct and honest. Adding columns is out of scope for this spec.

### Trimester header

The page header reads `Trimester: [Month of start date] / [Next Month of start date] {year} (Trimester ID: [Type by student later])`. The service substitutes this **once per render** via a paragraph-walk in `doc.getParagraphs()` (since the header lives outside any table). The trimester string is derived from `Project.cycle.startDate` (month abbreviation), and the trimester ID comes from `Project.cycle.cycleCode` (e.g. "FYP1-2026-S1"). If `cycle` is null, the line is removed.

### Checkbox sections (per phase)

Each phase template has two parallel checkbox blocks in section 1 (WORK DONE)
and section 2 (WORK TO BE DONE). The label list per phase matches
`MEETING_LOG_TASKS_FYP1` / `MEETING_LOG_TASKS_FYP2` exactly in order and
spelling. The render strategy:

1. For each section, parse `tasksJson` into `List<TaskItem{taskCode,isSelected,details}>`.
2. Walk every paragraph in the section cell. For each task label found:
   - Read back two characters; if it matches `☐` (U+2610) replace with `☑` (U+2611).
   - If `☐` is not present (the template uses an image checkbox instead — see
     fallback below), insert `☑ ` before the label text run.
3. Below the checkbox grid, write the `Details (max 3-5 bullet points):`
   value — bullets are pulled from each selected task's `details` field plus
   the free-text `workDoneDetails` / `workToBeDone` field. Empty bullets are
   skipped.

**Fallback for image checkboxes:** the FYP2 template appears to use embedded
PNG checkbox graphics in a few rows (those are the four single-cell tables
the document has at the top — checkbox images sitting alone). If the unicode
glyph isn't present, the service falls back to writing `[X]` or `[ ]` as
plain text next to the label. Visual purists can later replace this with image
swaps, but the data fidelity is preserved.

### Meeting Mode + Project Type checkbox rows

These two rows in the header have a similar checkbox layout. The service uses
the same `☐ → ☑` swap. `meetingMode == "PHYSICAL"` ticks **In-Person**;
`meetingMode == "ONLINE"` ticks **Online**. `projectType` doesn't live on
`MeetingLog` directly — the service reads `Project.projectType` if present,
or leaves both unchecked.

### Section 3 — Problems Encountered and Solutions

Single free-text cell. Value: `MeetingLog.problemsAndSolutions`.

### Section 4 — Supervisor Comments

- Free text: `MeetingLog.supervisorComments` (may be blank if not yet
  reviewed).
- "Satisfactory" / "Not Satisfactory" checkbox: ticked based on the supervisor
  signature row's metadata. Specifically, we add a small JSON wrapper to the
  existing `supervisorComments` column to encode `{satisfactory:bool, text:string}`,
  OR — simpler — we tick "Satisfactory" iff a signature with
  `signerRole = "SUPERVISOR"` exists AND no comment is flagged as a correction
  request. **Pick option B (sign-implies-satisfactory)** to avoid a schema
  change. Documented in the spec so a future maintainer knows.

### Signatures

Bottom table has four signature rows: Student, Supervisor, Co-Supervisor,
Company Supervisor. For each:

1. Look up the matching `MeetingLogSignature` by `signerRole`.
2. If found and `signatureImageUrl` is a data URL (`data:image/png;base64,…`)
   or a relative storage path (`uploads/...`), decode/load and call
   `run.addPicture(stream, PNG, name, Units.toEMU(120), Units.toEMU(40))`.
3. Append a small caption line below the image: `Signed: {fullName} —
   {signedAt formatted dd MMM yyyy HH:mm}`.
4. If no signature exists, leave the existing dotted line and append a faint
   caption: `(awaiting signature)`.

Co-Supervisor and Company Supervisor rows always show `(awaiting signature)`
unless those roles ever start producing `MeetingLogSignature` rows.

## API surface

### Backend

Two new endpoints on `StudentMeetingLogController` (path prefix
`/student/meeting-logs`, authority `STUDENT` via `SecurityConfig`):

| Method | Path                              | Purpose                                                              |
| ------ | --------------------------------- | -------------------------------------------------------------------- |
| GET    | `/{id}/export.docx`               | Download one meeting log as DOCX. Owner check via student userId.   |
| GET    | `/export.zip?phase=FYP1\|FYP2`    | ZIP of every log for the requesting student in the given phase.     |

Status gate: **any status** is exportable (per Decision 2-A). The bulk endpoint
filters by phase only — no status filter — and includes DRAFT/SUBMITTED logs
too.

Filename convention:
- Single: `MeetingLog_FYP{1|2}_M{meetingNumber}_{studentMmuId}.docx`
- Bulk: `MeetingLogs_FYP{1|2}_{studentMmuId}.zip` (each entry inside uses the
  single-log filename above).

Both endpoints set `Content-Disposition: attachment; filename="..."` and the
correct MIME type (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`
for .docx, `application/zip` for .zip).

### Frontend

Two new TanStack Query mutations in `frontend/src/lib/hooks/useMeetingLog.ts`:

```typescript
useExportMeetingLog(logId: string)        // → blob download for single log
useExportMeetingLogsBulk(phase: FYPPhase) // → blob download for zip
```

UI changes:
- **`pages/student/MeetingLogDetail.tsx`**: add a "Download DOCX" button next
  to the existing action buttons; disabled while the mutation is pending.
- **`pages/student/MeetingLogList.tsx`**: add an "Export All" dropdown
  (FYP1 / FYP2 picker) in the page header next to the filter row.

Both call the new hooks, which use `apiClient.get(url, { responseType: 'blob' })`,
then trigger a browser download via the same pattern used in
`MaintenanceCenter.tsx:handleDownload` (`URL.createObjectURL` + temporary
`<a>` element).

## Templates on disk

- Source of truth: `docs-project/template/Meeting Log FYP1.docx`,
  `Meeting Log FYP2.docx` (already exist).
- Service load path: `backend/src/main/resources/templates/meeting-log-fyp1.docx`
  and `meeting-log-fyp2.docx`.
- The build copies the templates into the classpath because Maven's default
  resource handling already includes `src/main/resources/**`. We add a copy of
  the templates there as the canonical "service" location, and if the source-
  of-truth file ever changes, the dev who edits it must also refresh the
  classpath copy. A README in `resources/templates/` records this.

## Error handling

| Failure                                       | Response                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| Log not found / wrong owner                   | 404 `Resource Not Found` (existing `ResourceNotFoundException` pattern)  |
| Phase parameter invalid                       | 400 `Bad Request`                                                        |
| Bulk export with zero matching logs            | 200 with an empty ZIP containing a `README.txt` noting "no logs found"  |
| Template missing from classpath               | 500 with explicit log message; existing exception handler returns 500   |
| Signature image decode failure (corrupt b64)  | Image skipped, dotted line preserved, warning logged                    |
| Apache POI throws while writing the cell      | 500; existing `GlobalExceptionHandler` returns the standard envelope    |

## Testing

Backend (JUnit, follows existing `*ServiceTest` pattern in
`backend/src/test/java/com/fyp/supervision/service/`):

- `MeetingLogDocumentServiceTest.rendersFyp1HeaderFields()` — build a fake
  log + project + student, render, assert the resulting DOCX text contains
  all expected substitutions (parse with POI and walk tables).
- `…rendersFyp2TasksCheckboxes()` — set `tasksJson` with 3 of 8 tasks
  selected; assert the ticked glyph appears next to those 3 labels and not
  the others.
- `…signatureEmbedsImage()` — feed a 10-byte PNG via data URL; assert the
  rendered DOCX contains exactly one embedded picture in the student
  signature cell.
- `…bulkZipContainsOnePerLog()` — create 3 logs, request bulk export,
  assert the zip has 3 entries with the expected filenames.
- `…rejectsForeignLog()` — log owned by user A, requested by user B → 404.

Frontend: lint-clean + manual browser test of single + bulk download. No
unit tests planned for the hook (matches existing patterns — none of the
other download hooks like `MaintenanceCenter.handleDownload` have unit
tests).

## File-by-file changes

### New
- `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- `backend/src/main/resources/templates/meeting-log-fyp1.docx` (copy)
- `backend/src/main/resources/templates/meeting-log-fyp2.docx` (copy)
- `backend/src/main/resources/templates/README.md` (3-line note on origin + refresh)
- `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

### Modified
- `backend/src/main/java/com/fyp/supervision/controller/student/StudentMeetingLogController.java`
  (add the two new `@GetMapping` methods)
- `frontend/src/lib/hooks/useMeetingLog.ts` (add `useExportMeetingLog`,
  `useExportMeetingLogsBulk`)
- `frontend/src/pages/student/MeetingLogDetail.tsx` (Download button)
- `frontend/src/pages/student/MeetingLogList.tsx` (Export All dropdown)

## Out of scope (explicitly)

- Adding co-supervisor / collaborating company / company supervisor fields to
  the schema. The template has those fields but the system doesn't capture
  them today; this spec leaves them blank rather than mid-feature.
- Replacing image checkboxes in the FYP2 template's stray header tables with
  truly graphical ticks. The unicode-glyph fallback (`[X]` / `[ ]`) is the
  acceptable degradation.
- Server-side caching of rendered DOCX files. Each request re-renders. Files
  are small (~30 KB) and traffic is low.
- Embedding a watermark on DRAFT exports. If a lecturer can't tell from the
  DOCX content whether it's a draft, that's a separate UX bug.

## Confirmed decisions (recap from brainstorming)

- D1 — A: both single + bulk export
- D2 — A: any status exportable
- D3 — A: embed signature images when present, dotted line otherwise
- D4 — A: tick the boxes in the template by replacing the glyph
- D5: filename per spec above; entry points on `MeetingLogDetail` (single) +
  `MeetingLogList` (bulk dropdown)
