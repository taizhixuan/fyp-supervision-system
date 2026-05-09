
## Goal
Make notifications fully functional end-to-end: in-app delivery honors saved preferences, email is sent for the channels users have opted into, and deadline reminders fire automatically.

## Non-goals
- Push notifications (preferences page has the toggle, but no service worker/FCM plumbing — leave the toggle as a no-op for now and label it "coming soon").
- Password-reset email (related but separate; `AuthService.forgotPassword`/`resetPassword` are stubbed and need their own token table — do as a follow-up).
- Preference UI for non-student roles (defaults will apply).

---

## Phase 1 — Preference enforcement (in-app gating)

The chokepoint is `NotificationService.createNotification` (StudentService.java, SupervisorService.java, MeetingLogService.java, SupervisorTopicService.java, AuthService.java, AdminUserController.java, AdminProjectController.java, CommitteeProposalController.java all flow through it). Refactor it without changing any call site.

**Backend changes:**

1. New helper `NotificationCategory` (enum or constants) with: `MEETING_REMINDERS`, `DEADLINE_REMINDERS`, `PROPOSAL_UPDATES`, `SUPERVISOR_MESSAGES`, `SYSTEM_ANNOUNCEMENTS`. These match the keys already in `defaultPreferences()` at `StudentDeadlineController.java:26`.

