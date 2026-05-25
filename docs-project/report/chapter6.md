# Chapter 6: Testing and Evaluation

Testing for this project was carried out across five layers: unit,
integration, system, usability and acceptance. The aim was to check
that the system behaves the way Chapter 3 said it should, that the
individual pieces still fit together once combined, and that real
people from each role can actually use it. Each section below records
the plan that was followed, the data that was used and what happened
when the test was run.

The automated unit tests can be re-run by anyone with `mvn test` from
the `backend/` folder. There are 52 JUnit cases across 7 test classes
covering the services that carry the most risk if they break — the ones
described in Section 5.5. The remaining cases were run by hand in Google
Chrome 134 against the Docker Compose stack from Section 5.3, with the
seeded data created by the scripts in `scripts/`.

---

## 6.1 Unit Testing

Unit testing here means checking one service at a time with known
inputs. Two routes were taken. The seven services where a bug would
hurt most — login throttling, cycle lifecycle, the student write-gate,
meeting log compliance, meeting log DOCX rendering, announcement
audience filter and project progress scoring — have JUnit 5 cases that
run on every build. Everything else, including the React pages, was
tested by clicking through the running app in a browser, with the
database pre-loaded by `scripts/seed_supervisors.ps1` and
`scripts/seed_students_and_logs.ps1` so each run starts from the same
state.

### 6.1.1 Test Plan

The eleven modules from Section 5.5 are reused as the grouping for the
test plan, so that each row lines up with a part of the system that
has already been described. Test IDs use the pattern `T<module>.<case>`,
and the JUnit-backed cases also name the test class that runs them.

**Table 6.1: Unit Test Plan for the User Authentication and Access Control Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Auth | 1 | T01.1 | Successful login resets the lockout counter | `AuthServiceLoginThrottleTest` | 12.05.2026 |
| | 2 | T01.2 | Five consecutive failed logins lock the account | `AuthServiceLoginThrottleTest` | 12.05.2026 |
| | 3 | T01.3 | Correct password rejected while lockout is active | `AuthServiceLoginThrottleTest` | 12.05.2026 |
| | 4 | T01.4 | Unknown identifier returns a generic error message | `AuthServiceLoginThrottleTest` | 12.05.2026 |
| | 5 | T01.5 | JWT bearer enforces role authority on `/student/**` | (manual) | 13.05.2026 |
| | 6 | T01.6 | Password reset token expires after the window | (manual) | 13.05.2026 |

**Table 6.2: Unit Test Plan for the Student Workflow Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Student | 1 | T02.1 | First-time registration creates an `UNPAIRED` project row | (manual) | 13.05.2026 |
| | 2 | T02.2 | Dashboard exposes `supervisorAssigned` and `cycleActive` flags | (manual) | 13.05.2026 |
| | 3 | T02.3 | `StudentFeatureGate` hides Meetings/Logs until pairing | (manual) | 13.05.2026 |
| | 4 | T02.4 | `RegisteredOnlyLockGate` hides Find Supervisor once registered | (manual) | 13.05.2026 |
| | 5 | T02.5 | Registration status badge reflects the JPA enum value | (manual) | 13.05.2026 |

**Table 6.3: Unit Test Plan for the Supervisor Discovery and AI Recommendation Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Discovery | 1 | T03.1 | `/supervisors` returns only `SUPERVISOR` accounts with capacity > 0 | (manual) | 14.05.2026 |
| | 2 | T03.2 | Search filter on expertise narrows the result set | (manual) | 14.05.2026 |
| | 3 | T03.3 | `AiServiceClient` reaches the Flask recommender on port 5001 | (manual) | 14.05.2026 |
| | 4 | T03.4 | Recommendation list returns five components per supervisor | (manual) | 14.05.2026 |
| | 5 | T03.5 | Empty profile falls back to keyword-only scoring | (manual) | 14.05.2026 |

**Table 6.4: Unit Test Plan for the Supervisor Workflow Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Supervisor | 1 | T04.1 | Accept request creates a pairing and decrements capacity | (manual) | 14.05.2026 |
| | 2 | T04.2 | Reject request increments the rejection counter | (manual) | 14.05.2026 |
| | 3 | T04.3 | Weekly availability saves seven `DayOfWeek` rows | (manual) | 14.05.2026 |
| | 4 | T04.4 | Slot lookup returns minute-aligned windows | (manual) | 14.05.2026 |
| | 5 | T04.5 | Supervisee panel lists only paired students | (manual) | 14.05.2026 |

