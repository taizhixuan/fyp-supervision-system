# Postman — All Student Endpoints (Complete Reference)

**Base URL variable:** `{{baseUrl}}` = `http://localhost:8080/api`
**Token variable:** `{{token}}` (from Login as STUDENT — `student@student.mmu.edu.my` / `Test@123`)

All endpoints below require **STUDENT** role authority — leave Authorization tab as **`Inherit auth from parent`** (uses Bearer `{{token}}`).

Create folder **Student** inside the `FYP Supervision API` collection.

---

## 1. Dashboard

### 1.1 Get Dashboard — `GET {{baseUrl}}/student/dashboard`

**Body:** *(none)*

**Response (200):** Aggregated stats — current cycle, project status, upcoming deadlines, recent meetings, pending tasks.

---

## 2. Profile

### 2.1 Get Profile — `GET {{baseUrl}}/student/profile`

### 2.2 Update Profile — `PUT {{baseUrl}}/student/profile`

**Body:**
```json
{
  "programme": "Bachelor of Computer Science (Hons)",
  "specialisation": "Software Engineering",
  "faculty": "Faculty of Computing & Informatics",
  "intakeYear": 2021,
  "expectedGraduation": "2025-06",
  "cgpa": 3.50,
  "interests": ["Artificial Intelligence", "Web Development"],
  "skills": ["Java", "Python", "React"],
  "bio": "Passionate about AI and full-stack dev.",
  "linkedinUrl": "https://linkedin.com/in/username",
  "githubUrl": "https://github.com/username",
  "portfolioUrl": "https://myportfolio.com",
  "phone": "012-3456789"
}
```

### 2.3 Upload Profile Image — `POST {{baseUrl}}/student/profile/image`

**Body type:** `form-data`
- Key: `file` (Type: **File**) → select an image

---

## 3. Supervisor Directory

### 3.1 List All Supervisors — `GET {{baseUrl}}/supervisors`

> Note: path is `/supervisors`, not `/student/supervisors`. Still requires STUDENT role.

**Query params (optional):**
- `search=...` — filter by name/department
- `availability=AVAILABLE` — filter by status

### 3.2 Get Supervisor by ID — `GET {{baseUrl}}/supervisors/{id}`

Example: `{{baseUrl}}/supervisors/2`

---

## 4. AI Recommendations

### 4.1 Get Recommendations — `GET {{baseUrl}}/student/recommendations`

**Response:** AI-suggested supervisors based on student's interests/skills (XGBoost model).

### 4.2 Refresh Recommendations — `POST {{baseUrl}}/student/recommendations/refresh`

**Body:** *(none)* — re-runs the recommendation engine.

---

## 5. Supervision Requests

### 5.1 List My Requests — `GET {{baseUrl}}/student/supervision-requests`

### 5.2 Create Request — `POST {{baseUrl}}/student/supervision-requests`

**Body:**
```json
{
  "supervisorId": 2,
  "topicTitle": "AI-Powered FYP Supervision System",
  "message": "I'm interested in working with you on this AI/ML project. My background includes...",
  "researchAreas": ["Machine Learning", "Web Development"]
}
```

### 5.3 Withdraw Request — `POST {{baseUrl}}/student/supervision-requests/{id}/withdraw`

Example: `{{baseUrl}}/student/supervision-requests/5/withdraw`
**Body:** *(none)*

---

## 6. Proposal

### 6.1 Get My Proposal — `GET {{baseUrl}}/student/proposal`

### 6.2 Create Proposal — `POST {{baseUrl}}/student/proposal`

**Body:**
```json
{
  "title": "AI-Powered FYP Supervision System",
  "problemStatement": "Students struggle to find suitable supervisors...",
  "objectives": [
    "Build recommendation system",
    "Implement proposal analyzer",
    "Develop chatbot"
  ],
  "methodology": "Agile development with React and Spring Boot...",
  "scope": "Final-year undergraduate students at MMU FCI...",
  "expectedOutcome": "A deployable web system with AI features...",
  "researchAreas": ["AI", "Education Technology"]
}
```

### 6.3 Update Proposal — `PUT {{baseUrl}}/student/proposal`

**Body:** Same fields as Create. Only sends changes.

### 6.4 Submit Proposal — `POST {{baseUrl}}/student/proposal/submit`

**Body:** *(none)* — locks current draft and sends to supervisor for review.

### 6.5 Get Versions — `GET {{baseUrl}}/student/proposal/versions`

**Response:** All historical versions of the proposal.

### 6.6 Get Feedback — `GET {{baseUrl}}/student/proposal/feedback`

**Response:** Supervisor's review comments on each version.