2. New `NotificationPreferenceService` (so it doesn't pollute `NotificationService`):
   - `loadPreferences(userId)` → returns parsed JSON map (or defaults). Pulls from `UserNotificationPreferencesRepository`.
   - `shouldDeliverInApp(userId, category)` → checks `inApp.enabled` && `inApp.<category>`.
   - `shouldDeliverEmail(userId, category)` → checks `email.enabled` && `email.<category>` && not in quiet window.
   - `mapTypeToCategory(String type)` — switch:
     - `REQUEST` → SUPERVISOR_MESSAGES
     - `PROPOSAL` → PROPOSAL_UPDATES
     - `MEETING` → MEETING_REMINDERS
     - `DEADLINE` → DEADLINE_REMINDERS
     - everything else (REGISTRATION_PENDING, ACCOUNT_*, FYP1_RESULT, ANNOUNCEMENT, SYSTEM) → SYSTEM_ANNOUNCEMENTS

3. `NotificationService.createNotification` becomes:
   ```
   category = prefService.mapTypeToCategory(type)
   if (prefService.shouldDeliverInApp(userId, category)) save in-app row
   if (prefService.shouldDeliverEmail(userId, category)) emailService.sendNotificationEmail(user, type, title, message, targetRoute)
   ```
   No call-site changes needed.

4. **Open prefs to all roles**: move `GET/PUT /student/notification-preferences` to a new shared controller `NotificationPreferenceController` at `/notifications/preferences` (root permitAll-by-auth path, so any authenticated user). Keep the old paths as 301-style aliases or just leave the student route in place and add the new shared route. Frontend prefs page already calls the student path — keep it working, add new path for future supervisor/admin pages.

**Files touched**: `NotificationService.java`, new `NotificationPreferenceService.java`, new `NotificationPreferenceController.java`.

---

## Phase 2 — Email delivery

**Dependencies & config:**

1. `pom.xml`: add `spring-boot-starter-mail` (no Thymeleaf — HTML strings are fine for ~6 message types).

2. `application.yml`:
   ```
   spring.mail.host: ${MAIL_HOST:smtp.gmail.com}
   spring.mail.port: ${MAIL_PORT:587}
   spring.mail.username: ${MAIL_USERNAME:}
   spring.mail.password: ${MAIL_PASSWORD:}
   spring.mail.properties.mail.smtp.auth: true
   spring.mail.properties.mail.smtp.starttls.enable: true
   app.email.enabled: ${APP_EMAIL_ENABLED:false}    # kill-switch — default off so dev doesn't spam
   app.email.from: ${APP_EMAIL_FROM:fyp-noreply@mmu.edu.my}
   app.email.app-base-url: ${APP_BASE_URL:http://localhost:3000}
   ```

3. `docker-compose.yml`: pass through `MAIL_*` and `APP_EMAIL_*` env vars to the backend service.

**Service:**

4. New `EmailService`:
   - `@Async public void sendNotificationEmail(UserAccount user, String type, String title, String message, String targetRoute)`.
   - Builds a small HTML envelope: brand header → title → message body → "View in app" CTA linking `${app.email.app-base-url}${targetRoute}` → footer with "Manage notification preferences" link.
   - Bails out fast if `app.email.enabled=false` or recipient has no email.
   - Catches all exceptions and logs — never let SMTP failure bubble up to the calling transaction.

5. Enable async: `@EnableAsync` on `SupervisionApplication` (the main class). Configure a small thread-pool executor bean (4 threads, queue 100) so a slow SMTP doesn't block request threads.

**Files touched**: `pom.xml`, `application.yml`, `docker-compose.yml`, new `EmailService.java`, `SupervisionApplication.java`, new `AsyncConfig.java`.

---

## Phase 3 — Frontend type alignment

`src/types/notification.ts` currently has `NotificationType = 'ANNOUNCEMENT' | 'MEETING' | 'PROPOSAL' | 'SYSTEM' | 'REQUEST'`. Backend already emits `REGISTRATION_PENDING`, `ACCOUNT_APPROVED`, `ACCOUNT_REJECTED`, `FYP1_RESULT`, `TOPIC` (from SupervisorTopicService). These render with no icon today.

**Changes:**

1. Extend the union with the missing types, or — cleaner — split the union into a stable set plus accept `string` for forward-compat: `type: NotificationType | string`.
2. Update the icon map in `NotificationDrawer.tsx` to cover them: ACCOUNT_* → UserCheck, FYP1_RESULT → GraduationCap, REGISTRATION_PENDING → UserPlus, TOPIC → Lightbulb.
3. `NotificationSettings.tsx` — surface a small inline note next to the "Push" channel: "Coming soon" (since we're not implementing push). Keep the toggle so the saved JSON shape doesn't change.

**Files touched**: `frontend/src/types/notification.ts`, `frontend/src/components/common/NotificationDrawer.tsx`, `frontend/src/pages/student/NotificationSettings.tsx`.

---

## Phase 4 — Scheduled deadline reminders

`Deadline.reminderDays` is already a JSON array (e.g. `[14, 7, 3, 1]`) in the seed data. Nothing reads it.

**Backend changes:**

1. Migration `V17__create_deadline_reminder_log.sql`:
   ```sql
   CREATE TABLE deadline_reminder_log (
     deadline_id BIGINT NOT NULL,
     days_before INT NOT NULL,
     fired_at DATETIME NOT NULL,
     PRIMARY KEY (deadline_id, days_before),
     CONSTRAINT fk_drl_deadline FOREIGN KEY (deadline_id) REFERENCES deadline(deadline_id) ON DELETE CASCADE
   );
   ```
   Idempotency: the (deadline_id, days_before) PK means re-runs can't double-fire.

2. New `DeadlineReminderJob` with `@Scheduled(cron = "0 0 8 * * *")` (08:00 daily, server tz):
   - Walk all deadlines whose `dueDate >= today`.
   - For each, parse `reminderDays`. For each `N`, if `today + N == effectiveDueDate (extendedDate ?? dueDate)` and no row in `deadline_reminder_log`, then:
     - Resolve audience: `STUDENT` → users with role STUDENT and an active project whose stage matches `deadline.cycle.cycleType`. `SUPERVISOR` → all active supervisors. `ALL` → both.
     - Fire `notificationService.createNotification(userId, "DEADLINE", title, "Due in N days: <description>", "/<role>/deadlines")` per recipient.
     - Insert log row.
   - Wrap in `@Transactional` per deadline to keep the log honest if one user lookup fails.

3. Enable scheduling: `@EnableScheduling` on the main app class (sibling to `@EnableAsync`).

**Files touched**: new `V17__…sql`, new `DeadlineReminderJob.java`, new `DeadlineReminderLog` entity + repository, `SupervisionApplication.java`.

---

## Migrations summary
- **V17** — `deadline_reminder_log` table.
- No other schema changes (`user_notification_preferences` is already in V11).

---

## Test plan
1. **Manual**: with `app.email.enabled=true` and a Gmail app password, register a student → admin gets in-app + email. Approve → student gets both. Toggle student's `email.enabled=false` → admin actions still create in-app row but no email arrives.
2. **Quiet hours**: set quiet 00:00–23:59, fire any event → in-app present, email skipped. Server logs should say "skipped: quiet hours".
3. **Deadline job**: insert a deadline due in 3 days with `reminderDays: [3]`. Manually invoke the job (expose a debug `POST /admin/jobs/deadline-reminders/run` for ops, gated SYSTEM_ADMIN). Verify rows in `deadline_reminder_log` and notifications for all matching audience.
4. **Idempotency**: invoke the job twice — second run produces no new notifications, no exceptions.
5. **No SMTP**: with `app.email.enabled=false`, all events still produce in-app notifications without errors.

---

## Risks / open questions
- **SMTP credentials in dev**: nobody has a real SMTP set up. The `app.email.enabled` kill-switch defaults to `false`, so this won't break anything until ops provides creds. Confirm before merging that we're OK with email being off-by-default.
- **Async + transactions**: `@Async` runs outside the caller's transaction. That's fine here — email is fire-and-forget — but we must use `MimeMessage` carefully and never touch JPA entities inside the async method (pass primitive strings).
- **Server timezone for the scheduled job**: cron `0 0 8 * * *` runs at the JVM's tz. Containers are usually UTC. Need to either (a) set `TZ=Asia/Kuala_Lumpur` in compose, or (b) explicitly use `@Scheduled(cron = "...", zone = "Asia/Kuala_Lumpur")`. Recommend (b) — explicit beats implicit.
- **Scope of preference enforcement for non-student roles**: with no UI to configure their prefs, supervisors/admins/committee will get the defaults (everything on). That matches today's behavior, so no regression.

---

## Suggested execution order
Phase 1 → 3 → 2 → 4 (preferences first, frontend type fix as filler, then email infra, then the scheduled job). Phases 1+3 are safe-by-default and ship independently. Phase 2 needs SMTP creds in your env to verify. Phase 4 has the largest blast radius (writes notifications for every student/supervisor at 08:00) — keep `app.email.enabled=false` the first time it runs in prod so any bug only impacts in-app, not inboxes.

Want me to start on Phase 1 + 3?