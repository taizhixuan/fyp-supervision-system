# Postman — All Auth Endpoints (Complete Reference)

**Base URL variable:** `{{baseUrl}}` = `http://localhost:8080/api`
**Token variable:** `{{token}}` (auto-saved by Login script)

Create these inside the **Auth** folder of the `FYP Supervision API` collection.

---

## 1. Register — `POST {{baseUrl}}/auth/register`

**Auth:** Public (no token needed)

### Body (raw JSON):
```json
{
  "role": "STUDENT",
  "fullName": "Tai Zhi Xuan",
  "mmuId": "1191234567",
  "email": "test.student@student.mmu.edu.my",
  "phone": "012-3456789",
  "password": "Test@1234"
}
```

### Field rules:
- `role` — must be `STUDENT` or `SUPERVISOR` (only these can self-register)
- `mmuId` — exactly **10 digits**
- `email` — valid email format
- `password` — min 8 chars, max 100
- `phone` — optional

### Response (201 Created):
```json
{ "message": "Registration successful. Account is pending admin approval." }
```

---

## 2. Login — `POST {{baseUrl}}/auth/login`

**Auth:** Public

### Body:
```json
{
  "identifier": "admin@mmu.edu.my",
  "password": "Admin@123"
}
```

> `identifier` accepts **email OR MMU ID**

### Scripts → Post-response (auto-save token):
```javascript
const response = pm.response.json();
if (response.accessToken) {
    pm.environment.set("token", response.accessToken);
    console.log("✅ Token saved");
}
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    pm.expect(response).to.have.property("accessToken");
});
```

### Response (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
  "user": {
    "userId": 1,
    "mmuId": "2001000003",
    "email": "admin@mmu.edu.my",
    "fullName": "System Administrator",
    "role": "SYSTEM_ADMIN",
    "status": "ACTIVE",
    "lastLoginAt": "2026-05-05T18:38:29",
    "createdAt": "2026-02-09T03:45:54",
    "updatedAt": "2026-05-05T18:36:23"
  }
}
```

---

## 3. Logout — `POST {{baseUrl}}/auth/logout`

**Auth:** Bearer token required (inherited from collection)

### Body: *(none)*

### Response (204 No Content):
*(empty body — JWT is stateless, client just discards token)*

---

## 4. Get Current User — `GET {{baseUrl}}/auth/me`

**Auth:** Bearer token required

### Response (200 OK):
```json
{
  "userId": 1,
  "mmuId": "2001000003",
  "email": "admin@mmu.edu.my",
  "fullName": "System Administrator",
  "role": "SYSTEM_ADMIN",
  "status": "ACTIVE",
  "lastLoginAt": "2026-05-05T18:38:29",
  "createdAt": "2026-02-09T03:45:54",
  "updatedAt": "2026-05-05T18:36:23"
}
```

---

## 5. Change Password — `PUT {{baseUrl}}/auth/change-password`

**Auth:** Bearer token required

### Body:
```json
{
  "currentPassword": "Admin@123",
  "newPassword": "NewPass@2026"
}
```

### Field rules:
- `newPassword` — min 8 chars, max 100

### Response (200 OK):
```json
{ "message": "Password changed successfully." }
```

---

## 6. Update Profile — `PUT {{baseUrl}}/auth/update-profile`

**Auth:** Bearer token required

### Body:
```json
{
  "email": "newemail@mmu.edu.my",
  "phone": "019-8765432"
}
```

> Both fields optional. Only sends updates for fields present in body.

### Response (200 OK):
```json
{
  "userId": 1,
  "mmuId": "2001000003",
  "email": "newemail@mmu.edu.my",
  "fullName": "System Administrator",
  "role": "SYSTEM_ADMIN",
  "status": "ACTIVE",
  ...
}
```

---

## 7. Forgot Password — `POST {{baseUrl}}/auth/forgot-password`

**Auth:** Public

### Body:
```json
{
  "email": "admin@mmu.edu.my"
}
```

### Response (200 OK):
```json
{ "message": "If the email exists, a reset link has been sent." }
```

> Always returns success message (security — doesn't reveal if email exists). Reset token is sent via email/logged.

---

## 8. Reset Password — `POST {{baseUrl}}/auth/reset-password`

**Auth:** Public

### Body:
```json
{
  "token": "abc123-reset-token-from-email",
  "newPassword": "FreshPass@2026"
}
```

### Field rules:
- `newPassword` — min 8 chars, max 100

### Response (200 OK):
```json
{ "message": "Password reset successfully." }
```

---

## 9. Verify Reset Token — `GET {{baseUrl}}/auth/verify-reset-token?token=...`

**Auth:** Public

### Query param:
- `token` — the reset token from forgot-password email

### Full URL example:
```
{{baseUrl}}/auth/verify-reset-token?token=abc123-reset-token-from-email
```

### Response (200 OK):
```json
{ "valid": true }
```

---

## Quick Summary Table

| # | Method | Path | Auth | Body Required |
|---|--------|------|------|--------------|
| 1 | POST | `/auth/register` | ❌ | ✅ |
| 2 | POST | `/auth/login` | ❌ | ✅ |
| 3 | POST | `/auth/logout` | ✅ | ❌ |
| 4 | GET | `/auth/me` | ✅ | ❌ |
| 5 | PUT | `/auth/change-password` | ✅ | ✅ |
| 6 | PUT | `/auth/update-profile` | ✅ | ✅ |
| 7 | POST | `/auth/forgot-password` | ❌ | ✅ |
| 8 | POST | `/auth/reset-password` | ❌ | ✅ |
| 9 | GET | `/auth/verify-reset-token` | ❌ | ❌ (query param) |

---

## Common Error Responses

All errors follow this shape:

```json
{
  "timestamp": "2026-05-05T18:33:27.065418130",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials. Please try again."
}
```

| Status | When |
|--------|------|
| **400** Bad Request | Invalid body (missing field, wrong format) |
| **401** Unauthorized | Wrong password / missing token / expired token |
| **403** Forbidden | Token valid but role doesn't have access |
| **404** Not Found | User/resource doesn't exist |
| **409** Conflict | Email or MMU ID already registered |
| **500** Internal Server Error | Backend bug — check logs |

---

## Postman Workflow (Suggested Order)

1. **Login** as admin → token auto-saved → green ✅ in Test Results
2. **Get Current User** → confirms token works
3. **Register** a new student → 201 Created
4. **Login** as new student → identifier = email or MMU ID
5. **Update Profile** → change phone
6. **Change Password** → new password
7. **Login** again with new password → confirms change took effect
8. **Logout** → 204 No Content (token still valid client-side until expiry)
9. **Forgot Password** → check backend logs for reset token
10. **Verify Reset Token** → `valid: true`
11. **Reset Password** → 200 OK

This sequence covers every auth endpoint and proves the full lifecycle works.