**Table 6.5: Unit Test Plan for the Proposal Lifecycle and AI Proposal Analyzer Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Proposal | 1 | T05.1 | Submit creates `ProposalVersion` with monotonic version number | (manual) | 15.05.2026 |
| | 2 | T05.2 | Resubmit increments version and supersedes the prior row | (manual) | 15.05.2026 |
| | 3 | T05.3 | AI analyzer returns five rubric scores within ten seconds | (manual) | 15.05.2026 |
| | 4 | T05.4 | DOCX export embeds the rendered proposal | (manual) | 15.05.2026 |
| | 5 | T05.5 | Supervisor approval moves status to `APPROVED` | (manual) | 15.05.2026 |

**Table 6.6: Unit Test Plan for the Meetings, Meeting Logs, Signatures and FCI Compliance Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Meeting | 1 | T06.1 | Required log count is six for FYP1 and FYP2 | `MeetingLogComplianceServiceTest` | 12.05.2026 |
| | 2 | T06.2 | Completed-log query is repository-locked and phase-uppercased | `MeetingLogComplianceServiceTest` | 12.05.2026 |
| | 3 | T06.3 | DOCX template renders FYP1 header fields | `MeetingLogDocumentServiceTest` | 12.05.2026 |
| | 4 | T06.4 | Physical meeting mode ticks the In-Person checkbox | `MeetingLogDocumentServiceTest` | 12.05.2026 |
| | 5 | T06.5 | Supervisor signature ticks Satisfactory only | `MeetingLogDocumentServiceTest` | 12.05.2026 |
| | 6 | T06.6 | Bulk export ZIP contains one DOCX per log | `MeetingLogDocumentServiceTest` | 12.05.2026 |
| | 7 | T06.7 | Signature embeds the SHA-256 hash and PNG picture | `MeetingLogDocumentServiceTest` | 12.05.2026 |
| | 8 | T06.8 | Trimester placeholders are substituted across runs | `MeetingLogDocumentServiceTest` | 12.05.2026 |

**Table 6.7: Unit Test Plan for the Cycle Lifecycle and Read-Only Gating Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Cycle | 1 | T07.1 | `isCycleActive` is true when student has no project | `StudentAccessServiceTest` | 12.05.2026 |
| | 2 | T07.2 | `isCycleActive` is true for ACTIVE and PLANNING cycles | `StudentAccessServiceTest` | 12.05.2026 |
| | 3 | T07.3 | `isCycleActive` is false for COMPLETED and ARCHIVED | `StudentAccessServiceTest` | 12.05.2026 |
| | 4 | T07.4 | `requireActiveCycle` throws 403 when cycle has ended | `StudentAccessServiceTest` | 12.05.2026 |
| | 5 | T07.5 | Completing a cycle notifies every enrolled student | `CycleLifecycleServiceTest` | 12.05.2026 |
| | 6 | T07.6 | Activating a cycle demotes the prior active of the same type | `CycleLifecycleServiceTest` | 12.05.2026 |

**Table 6.8: Unit Test Plan for the Announcements and Audience Filter Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Announce | 1 | T08.1 | Student sees announcements scoped to ALL | `AnnouncementServiceTest` | 12.05.2026 |
| | 2 | T08.2 | FYP2 student does not see FYP1 announcements | `AnnouncementServiceTest` | 12.05.2026 |
| | 3 | T08.3 | Programme-scoped announcement reaches only matching programme | `AnnouncementServiceTest` | 12.05.2026 |
| | 4 | T08.4 | SPECIFIC_STUDENTS audience reaches only targeted students | `AnnouncementServiceTest` | 12.05.2026 |
| | 5 | T08.5 | Supervisor sees own announcement as Sent | `AnnouncementServiceTest` | 12.05.2026 |
| | 6 | T08.6 | Supervisor sees admin broadcast as Received | `AnnouncementServiceTest` | 12.05.2026 |

**Table 6.9: Unit Test Plan for the FYP Committee Oversight and Reporting Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Committee | 1 | T09.1 | Progress is zero when no log or meeting is recorded | `ProjectProgressServiceTest` | 12.05.2026 |
| | 2 | T09.2 | Progress is full at six approved logs, eight meetings, full cycle | `ProjectProgressServiceTest` | 12.05.2026 |
| | 3 | T09.3 | Risk is high when student remains unpaired late in the cycle | `ProjectProgressServiceTest` | 12.05.2026 |
| | 4 | T09.4 | Risk is medium when no recent meeting but otherwise compliant | `ProjectProgressServiceTest` | 12.05.2026 |
| | 5 | T09.5 | CSV export contains every supervisee row | (manual) | 16.05.2026 |

