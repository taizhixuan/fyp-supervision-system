# Project: FYP Supervision System — Backend (Spring Boot)

Backend-specific rules. Read root `CLAUDE.md` for cross-service architecture.

## Layer pattern (load-bearing)

`controller/<role>/` → `service/` → `repository/` → `entity/`. Don't shortcut layers.

- **Controllers return `Map<String, Object>`**, not entities. Build the map in the service. Keys must mirror the matching TypeScript interface in `frontend/src/types/<role>.ts`.
- **Entities use `@JsonIgnore` on back-references** (e.g. `@OneToMany` collections, `@ManyToOne` parents that would cycle). Even with DTO mapping, an accidental serialization of a raw entity will cycle without these.
- **Never serialize entities directly** — even for "simple" responses. Always go through a DTO map. This keeps the wire shape decoupled from the JPA graph.

## Authority is URL-based, not annotation-based

`SecurityConfig.java` maps URL prefixes to authorities:

| Prefix | Authority | Controller subpackage |
|---|---|---|
| `/admin/**` | `SYSTEM_ADMIN` | `controller/admin/` |
| `/committee/**` | `FYP_COMMITTEE` | `controller/committee/` |
| `/supervisor/**` | `SUPERVISOR` | `controller/supervisor/` |
| `/student/**` | `STUDENT` | `controller/student/` |
| `/supervisors/**` (plural) | `STUDENT` | `controller/student/SupervisorDirectoryController.java` |

**Adding a new endpoint**: drop it in the matching subpackage and the path prefix automatically grants the right authority. Don't sprinkle `@PreAuthorize` for role checks — `SecurityConfig` already covers it. Use `@PreAuthorize` only for *finer* checks (e.g. "supervisor can only modify their own request").

For shared cross-role endpoints (any authenticated user), put the controller at the root (`controller/AuthController.java` style) — these match `anyRequest().authenticated()`.

## Lombok gotchas

- **`@Builder.Default` is mandatory** on fields with default initializers when the class has `@Builder`. Without it, the builder silently zeroes the field. Easy to miss; manifests as nulls/empty collections after entity creation.
- **Lombok 1.18.42+ is pinned** in `pom.xml` because the dev machine runs JDK 25 (target is 17). The annotation processor path in `maven-compiler-plugin` is explicit — do not remove the `<annotationProcessorPaths>` block.
- **`@Data` + JPA is dangerous** — generates `equals`/`hashCode` over all fields including lazy collections. Prefer `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder` and write `equals` based on `id` only if needed.

## Schema is owned by Flyway, not Hibernate

- `spring.jpa.hibernate.ddl-auto: validate` — Hibernate will refuse to start if any `@Entity` field doesn't match the live schema.
- All schema changes go in `src/main/resources/db/migration/V<N>__<desc>.sql`. The next number is V15.
- **Never edit an applied migration** (V1–V14). The agent's `Edit`/`Write` is denied on this directory by `.claude/settings.json` — that's intentional. If you genuinely need to change a past migration, the right move is *another* migration that fixes it (e.g. `V16__fix_typo_in_v3.sql`).
- Local Compose maps host **3307 → container 3306**. If you connect via mysql-client from the host, use `-P 3307`.

## DTO ↔ TypeScript contract

The `Map<String, Object>` keys must match the TS interface field names exactly. When you change a backend response shape:

1. Update the service that builds the map.
2. Update the corresponding `frontend/src/types/<role>.ts` interface.
3. Watch for **name collisions** in `frontend/src/types/index.ts` — duplicates across `student.ts` / `supervisor.ts` / `committee.ts` / `admin.ts` were resolved by prefixing with `Sv`/`Committee`/`Admin`. Don't reintroduce a bare duplicate.

## Auth helpers

- `security/CurrentUser.java` resolves the authenticated `UserAccount` — inject it as a method parameter via `@AuthenticationPrincipal` instead of pulling from `SecurityContextHolder`.
- Passwords: always `BCryptPasswordEncoder` (registered as a `@Bean` in `SecurityConfig`). New password fields hash on write; never store plain text.

## File uploads

- Land in `${app.file.upload-dir}` — defaults to `./uploads` locally, `/app/uploads` in the container (mounted as `upload_data` volume).
- Reports → `uploads/reports/`, backups → `uploads/backups/`. `FileStorageService` is the single entrypoint; don't write to disk from controllers.
- Static serving via `/uploads/**` is permitAll in `SecurityConfig` — anything sensitive should NOT be saved there.

## AI services are gated through `AiServiceClient`

- Backend never returns AI service URLs to the frontend; the frontend never calls Flask directly.
- AI URLs are env-driven: `AI_RECOMMENDATION_URL`, `AI_ANALYZER_URL`, `AI_CHATBOT_URL`. Defaults in `application.yml` point to `localhost:5001-5003` for non-Docker dev.
- If you add a new AI integration, add the method to `AiServiceClient` and pass the response through a service that builds the response DTO.

## Common compile pitfalls on this codebase

- Adding a field to an entity without a corresponding Flyway migration → app fails to start (validate mode).
- Adding `@Builder` to a class with default initializers but forgetting `@Builder.Default` → silent nulls.
- Renaming a controller path → forget the matching `SecurityConfig` rule? Authority no longer applies.
- Importing `org.springframework.security.core.userdetails.User` instead of project's `UserAccount` — easy IDE auto-import mistake.
