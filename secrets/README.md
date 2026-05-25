# Docker secrets

Files in this directory are mounted into the production-overlay containers
(`docker-compose.prod.yml`) at `/run/secrets/<name>` and read by the
applications via the standard `*_FILE` env var convention.

**Never commit the actual secret files.** Only this README is tracked
(`.gitignore` rule: `/secrets/*` then `!/secrets/README.md`).

## Required files before `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`

| File | Used by | Generate |
|---|---|---|
| `jwt_secret.txt` | backend (`JWT_SECRET_FILE` → `JWT_SECRET`) | `openssl rand -base64 48` |
| `db_password.txt` | backend + mysql (`DB_PASS_FILE` / `MYSQL_PASSWORD_FILE`) | `openssl rand -base64 24` |
| `db_root_password.txt` | mysql (`MYSQL_ROOT_PASSWORD_FILE`) | `openssl rand -base64 24` |

Each file must contain a single line with no trailing newline. On Windows
PowerShell:

```powershell
[System.IO.File]::WriteAllText("secrets\jwt_secret.txt", (openssl rand -base64 48).Trim())
```

On bash:

```bash
printf '%s' "$(openssl rand -base64 48)" > secrets/jwt_secret.txt
```

## Rotation

To rotate any secret:

1. Generate the new value into the same file.
2. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate <service>` to restart only the affected container.

Rotating the JWT signing key invalidates every issued token — all users get
logged out and must sign in again. Plan a maintenance window.

## Upgrading beyond plain files

For a single-host Docker Compose deployment, plain files mounted as secrets
are acceptable: the host filesystem ACL becomes the trust boundary. For
multi-host, swap to one of:

- **Docker Swarm secrets** — same `secrets:` block, but managed by Swarm.
- **HashiCorp Vault / AWS Secrets Manager / GCP Secret Manager** — pull at
  container start via a sidecar (Vault Agent, AWS SSM agent, etc.) that
  writes to `/run/secrets/*` for the same `*_FILE` convention.