**Table 6.10: Unit Test Plan for the System Administration and Audit Log Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Admin | 1 | T10.1 | User roster upload accepts CSV of 100 rows | (manual) | 16.05.2026 |
| | 2 | T10.2 | Audit log records the actor, action and target | (manual) | 16.05.2026 |
| | 3 | T10.3 | System parameter edit refreshes the public endpoint | (manual) | 16.05.2026 |
| | 4 | T10.4 | Backup endpoint produces a timestamped ZIP under `uploads/backups/` | (manual) | 16.05.2026 |
| | 5 | T10.5 | FYP1 Pass Tracking flips a student to FYP2 eligibility | (manual) | 16.05.2026 |

**Table 6.11: Unit Test Plan for the RAG Chatbot and Knowledge Base Module**

| Module | No | Test ID | Function | JUnit Class | Test Date |
|---|---|---|---|---|---|
| Chatbot | 1 | T11.1 | FAISS index loads with the seeded knowledge base | (manual) | 16.05.2026 |
| | 2 | T11.2 | Question on FYP1 deadline returns the cited handbook chunk | (manual) | 16.05.2026 |
| | 3 | T11.3 | Out-of-scope question returns the fallback response | (manual) | 16.05.2026 |
| | 4 | T11.4 | Rebuild script regenerates the index without service restart | (manual) | 16.05.2026 |

### 6.1.2 Test Data

Every test starts from a known database state. The seed scripts in
`scripts/` set up the accounts, supervisor profiles and projects
before each run, so the same input always produces the same output.

**Table 6.12: Test Data Summary**

| Module | Test Case | Description | Relevant Test Data |
|---|---|---|---|
| Auth | T01.2 | Trigger account lockout | identifier=`jisunjiji@mmu.edu.my`, wrongPassword=`Wrong#1234`, attempts=5 |
| Auth | T01.4 | Unknown identifier | identifier=`ghost@mmu.edu.my`, password=`anything` |
| Student | T02.1 | First-time registration | studentId=`1211100123`, programme=`BCS`, intake=`2024/2025` |
| Discovery | T03.3 | AI recommendation | profileKeywords=`machine learning, NLP`, topN=5 |
| Supervisor | T04.3 | Save availability | day=`MONDAY`, startTime=`09:00`, endTime=`12:00` |
| Proposal | T05.1 | Submit proposal | title=`FCI Project Proposal`, file=`proposal-v1.pdf` (1.3 MB) |
| Meeting | T06.3 | Render FYP1 DOCX | meetingNo=1, mode=`PHYSICAL`, studentName=`Jisun Ji`, programme=`BCS` |
| Meeting | T06.7 | Embed signature | signatureDataUrl=`data:image/png;base64,…`, hashAlgo=`SHA-256` |
| Cycle | T07.5 | Complete cycle | cycleId=14, cycleType=`FYP2`, enrolledStudents=37 |
| Announce | T08.4 | Specific students | audienceType=`SPECIFIC_STUDENTS`, recipientIds=`[101, 102, 103]` |
| Committee | T09.2 | Full progress | logsApproved=6, meetingsCompleted=8, cycleStatus=`ACTIVE` |
| Admin | T10.1 | CSV roster upload | rows=100, columns=`student_id, name, email, programme, intake` |
| Chatbot | T11.2 | Cited answer | question=`When is the FYP1 proposal due?`, expectedSource=`fyp_handbook_2026.pdf` |

### 6.1.3 Test Results

Three of the cases are written out in full below, using the longer
template the university provides. The rest are kept short and grouped
into the summary table at the end of this section.

#### Test Case 1 — Account Lockout After Five Failed Attempts

**Table 6.13: Test Case T01.2 — Account Lockout**

| Test Case   |                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test Case   | Test Case ID   | T01.2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|             | Description    | Verify that five consecutive failed login attempts lock the user account for fifteen minutes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|             | Precondition   | A `STUDENT` account exists in `user_account` with status `ACTIVE` and `failed_attempts = 0`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|             | Post Condition | `failed_attempts = 5`, `lockout_until` is set fifteen minutes after the fifth failure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Test Script | Test Steps     | 1. Open `https://localhost:5173/login`.<br>2. Enter identifier `jisunjiji@mmu.edu.my` and password `Wrong#1234`.<br>3. Click **Login**.<br>4. Repeat steps 2–3 four additional times.<br>5. After the fifth attempt, observe the response banner.<br>6. Query `SELECT failed_attempts, lockout_until FROM user_account WHERE identifier = 'jisunjiji@mmu.edu.my';` from MySQL.<br>7. Verify that further login attempts return HTTP 423 even when the correct password is supplied. |
|             | Expected Result| Account is locked after the fifth failure; `failed_attempts = 5` and `lockout_until` is non-null and roughly fifteen minutes in the future                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|             | Actual Result  | Lockout triggered exactly at the fifth failure, banner displayed `Account temporarily locked. Try again in 15 minutes.`, MySQL row matched expectation                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|             | Status         | Pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

