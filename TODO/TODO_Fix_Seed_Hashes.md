# TODO — Fix V9 Seed File Password Hashes

**Status:** Database patched live (5 May 2026). Seed file `V9__seed_data.sql` still has stale hashes. Not urgent.

---

## Why this exists

The bcrypt hashes in `V9__seed_data.sql` did **not** match the passwords in their comments:

```sql
-- Default admin user (password: Admin@123)
INSERT INTO user_account (..., password_hash, ...)
VALUES (..., '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', ...);
-- ↑ This hash does NOT verify against "Admin@123"
```

All 4 seeded users (admin, supervisor, student, committee) had broken hashes. Login returned `401 Invalid credentials` for everyone.

**Live fix applied:** ran `UPDATE user_account SET password_hash=...` directly in MySQL with freshly-generated hashes.

---

## When to do this fix

Only matters if you do any of these:

| Scenario | Why it breaks |
|----------|---------------|
| `docker-compose down -v` | Removes MySQL volume → next `up` recreates DB → re-runs V9 with bad hashes |
| Set up project on another machine | Fresh DB, fresh migrations, broken seeds |
| Deploy to production | Production DB starts empty |
| Reset DB for testing | Same as above |

If you never wipe the DB, you can ignore this forever.

---

## How to fix (5 minutes)

### Step 1 — Edit `backend/src/main/resources/db/migration/V9__seed_data.sql`

| Line | Old hash | New hash | Password |
|------|---------|----------|----------|
| **5** (admin) | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` | `$2b$10$1rukh1gFF9q4WoFysNVOSODU/QP5dD5425m3ji1Z8cOou5amAd/jO` | `Admin@123` |
| **9** (supervisor) | `$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG` | `$2b$10$ac9rYYWlikw7zPY4Gfbl0.lQndT8P8K4Xeo.FWrFiuHBfepLiVtr6` | `Test@123` |
| **19** (student) | same as line 9 | `$2b$10$ac9rYYWlikw7zPY4Gfbl0.lQndT8P8K4Xeo.FWrFiuHBfepLiVtr6` | `Test@123` |
| **29** (committee) | same as line 9 | `$2b$10$ac9rYYWlikw7zPY4Gfbl0.lQndT8P8K4Xeo.FWrFiuHBfepLiVtr6` | `Test@123` |

### Step 2 — Handle Flyway checksum

After editing, Flyway will refuse to start because the checksum of V9 changed. Two options:

**Option A — Fresh DB (preferred for dev):**
```powershell
docker-compose down -v
docker-compose up -d
```
Flyway runs all migrations from scratch with the new V9 → working passwords.

**Option B — Keep existing data, repair checksum:**
```powershell
docker exec -it fyp-supervision-system-backend-1 sh -c "cd /app && java -jar app.jar --spring.flyway.repair-on-migrate=true"
```
Or temporarily add `spring.flyway.repair-on-migrate: true` to `application.yml`, restart once, then remove it.

> **Don't** use Option B in production without backup — `repair` rewrites the schema history table.

---

## Generate new hashes (if needed)

If you want different passwords, generate fresh hashes:

```powershell
py -3 -m pip install bcrypt
py -3 -c "import bcrypt; print(bcrypt.hashpw(b'YourPasswordHere', bcrypt.gensalt(rounds=10)).decode())"
```

> Use **Python 3.12** (`py -3`), not the MSYS2 Python — MSYS2's bcrypt build fails without Rust toolchain.

---

## Verification after fix

```powershell
# After docker-compose up:
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"identifier\":\"admin@mmu.edu.my\",\"password\":\"Admin@123\"}'
```

Expected: 200 OK with `{"accessToken":"eyJ...","user":{...}}`

---

## Working credentials (current DB state)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@mmu.edu.my` | `Admin@123` |
| Supervisor | `sarah.lee@mmu.edu.my` | `Test@123` |
| Student | `student@student.mmu.edu.my` | `Test@123` |
| Committee | `ahmad.razak@mmu.edu.my` | `Test@123` |

These work **right now** in the running Docker DB. Will break on volume wipe unless V9 is fixed.