### 6.7 Get AI Analysis — `GET {{baseUrl}}/student/proposal/analysis`

**Response:** Latest AI analyzer scores (feasibility, innovation, clarity, scope, plagiarism).

### 6.8 Run AI Analysis — `POST {{baseUrl}}/student/proposal/analyze`

**Body:** *(none)* — triggers DistilBERT proposal analyzer (port 5002).
**Response:** Detailed analysis with strengths, weaknesses, scores.

---

## 7. Meetings

### 7.1 List Meetings — `GET {{baseUrl}}/student/meetings`

**Query params (optional):**
- `status=PROPOSED|CONFIRMED|COMPLETED|CANCELLED`
- `page=0` `size=20` `sort=proposedStartAt,desc`

### 7.2 Get Meeting — `GET {{baseUrl}}/student/meetings/{id}`

### 7.3 Request Meeting — `POST {{baseUrl}}/student/meetings`

**Body:**
```json
{
  "title": "FYP Progress Discussion - Week 6",
  "agenda": "1. Show database design\n2. Discuss auth implementation\n3. Plan next sprint",
  "platform": "GOOGLE_MEET",
  "location": "https://meet.google.com/abc-defg-hij",
  "duration": 30,
  "proposedStartAt": "2026-05-07T14:00:00"
}
```

### 7.4 Cancel Meeting — `POST {{baseUrl}}/student/meetings/{id}/cancel`

**Body (optional):**
```json
{
  "reason": "Conflict with another class"
}
```

---

## 8. Meeting Logs (Discussion Records)

### 8.1 List Logs — `GET {{baseUrl}}/student/logs`

> Endpoints `/student/logs` and `/student/meeting-logs` are equivalent (both work the same way).

**Query:** `?status=DRAFT|SUBMITTED|SIGNED&page=0&size=20`

### 8.2 Get Log — `GET {{baseUrl}}/student/logs/{id}`

### 8.3 Create Log — `POST {{baseUrl}}/student/logs`

**Body:**
```json
{
  "meetingId": 12,
  "summary": "Discussed database schema, supervisor approved the ER diagram with minor changes.",
  "discussionPoints": [
    "Reviewed 28 tables across 8 logical groups",
    "Confirmed Flyway migration approach",
    "Agreed on RBAC implementation strategy"
  ],
  "actionItems": [
    "Implement auth module by next week",
    "Add seed data for testing"
  ],
  "nextMeetingDate": "2026-05-14T14:00:00"
}
```

### 8.4 Update Log — `PUT {{baseUrl}}/student/logs/{id}`

**Body:** Same as Create.

### 8.5 Submit Log — `POST {{baseUrl}}/student/logs/{id}/submit`

**Body:** *(none)* — sends log to supervisor for signing.

### 8.6 Sign Log — `POST {{baseUrl}}/student/logs/{id}/sign`

**Body:**
```json
{
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSU..."
}
```

---

## 9. Documents

### 9.1 List Documents — `GET {{baseUrl}}/student/documents`

**Query (optional):**
- `type=PROPOSAL|REPORT|PRESENTATION|CODE`
- `phase=FYP1|FYP2`

### 9.2 Get Document — `GET {{baseUrl}}/student/documents/{id}`

### 9.3 Download Document — `GET {{baseUrl}}/student/documents/{id}/download`

Returns binary file. In Postman: response body **Save Response → Save to a file**.

### 9.4 Upload Document — `POST {{baseUrl}}/student/documents`

**Body type:** `form-data`

| Key | Type | Value |
|-----|------|-------|
| `file` | File | (select file) |
| `title` | Text | `FYP1 Proposal v2` |
| `description` | Text | `Updated based on feedback` |
| `type` | Text | `PROPOSAL` |
| `phase` | Text | `FYP2` |

> **Important:** When using `form-data`, in the **Authorization** tab leave as Inherit. Postman auto-handles `Content-Type: multipart/form-data`.

### 9.5 Delete Document — `DELETE {{baseUrl}}/student/documents/{id}`

---

## 10. Chatbot

### 10.1 Get Chat History — `GET {{baseUrl}}/student/chat`

**Response:** Active chat session messages (or empty if none).

### 10.2 Send Message — `POST {{baseUrl}}/student/chat`

**Body:**
```json
{
  "message": "What is the deadline for FYP2 proposal submission?"
}
```

**Response:** AI assistant reply (Flan-T5 + FAISS, port 5003).

### 10.3 Clear Chat — `DELETE {{baseUrl}}/student/chat`

**Body:** *(none)* — ends current session.

---

## 11. Deadlines & Notifications