#### Test Case 2 — DOCX Export Embeds Supervisor Signature

**Table 6.14: Test Case T06.7 — Signature Picture and Hash Embedded in DOCX**

| Test Case   |                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test Case   | Test Case ID   | T06.7                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|             | Description    | Verify that the DOCX renderer embeds the supervisor signature image and writes the SHA-256 hash into the file when both parties have signed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|             | Precondition   | A meeting log row exists with `student_signature` and `supervisor_signature` both set to base64 PNG data URLs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|             | Post Condition | The rendered DOCX bytes are non-empty, the embedded `media/image*.png` files are present, and the SHA-256 footer matches `Hex(sha256(studentSignatureBytes ‖ supervisorSignatureBytes))`                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Test Script | Test Steps     | 1. Build a `MeetingLog` test fixture with `meetingNo = 3`, phase `FYP2`, mode `ONLINE`.<br>2. Attach a 200×80 PNG signature for each party as a data URL.<br>3. Call `documentService.renderMeetingLogDocx(log)`.<br>4. Open the returned `byte[]` with `XWPFDocument`.<br>5. Iterate `getAllPictures()`. <br>6. Recompute the expected SHA-256 from the two raw PNG byte arrays and compare with the DOCX footer text.                                                                                                                                                                                                            |
|             | Expected Result| Two pictures embedded, SHA-256 footer matches the recomputed value, file size > 18 KB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|             | Actual Result  | Two `image/png` entries embedded under `word/media/`, footer string equal to expected hex digest, file size 26 KB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|             | Status         | Pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

#### Test Case 3 — Announcement Audience Filter for SPECIFIC_STUDENTS

**Table 6.15: Test Case T08.4 — Audience Filter Reaches Only Targeted Students**

| Test Case   |                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test Case   | Test Case ID   | T08.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|             | Description    | Verify that an announcement with audience `SPECIFIC_STUDENTS` is visible only to the listed recipient ids                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|             | Precondition   | An announcement row exists with `audience_type = 'SPECIFIC_STUDENTS'` and `recipient_ids = '[101,102,103]'`. Two student accounts exist: id 101 (targeted) and id 999 (not targeted)                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|             | Post Condition | `announcementService.listForStudent(101)` includes the announcement; `listForStudent(999)` does not                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Test Script | Test Steps     | 1. Seed the announcement via the JUnit `@BeforeEach` helper.<br>2. Call `listForStudent(101)` and assert the returned list contains the announcement id.<br>3. Call `listForStudent(999)` and assert the returned list excludes the announcement id.<br>4. Repeat the call with a different cycle type to confirm the filter is not bypassed.                                                                                                                                                                                                                                                                                  |
|             | Expected Result| Student 101 receives the row, student 999 does not                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
|             | Actual Result  | Returned lists matched expectation in both directions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|             | Status         | Pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

#### Consolidated Unit Test Results

**Table 6.16: Consolidated Unit Test Results**

| Module | Cases planned | Cases automated (JUnit) | Cases manual | Pass | Fail |
|---|---|---|---|---|---|
| Auth | 6 | 4 | 2 | 6 | 0 |
| Student Workflow | 5 | 0 | 5 | 5 | 0 |
| Supervisor Discovery + AI Reco | 5 | 0 | 5 | 5 | 0 |
| Supervisor Workflow | 5 | 0 | 5 | 5 | 0 |
| Proposal Lifecycle + AI Analyzer | 5 | 0 | 5 | 5 | 0 |
| Meetings + Logs + Signatures | 8 | 6 | 2 | 8 | 0 |
| Cycle Lifecycle + Gating | 6 | 6 | 0 | 6 | 0 |
| Announcements | 6 | 6 | 0 | 6 | 0 |
| Committee Reporting | 5 | 4 | 1 | 5 | 0 |
| System Admin + Audit | 5 | 0 | 5 | 5 | 0 |
| RAG Chatbot | 4 | 0 | 4 | 4 | 0 |
| **Total** | **60** | **26 (52 JUnit @Test methods)** | **34** | **60** | **0** |

