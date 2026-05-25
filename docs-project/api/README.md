# Postman Setup Guide — FYP Supervision System

A step-by-step guide to test the backend API with Postman, including JWT auto-save and protected endpoints.

---

## Prerequisites

1. Backend running. **Recommended: Docker Compose (already set up):**
   ```powershell
   docker-compose up -d
   ```
   This starts MySQL (port 3307), backend (port 8080), frontend (port 3000), and all 3 AI services.

   Verify:
   ```powershell
   docker ps
   ```
   You should see `fyp-supervision-system-backend-1` running on `0.0.0.0:8080`.

   > **Do NOT run `mvn spring-boot:run` locally** unless you also stop the Docker backend — they conflict on port 8080, and local Maven would try to connect to MySQL on `:3306` (wrong port — Docker MySQL is on `:3307`).

2. Postman installed (you're already in the workspace).

---

## Step 1 — Create a Workspace Collection

A **collection** is a folder of related API requests. We'll create one for this project.

1. In the left sidebar, click **Collections** → click the **+** button (top of panel).
2. Rename "New Collection" to **`FYP Supervision API`**.
3. Click the collection → **⋯ (three dots)** → **Add request** to add requests later.

![Create collection](media/postman_meeting/01_create_collection.png)

*Figure 1 — New collection named `FYP Supervision API`*

---

## Step 2 — Create an Environment (for variables)

Environments hold reusable variables like `baseUrl` and `token`, so you don't hardcode them in every request.

1. Left sidebar → **Environments** → click **+**.
2. Name it **`FYP Local`**.
3. Add these variables:

| Variable | Type | Initial Value | Current Value |
|----------|------|---------------|---------------|
| `baseUrl` | default | `http://localhost:8080/api` | `http://localhost:8080/api` |
| `token` | secret | *(leave empty)* | *(leave empty)* |

4. Click **Save** (Ctrl+S).
5. **Important:** in the top-right dropdown (currently shows "No environment"), select **`FYP Local`**.

![Environment variables](media/postman_meeting/02_environment_variables.png)

*Figure 2 — Environment with `baseUrl` and `token` variables*

---

## Step 3 — Create the Login Request

This request authenticates a user and saves the JWT token automatically.

1. Right-click your collection → **Add request** → name it **`Login`**.
2. Change method to **POST**.
3. URL: `{{baseUrl}}/auth/login`
4. Go to **Body** tab → select **raw** → choose **JSON** from the dropdown.
5. Paste this body:

```json
{
  "identifier": "admin@mmu.edu.my",
  "password": "Admin@123"
}
```

> **Note:** Field is `identifier` (not `email`) — accepts email or MMU ID.

![Login request](media/postman_meeting/03_login_request.png)

*Figure 3 — Login request with body*

### 3.1 Auto-save the token (Tests script)

Go to the **Tests** tab and paste:

```javascript
// Save JWT token to environment after successful login
const response = pm.response.json();
if (response.accessToken) {
    pm.environment.set("token", response.accessToken);
    console.log("✅ Token saved to environment");
}

pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    pm.expect(response).to.have.property("accessToken");
});
```

![Tests script](media/postman_meeting/04_tests_script.png)

*Figure 4 — Test script auto-saves token*

### 3.2 Send the request

Click the blue **Send** button.

Expected response (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
  "user": {
    "userId": 1,
    "mmuId": "2001000003",
    "email": "admin@mmu.edu.my",
    "fullName": "System Administrator",
    "role": "SYSTEM_ADMIN",
    "status": "ACTIVE"
  }
}
```

![Login response](media/postman_meeting/05_login_response.png)

*Figure 5 — JWT token returned, auto-saved to `{{token}}`*

---

## Step 4 — Set Up Collection-Wide Authorization

Instead of adding the JWT header to every request, set it once at the **collection level**.

1. Click the collection name → **Authorization** tab.
2. Type: **Bearer Token**.
3. Token: `{{token}}`
4. Click **Save**.

Now every request inside this collection automatically sends `Authorization: Bearer <token>`.

![Collection authorization](media/postman_meeting/06_collection_auth.png)

*Figure 6 — Collection-level Bearer token using `{{token}}`*

For each new request you add, in its **Authorization** tab choose **"Inherit auth from parent"** (default).

---

## Step 5 — Test a Protected Endpoint

Add a second request: **Get Current User**

1. Right-click collection → **Add request** → name it **`Get Current User`**.
2. Method: **GET**
3. URL: `{{baseUrl}}/auth/me`
4. Authorization tab: **Inherit auth from parent** (default).
5. Click **Send**.

Expected (200 OK):
```json
{
  "userId": 1,
  "email": "admin@mmu.edu.my",
  "fullName": "System Administrator",
  "role": "SYSTEM_ADMIN",
  "status": "ACTIVE"
}
```

![Protected endpoint](media/postman_meeting/07_protected_endpoint.png)

*Figure 7 — `/auth/me` returns current user with valid token*

---

## Step 6 — Test Different Roles

The system seeds 4 default users for each role. Use the same `Login` request, just change the body:

| Role | Identifier | Password |
|------|-----------|----------|
| **Admin** | `admin@mmu.edu.my` | `Admin@123` |
| **Supervisor** | `sarah.lee@mmu.edu.my` | `Test@123` |
| **Student** | `student@student.mmu.edu.my` | `Test@123` |
| **Committee** | `ahmad.razak@mmu.edu.my` | `Test@123` |

Login as each role to test role-restricted endpoints.

---

## Step 7 — Test RBAC (Role-Based Access)

Add a request to verify a STUDENT cannot access admin endpoints.

1. Login as **Student** (overwrites token).
2. Add request: `GET {{baseUrl}}/admin/users`
3. Send.

Expected: **403 Forbidden** ✅ (RBAC working)

![RBAC 403](media/postman_meeting/08_rbac_forbidden.png)

*Figure 8 — Student blocked from `/admin/**` endpoints*

Then login as **Admin** and retry → **200 OK** ✅

---

## Step 8 — Build Out the Collection

Organise requests in folders inside the collection:

```
📁 FYP Supervision API
├── 📁 Auth
│   ├── POST  Login
│   ├── POST  Register
│   ├── GET   Get Current User
│   ├── PUT   Change Password
│   └── POST  Logout
├── 📁 Student
│   ├── GET   /student/dashboard
│   ├── POST  /student/proposal
│   └── GET   /supervisors
├── 📁 Supervisor
│   ├── GET   /supervisor/supervisees
│   └── PUT   /supervisor/proposal/{id}/approve
├── 📁 Committee
│   └── GET   /committee/projects
└── 📁 Admin
    ├── GET   /admin/users
    └── GET   /admin/audit-logs
```

Create folders: right-click collection → **Add folder**.

---

## Step 9 — Export the Collection (for backup)

1. Right-click collection → **Export**.
2. Format: **Collection v2.1**.
3. Save under `docs-project/api/collections/<role>.postman.json` (auth, student, supervisor, committee or admin).
4. Same for environment: Environments → **⋯** → Export.

Commit both files to Git so the team has a shared API reference.

---

## Quick Reference — All Auth Endpoints

| Method | Path | Auth Required | Body |
|--------|------|--------------|------|
| POST | `/auth/register` | No | `{ identifier, email, password, fullName, role }` |
| POST | `/auth/login` | No | `{ identifier, password }` |
| POST | `/auth/logout` | Yes | — |
| GET | `/auth/me` | Yes | — |
| PUT | `/auth/change-password` | Yes | `{ currentPassword, newPassword }` |
| PUT | `/auth/update-profile` | Yes | `{ fullName, phone, ... }` |
| POST | `/auth/forgot-password` | No | `{ email }` |
| POST | `/auth/reset-password` | No | `{ token, newPassword }` |
| GET | `/auth/verify-reset-token?token=...` | No | — |

Base URL: `http://localhost:8080/api` (port 8080 + context-path `/api` from `application.yml`)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Could not get response` / connection refused | Backend not running. Run `mvn spring-boot:run` in `backend/` |
| `401 Unauthorized` on `/auth/me` | Token missing/expired. Re-run Login. Check `{{token}}` is set in environment |
| `403 Forbidden` | Logged-in user's role doesn't match endpoint's required authority. Login as correct role |
| `{{baseUrl}}` shows as plain text | Environment not selected. Top-right dropdown → choose `FYP Local` |
| Token doesn't auto-save | Tests tab script missing or response shape changed. Check console for errors |
| `400 Bad Request` on login | Field name is `identifier`, not `email` or `username` |

---

## Screenshots Checklist

Save all to `Project-info/media/postman_meeting/`:

- [ ] `01_create_collection.png` — new collection in sidebar
- [ ] `02_environment_variables.png` — environment with `baseUrl`/`token`
- [ ] `03_login_request.png` — POST login with JSON body
- [ ] `04_tests_script.png` — Tests tab with auto-save script
- [ ] `05_login_response.png` — 200 OK with JWT
- [ ] `06_collection_auth.png` — Bearer token inheritance
- [ ] `07_protected_endpoint.png` — `/auth/me` success
- [ ] `08_rbac_forbidden.png` — 403 for wrong role