### 11.1 Get Deadlines — `GET {{baseUrl}}/student/deadlines`

**Response:** Upcoming cycle deadlines (proposal due, report due, etc.).

### 11.2 Get Registration Status — `GET {{baseUrl}}/student/registration`

**Response:** Current FYP cycle enrollment + project status.

### 11.3 Get Notification Preferences — `GET {{baseUrl}}/student/notification-preferences`

### 11.4 Update Notification Preferences — `PUT {{baseUrl}}/student/notification-preferences`

**Body:**
```json
{
  "emailNotifications": true,
  "inAppNotifications": true,
  "meetingReminders": true,
  "deadlineReminders": true,
  "supervisorMessages": true,
  "announcementUpdates": false
}
```

---

## Quick Summary Table

| # | Method | Path | Notes |
|---|--------|------|-------|
| 1 | GET | `/student/dashboard` | Aggregated stats |
| 2 | GET | `/student/profile` | View own profile |
| 3 | PUT | `/student/profile` | Update profile |
| 4 | POST | `/student/profile/image` | Upload avatar (form-data) |
| 5 | GET | `/supervisors` | List all supervisors |
| 6 | GET | `/supervisors/{id}` | View one supervisor |
| 7 | GET | `/student/recommendations` | AI suggestions |
| 8 | POST | `/student/recommendations/refresh` | Re-run engine |
| 9 | GET | `/student/supervision-requests` | My requests |
| 10 | POST | `/student/supervision-requests` | Send request |
| 11 | POST | `/student/supervision-requests/{id}/withdraw` | Withdraw |
| 12 | GET | `/student/proposal` | View proposal |
| 13 | POST | `/student/proposal` | Create draft |
| 14 | PUT | `/student/proposal` | Update draft |
| 15 | POST | `/student/proposal/submit` | Submit for review |
| 16 | GET | `/student/proposal/versions` | Version history |
| 17 | GET | `/student/proposal/feedback` | Supervisor feedback |
| 18 | GET | `/student/proposal/analysis` | Latest AI analysis |
| 19 | POST | `/student/proposal/analyze` | Run AI analysis |
| 20 | GET | `/student/meetings` | List meetings |
| 21 | GET | `/student/meetings/{id}` | View meeting |
| 22 | POST | `/student/meetings` | Request meeting |
| 23 | POST | `/student/meetings/{id}/cancel` | Cancel |
| 24 | GET | `/student/logs` | List meeting logs |
| 25 | GET | `/student/logs/{id}` | View log |
| 26 | POST | `/student/logs` | Create log |
| 27 | PUT | `/student/logs/{id}` | Update log |
| 28 | POST | `/student/logs/{id}/submit` | Submit log |
| 29 | POST | `/student/logs/{id}/sign` | Sign log |
| 30 | GET | `/student/documents` | List docs |
| 31 | GET | `/student/documents/{id}` | View doc info |
| 32 | GET | `/student/documents/{id}/download` | Download file |
| 33 | POST | `/student/documents` | Upload (form-data) |
| 34 | DELETE | `/student/documents/{id}` | Delete |
| 35 | GET | `/student/chat` | Chat history |
| 36 | POST | `/student/chat` | Send message |
| 37 | DELETE | `/student/chat` | Clear session |
| 38 | GET | `/student/deadlines` | Upcoming deadlines |
| 39 | GET | `/student/registration` | Cycle status |
| 40 | GET | `/student/notification-preferences` | View prefs |
| 41 | PUT | `/student/notification-preferences` | Update prefs |

**All 41 endpoints require STUDENT role.** Logged in non-student → 403 Forbidden.

---

## Suggested Test Workflow

1. **Login as student** (`Test@123`) — token saved.
2. `GET /student/dashboard` — confirm role works.
3. `GET /supervisors` — see available supervisors.
4. `GET /student/recommendations` — test AI suggestions.
5. `POST /student/supervision-requests` → request supervisor 2.
6. `POST /student/proposal` → create draft proposal.
7. `POST /student/proposal/analyze` → trigger AI analyzer.
8. `POST /student/meetings` → request meeting.
9. `POST /student/chat` → ask chatbot a question.
10. `GET /student/deadlines` → verify dates.

This sequence touches every major module + all 3 AI services.

---

## Common Errors

| Status | Cause |
|--------|-------|
| **401** | Token missing/expired → re-login |
| **403** | Logged in as non-student (e.g., admin trying student endpoint) |
| **400** | Validation error — required field missing or wrong format |
| **404** | Resource not found (e.g., `/proposal` when none exists yet) |
| **409** | Duplicate — e.g., already have active supervision request |