Running `mvn test` from the `backend/` folder produces the summary
line `Tests run: 52, Failures: 0, Errors: 0, Skipped: 0`. With the
manual cases included, all sixty planned unit-level cases passed at
the time of writing.

---

## 6.2 Integration Testing

Unit testing only checks one piece of code at a time, so the next step
was to follow the journeys a real user takes and make sure the pieces
still work when wired together. Six journeys were picked. Each one
touches at least three layers from Chapter 5 — usually a React page,
the Axios client, a Spring controller, a JPA service and MySQL, and
sometimes a Flask AI service on top of that. The journeys were run by
hand in Chrome 134 against the Docker Compose stack, with the backend
log followed in a second terminal using
`docker compose logs -f backend`.

### 6.2.1 Integration Testing: End-to-End User Journeys

**Table 6.17: Integration Test Cases**

| # | Test Case | Units integrated | Test Steps | Expected Result | Actual Result |
|---|---|---|---|---|---|
| 1 | Student onboarding to first supervisor recommendation | LoginPage → AuthService → StudentService → AiServiceClient → `recommendation:5001` | Register, log in, complete profile, open Find Supervisor, click AI Recommendation | Ranked list of five supervisors with score breakdown; UI returns in under ten seconds | Returned in 6.2 s; ranking matched manual cosine check against seeded profiles |
| 2 | Supervisor request and acceptance | MeetingRequest → StudentSupervisorRequestService → SupervisorRequestService → NotificationService → EmailService | Student sends request, supervisor accepts in `/supervisor/requests` | Pairing row created in `project` table, student dashboard `supervisorAssigned = true`, supervisor inbox shows new entry, email arrives | All four conditions verified within the same browser session |
| 3 | Availability to confirmed meeting | MyAvailability → SupervisorAvailabilityService → MeetingRequest (student) → StudentMeetingController → SupervisorMeetingController | Supervisor saves Monday 09:00–12:00, student picks 10:00, supervisor confirms | Meeting row transitions `PROPOSED → CONFIRMED`, `confirmedStartAt` matches the chosen slot in Asia/Kuala_Lumpur | Slot booked at 10:00 MYT; database value `2026-05-19 10:00:00` with no UTC drift |
| 4 | Meeting log creation, dual signing and DOCX export | MeetingLogCreate → MeetingLogService → MeetingLogDocumentService → ResourceController | Student fills the log, both parties sign, student clicks Download DOCX | DOCX downloads, file opens in Word with FCI letterhead, two signature pictures embedded, SHA-256 footer present | DOCX 27 KB, opened cleanly in Word 2024; signature hash verified by external `sha256sum` |
| 5 | Proposal submission to AI rubric scoring | ProposalSubmit → ProposalService → AiServiceClient → `analyzer:5002` → ProposalCheckResultService | Student uploads a 1.3 MB PDF proposal, opens the AI Check tab | Five rubric scores returned, status banner shows turnaround time, scores persisted in `proposal_check_result` | Returned in 7.4 s with five scores; row visible in MySQL `proposal_check_result` |
| 6 | Cycle completion and read-only fan-out | AdminCycleManagement → CycleLifecycleService → StudentAccessService → frontend `<CycleActiveGate>` | Admin completes the FYP2 cycle | All enrolled students receive a notification; `/student/meetings` returns 200 read-only, write endpoints return 403, frontend renders `LockedFeaturePage` with reason `cycle-ended` | 37 of 37 students notified; write probes returned 403; frontend gate rendered correctly |

---

## 6.3 System Testing

The system testing in the university template is written around IoT
hardware, which this project does not have. Instead, a requirements
traceability matrix is used. The matrix takes each functional
requirement group from Chapter 3 (Table 3.1) and lines it up with the
matching feature built in Section 5.5, then records whether what was
delivered actually does what the requirement asked for.

**Table 6.18: Requirements Traceability — Functional Requirement Groups**

| # | System Requirement (FR group from Table 3.1) | Actual Developed Function | Status |
|---|---|---|---|
| 1 | FR1–FR2, FR41 — User access & profile | Login with MMU identifier and password against `user_account`; JWT issuance via `AuthService`; profile and avatar maintained in Section 5.5.1; admin manages roles in Section 5.5.10 | Met |
| 2 | FR3–FR8, FR29–FR32 — Supervisor discovery & matching | Searchable supervisor directory and request flow in Section 5.5.3 and Section 5.5.4; weekly availability and slot-based booking in Section 5.5.6; AI recommender deployed as `ai-recommendation:5001` and consumed via `AiServiceClient` | Met |
| 3 | FR9–FR17 — Proposal submission & AI checking | Versioned proposal submission with PDF/DOCX in Section 5.5.5; AI proposal analyzer on `ai-proposal-analyzer:5002` returns rubric scores; supervisor approval flow drives `proposal_status` | Met |
| 4 | FR18–FR23, FR44–FR46 — Meetings & supervision log | Meeting proposal, confirmation, reschedule and link assignment in Section 5.5.6; meeting log with dual SHA-256 signatures; FCI 6-log compliance enforced by `MeetingLogComplianceService`; lock-after-signing implemented at service layer | Met |
| 5 | FR24–FR27, FR34, FR40 — Document & guideline management | Document upload by phase and type in Section 5.5.2; supervisor feedback files in Section 5.5.4; admin templates served from `uploads/` and indexed in Section 5.5.10; deadline and meeting reminders via `NotificationService` and `EmailService` | Met |
| 6 | FR33, FR38–FR39, FR47 — Dashboards, reporting & announcements | Supervisor dashboard with supervisee progress in Section 5.5.4; committee reports and CSV export in Section 5.5.9; announcement publishing and audience filtering in Section 5.5.8 | Met |
| 7 | FR28 — Chatbot support | RAG chatbot deployed as `ai-chatbot:5003` with FAISS index over the FYP handbook in Section 5.5.11 | Met |
| 8 | FR42–FR43, FR45 — System configuration & integration | Cycle lifecycle in Section 5.5.7; system parameters and audit log in Section 5.5.10; meeting logs locked at signing time and exported as PDF/DOCX records | Met |

The same exercise was repeated for the non-functional requirements.
The results are recorded in the next table.

**Table 6.19: Requirements Traceability — Non-Functional Requirements**

| NFR | Statement (abridged from Table 3.2) | Observed Behaviour | Status |
|---|---|---|---|
| NFR1 | Responsive web UI on modern desktop browsers | Vite-built React SPA verified in Chrome 134, Edge 132 and Firefox 127 at 1366×768 and 1920×1080 | Met |
| NFR4 | Common actions complete within 3 s | Dashboard p95 1.4 s, project detail p95 1.9 s on the development laptop | Met |
| NFR5 | AI services return within 10 s for typical proposal sizes | Median 6.8 s (recommender) and 7.4 s (analyzer) over twenty samples; chatbot median 3.1 s | Met |
| NFR9 | HTTPS encryption for client–server traffic | Stack runs over self-signed HTTPS in development; production deployment uses MMU's TLS-terminated reverse proxy | Met (deployment-dependent) |
| NFR10 | Role-based access | Spring Security URL gating in `SecurityConfig` plus per-row filter in `AnnouncementService` and `StudentAccessService`; verified by JUnit and by manual probes against forged JWTs | Met |
| NFR11 | Secure storage of documents and personal data | Uploads stored under a Docker named volume with backend-only mount; bcrypt-hashed passwords; SHA-256 signature hashes | Met |
| NFR12 | Modular, well-documented code | Layered packaging `controller → service → repository → entity`; CLAUDE.md authoritative for cross-cutting rules | Met |
| NFR14 | Deployable on MMU infrastructure | Docker Compose stack runs on Java 17 LTS, MySQL 8.4 and CPython 3.12; no platform-specific dependencies | Met |
| NFR7 | 99% availability during the semester | Not directly measured during the development window; mitigations are docker-restart policies and health checks. Marked as a deployment-time requirement | Pending deployment |
| NFR8 | Regular database backups | Backup endpoint produces timestamped ZIP under `uploads/backups/`; production cron schedule to be set during handover | Pending deployment |

---

## 6.4 Usability Testing

Five testers were invited, one or two per role group — two students,
one supervisor, one committee proxy and one admin proxy. Each tester
was given the same set of tasks and asked to work through them on the
seeded development stack while the developer watched silently. Times
were taken with a stopwatch, and any place where the tester paused or
backtracked was written down. Questions were only answered after the
task was finished, so the tester's first attempt would still reflect
how obvious the screen actually is.

The task list was as follows.

- **T1** Log in with the supplied MMU identifier and password.
- **T2** Find a supervisor who matches a stated research interest.
- **T3** Book a meeting in a chosen available slot.
- **T4** Create a meeting log for an attended meeting and sign it.
- **T5** Export the signed meeting log as a DOCX file.
- **T6** Open the supervisor dashboard or admin dashboard, as appropriate to the role.
- **T7** Ask the chatbot a question about the FYP1 proposal deadline.

**Table 6.20: Usability Test Sessions**

| Date / Time | Subject (role) | Task | Time | Observation | Status | Conclusion |
|---|---|---|---|---|---|---|
| 17.05.2026 14:00 | Subject 1 — FCI third-year student (default persona) | T1 Login | 9 s | Recognised the MMU email field immediately | Success | Login flow is familiar |
| | | T2 Find supervisor | 38 s | Used the search bar before noticing the AI Recommendation button | Moderate | Suggest highlighting the recommendation entry point |
| | | T3 Book meeting | 41 s | Picked a slot on the first attempt | Success | Slot picker reads naturally |
| | | T4 Create + sign log | 1 m 52 s | Took two attempts to find the signature pad | Moderate | A tooltip on the signature panel would help |
| | | T5 Export DOCX | 6 s | Located the Download DOCX button quickly | Success | Caption is clear |
| | | T6 Dashboard | — | Not applicable to student role | n/a | n/a |
| | | T7 Chatbot | 22 s | Got the correct cited answer | Success | Citation strengthened trust |
| 18.05.2026 10:00 | Subject 2 — FCI student | T1–T7 | 5 m 14 s total | Completed all tasks; mistook the In-Person checkbox label for Online once | Success | Consider a clearer mode-toggle label |
| 19.05.2026 16:00 | Subject 3 — FCI lecturer (supervisor persona) | T1 Login → T6 Dashboard | 12 s, 18 s | Recognised supervisee table immediately; asked where the export button is | Success | Add an Export Supervisees button on the dashboard |
| | | T2 — Not applicable to supervisor; replaced with Respond to Request | 24 s | Accept dialog readable; reschedule offered an alternative slot picker | Success | Confirmation message could include the student name in bold |
| 20.05.2026 11:30 | Subject 4 — FYP Committee proxy | T6 Reports + T2 search | 31 s, 50 s | CSV download worked; risk colours readable for accessibility | Success | High-risk filter chip is intuitive |
| 21.05.2026 13:00 | Subject 5 — Admin (non-technical proxy) | T6 Admin dashboard, system parameter edit, roster upload | 4 m 28 s total | Roster upload needed the column-header hint; backup button found on the first attempt | Moderate | Display the expected CSV header on the upload page |

All five testers finished every task that applied to their role.
Three tasks ended up marked as Moderate, but in each case the problem
was the wording on a button or how prominent a panel was, not
something missing from the system. The five issues are listed in the
next subsection. The two that affected the most testers were fixed
before the acceptance sessions began.

### 6.4.1 Issues Raised by Usability Subjects and Disposition

**Table 6.21: Usability Findings and Disposition**

| # | Finding | Subjects | Severity | Action |
|---|---|---|---|---|
| 1 | AI Recommendation entry point not discoverable | 1 | Minor | Added a prominent button in the Find Supervisor header |
| 2 | Signature pad not obvious on the meeting log | 1 | Minor | Added a tooltip on the signature panel |
| 3 | In-Person / Online label ambiguous | 2 | Cosmetic | Re-labelled the toggle and added an icon |
| 4 | Roster CSV header not shown | 5 | Minor | Inline header hint added above the upload field |
| 5 | Supervisee export button missing on dashboard | 3 | Minor | Deferred to post-FYP2 backlog |

---

## 6.5 Acceptance Testing

The last layer was acceptance testing with the project supervisor
and two role proxies — one for the FYP Committee and one for the
faculty office admin. The walkthrough followed
`docs-project/demo/walkthrough.md` and was checked against the FYP2
objectives stated in Chapter 1. After each session, the tester
signed off on the form shown below.

**Table 6.22: Acceptance Test 1 — Project Supervisor**

| Tester | Project Supervisor (FCI lecturer) |
|---|---|
| Test date | 22.05.2026 |
| Prototype developer | Tai Zhi Xuan |
| Test objective | Demonstrate the end-to-end FYP supervision workflow against the FYP2 project objectives |
| Potential test inputs | 1. Click events through the React UI<br>2. CSV file upload (admin)<br>3. Proposal PDF upload<br>4. Signature drawn on canvas<br>5. Availability grid input |
| Expected test outputs | A complete FYP2 cycle is supportable end-to-end: pairing, meetings, logs with signatures, proposal review, document exchange, announcement, committee dashboard and DOCX export |
| Test procedure | Followed `demo/walkthrough.md` sections 1–9 |
| Actual test result | Every section of the demo script executed without intervention. DOCX exports opened in Word with the expected formatting. Reschedule flow and read-only gate on cycle completion behaved as documented |
| Comments by user | "Workflow matches what FCI uses today. The signature embedding and audit log address the parts that the old paper process did not capture. Ready for handover, pending production deployment." |
| Status | Accepted |

**Table 6.23: Acceptance Test 2 — Student End-User**

| Tester | Student Tester (BCS Year 3 classmate) |
|---|---|
| Test date | 22.05.2026 |
| Prototype developer | Tai Zhi Xuan |
| Test objective | Verify that a student can complete the full FYP workflow from supervisor selection to a signed meeting log without help from the developer |
| Potential test inputs | 1. Click events through the React UI<br>2. Search keywords typed into the supervisor directory<br>3. Proposal PDF upload (1.3 MB)<br>4. Signature drawn on the canvas pad<br>5. Slot click on the availability calendar |
| Expected test outputs | Student can find a supervisor, send a request, book a meeting in an available slot, write and sign a meeting log, submit a proposal version, and download the meeting log DOCX. The dashboard should update its status badges as each step completes |
| Test procedure | Followed the student section of `demo/walkthrough.md` from beginning to end as a single linear scenario |
| Actual test result | Every step finished without help. The AI recommendation came back in 6.5 s and the top result matched one of the supervisors the tester had already been considering. The signature pad needed two attempts the first time because the tester drew outside the visible box, but the second attempt worked. The DOCX downloaded and opened cleanly in Word with both signatures embedded |
| Comments by user | "Once I figured out where the signature pad was, the rest was easy. The supervisor suggestion was actually one of the names my friends ended up with. This is cleaner than the WhatsApp messages we had to do last year." |
| Status | Accepted |

**Table 6.24: Acceptance Test 3 — FYP Committee Proxy**

| Tester | FYP Committee proxy (postgraduate research assistant) |
|---|---|
| Test date | 23.05.2026 |
| Prototype developer | Tai Zhi Xuan |
| Test objective | Verify that the committee oversight features support cohort-level reporting and intervention |
| Potential test inputs | 1. Risk filter click events<br>2. CSV download<br>3. Cycle parameter changes<br>4. Drill-down into individual supervisee detail |
| Expected test outputs | Committee can identify at-risk students, drill into their meeting log compliance, and export the cohort report |
| Test procedure | Used the committee role with a seeded cohort of 37 FYP2 students |
| Actual test result | Risk filter ranked unpaired students at the top; CSV export contained one row per supervisee with all expected columns; drill-down loaded the meeting log timeline in under two seconds |
| Comments by user | "The risk colour coding maps closely to what we look at in the FCI committee meeting. The CSV is in the format we currently paste into our spreadsheet." |
| Status | Accepted |

**Table 6.25: Acceptance Test 4 — Administrator Proxy**

| Tester | Admin proxy (faculty office staff substitute) |
|---|---|
| Test date | 24.05.2026 |
| Prototype developer | Tai Zhi Xuan |
| Test objective | Verify that the system administration functions cover roster onboarding, cycle parameter management, audit logs and backup |
| Potential test inputs | 1. CSV roster upload (100 rows)<br>2. System parameter edit and refresh<br>3. Audit log filtering<br>4. Backup button click |
| Expected test outputs | Roster appears in the user list, parameter change reflected on the public endpoint, audit log records the action, backup ZIP appears under `uploads/backups/` |
| Test procedure | Sequenced as a fresh-cycle onboarding scenario |
| Actual test result | All four conditions verified within five minutes; the audit log entry contained the actor identifier, action and target row id |
| Comments by user | "I would not need IT to do this. The audit log is reassuring for the faculty office." |
| Status | Accepted |

---

## 6.6 Summary

Putting the numbers together, the JUnit suite passed all 52 of its
cases on the last run, and together with the manual checks that
brought the count up to 60, every planned unit-level case across the
eleven Section 5.5 modules passed. The six integration journeys all
worked end-to-end, from React click to MySQL row to AI service reply.
The traceability matrix in Section 6.3 shows that every functional
requirement group from Chapter 3 was met. Most non-functional
requirements were also met during development, although two of them
(uptime and scheduled backups) really only make sense once the system
is deployed properly, so they are left as deployment-time items.
Usability testing turned up five small issues; four were small enough
to fix straight away and the fifth was added to the backlog. All
four acceptance sessions — supervisor, student, committee proxy and
admin proxy — were signed off.

What this means in practice is that the system does the things the
FYP2 objectives asked for, runs fast enough to be usable, and is
reasonable for someone in each of the four roles to actually pick up
and use. The remaining work is mostly the kind of thing that happens
during handover — putting the stack behind the MMU TLS proxy, setting
up a real backup schedule and watching the uptime for a while — and
that is covered in Chapter 7.
