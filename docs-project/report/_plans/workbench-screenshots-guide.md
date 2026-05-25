# MySQL Workbench 8 — Connect & Capture Guide

A short walk-through for connecting MySQL Workbench 8 to the running
FYP Supervision System database, and then capturing the screenshots
needed for **Chapter 5.4 Figures 5.4–5.9**.

Tested against Workbench 8.0.x on Windows 11.

---

## 0. Prerequisites

Before you start Workbench, make sure the database container is up.
The simplest way is to leave the full stack running:

```powershell
cd E:\FYP\fyp-supervision-system
docker compose up -d
docker compose ps     # confirm the `db` row says "running" / "healthy"
```

You can also run only the database:

```powershell
docker compose up -d db
```

Either way, Workbench will connect through the host port mapping
`3307 → 3306` defined in `docker-compose.yml`.

---

## 1. Create the Workbench connection

1. Open **MySQL Workbench**.
2. On the home screen, click the **+** icon next to "MySQL Connections".
3. Fill the *Setup New Connection* dialog with:

   | Field | Value |
   |---|---|
   | Connection Name | `FYP Supervision (local)` |
   | Connection Method | `Standard (TCP/IP)` |
   | Hostname | `127.0.0.1` |
   | Port | `3307` |
   | Username | `fyp_user` |
   | Default Schema | `fyp_supervision` |

4. Click **Store in Vault…**, enter password `fyp_pass`, click **OK**.
5. Click **Test Connection**. You should see "Successfully made the
   MySQL connection". If it fails, check `docker compose ps` and
   confirm the container is healthy.
6. Click **OK** to save. A tile labelled "FYP Supervision (local)"
   now appears on the home screen.
7. Double-click the tile to open the SQL Editor.

> **Tip — running outside Docker.** If you also start the backend in
> a way that connects directly to a non-Compose MySQL on the host,
> use port `3306` instead of `3307`. The Compose mapping is only for
> the containerised database.

---

## 2. Verify the schema

In the **SQL Editor**, run a quick check that you are looking at the
right database:

```sql
USE fyp_supervision;
SHOW TABLES;
SELECT COUNT(*) AS tables_present FROM information_schema.tables
 WHERE table_schema = 'fyp_supervision';
SELECT version, description FROM flyway_schema_history
 ORDER BY installed_rank DESC LIMIT 5;
```

You should see thirty-eight application tables plus `flyway_schema_history`,
and the most recent migration row should be `V39 supervisor availability`.

If any of these look wrong, restart the backend so Flyway has a
chance to apply pending migrations:

```powershell
docker compose restart backend
```

---

## 3. Capture the figures

Save every screenshot as a PNG (lossless) into
`Project-info/reports/figures/chapter5/` using the filenames in each
section. The crop should focus on the relevant panel — avoid
including the Windows taskbar, your IDE in the background, or your
desktop wallpaper.

### Figure 5.4 — Database tier in the Compose stack

**Filename**: `fig-5-4-compose-db-service.png`

This figure does **not** need Workbench. It shows the `db` row of the
Compose stack.

1. Open Docker Desktop → **Containers** → expand
   `fyp-supervision-system` (or whatever name the project shows).
2. Highlight the `db` row. The image, status (running / healthy),
   and the host port `3307` should be visible.
3. Crop to that row plus the column headers.

> Terminal alternative: run `docker compose ps` in PowerShell and
> screenshot the `db` line.

---

### Figure 5.5 — Flyway migration scripts in the IDE tree

**Filename**: `fig-5-5-flyway-migration-tree.png`

This figure also uses your IDE, not Workbench. It shows the V*.sql
files so the reader can see the chronological catalogue.

1. Open IntelliJ IDEA (or VS Code).
2. In the project tree, expand
   `backend/src/main/resources/db/migration/`.
3. Scroll so that V1 is visible at the top and V39 at the bottom.
4. Crop to just the file tree panel — the file names alone are
   enough; no need to show file contents.

---

### Figure 5.6 — Hibernate validation pass on backend startup

**Filename**: `fig-5-6-startup-validate-pass.png`

This figure shows the lines that confirm Flyway found the schema
clean and Hibernate's validator agreed.

1. Stop and restart the backend so you get a fresh boot log:

   ```powershell
   docker compose restart backend
   docker compose logs --tail=200 backend
   ```

   (Or, if you run it locally, restart `mvn spring-boot:run`.)

2. Find these three lines in the log:

   - `Successfully validated 38 migrations`
   - `Current version of schema 'fyp_supervision': 39`
   - `Started FypSupervisionApplication in X.X seconds`

3. Crop the terminal window around those three lines plus a few
   context lines. Do not include the rest of the log.

---

### Figure 5.7 — Reverse-engineered EER diagram

**Filename**: `fig-5-7-workbench-eer-diagram.png`

This is the headline visual for §5.4. It is reverse-engineered from
the live database so the diagram always matches the actual schema.

1. In Workbench, top menu **Database → Reverse Engineer…**
2. *Stored Connection*: select `FYP Supervision (local)`. Click
   **Next**.
3. Wait for "Connect to DBMS" to finish, then click **Next**.
4. *Select Schemas to Reverse Engineer*: tick `fyp_supervision`.
   Click **Next**.
5. Workbench loads the table list. Click **Next**.
6. *Select Objects to Reverse Engineer*: leave everything ticked
   (all thirty-eight tables). Click **Execute >**.
7. When the diagram loads, click the small **"Fit page to window"**
   icon in the EER toolbar (it looks like a magnifier with arrows
   pointing inward).
8. **File → Export → Export as PNG…**, save as
   `fig-5-7-workbench-eer-diagram.png`.

> If the diagram is too dense to read, you can also screenshot a
> single zoomed-in cluster (e.g. proposal + proposal_version +
> proposal_check_result + proposal_review) and add a second figure
> 5.7b — but only if the report supervisor expects more detail.

---

### Figure 5.8 — `user_account` table inspected in Workbench

**Filename**: `fig-5-8-user-account-inspector.png`

This figure visualises the design patterns described in §5.4.1
(surrogate PK, `UNIQUE` business keys, `ENUM` status, audit
timestamps) on a real table.

1. In Workbench's **Navigator** (left pane), expand
   **SCHEMAS → fyp_supervision → Tables**.
2. Right-click `user_account` → **Table Inspector…**
3. Switch to the **Columns** tab so you can see name / data type /
   default / NN flags.
4. Maximise the inspector window if needed so all columns fit
   without scrolling.
5. Screenshot the inspector panel (just the panel, not the whole
   Workbench window).

> Alternative: right-click `user_account` → **Alter Table…**, which
> shows the same columns plus the `CREATE TABLE` DDL at the bottom.
> Either works. The Alter Table view is slightly richer because it
> also surfaces the `ENUM` value list inline.

---

### Figure 5.9 — IntelliJ IDEA Database Tool Window

**Filename**: `fig-5-9-intellij-db-tool-meeting-log.png`

This figure shows the live data in `meeting_log` so the reader can
see that the schema is in use, not just declared.

1. In IntelliJ, open the **Database** tool window
   (View → Tool Windows → Database).
2. If you do not yet have a data source, click **+ → Data Source →
   MySQL** and use the same credentials as Workbench (host
   `127.0.0.1`, port `3307`, user `fyp_user`, pass `fyp_pass`,
   database `fyp_supervision`).
3. In the tree, expand `fyp_supervision → tables → meeting_log` and
   double-click it. A data tab opens on the right showing the row
   contents.
4. Make sure both the left tree (schema panel) and the right data
   grid (rows) are visible.
5. Screenshot the Database tool window, cropped tight.

---

## 4. Where to put the screenshots

By convention, place every captured figure under:

```
Project-info/reports/figures/chapter5/
    fig-5-4-compose-db-service.png
    fig-5-5-flyway-migration-tree.png
    fig-5-6-startup-validate-pass.png
    fig-5-7-workbench-eer-diagram.png
    fig-5-8-user-account-inspector.png
    fig-5-9-intellij-db-tool-meeting-log.png
```

When you compile the report to .docx for submission, the `Figure 5.X
…` heading already lives in `chapter5.md` — paste the matching PNG
beneath each heading.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| *"Incompatible/nonstandard server version or connection protocol detected (8.4.x)"* warning on connect | Workbench 8.0 was built for MySQL 5.6 / 5.7 / 8.0; the Compose stack runs MySQL 8.4 | Click **Continue Anyway**. The connection protocol is the same; all features used in this guide (reverse engineer, table inspector, SQL editor, export PNG) work normally. Workbench may complain on a few 8.4-only admin features that the FYP system does not use. |
| `Can't connect to MySQL server on '127.0.0.1' (10061)` | Container not running | `docker compose up -d db` |
| `Access denied for user 'fyp_user'@'localhost'` | Password typed wrong in vault | Reopen the connection, **Edit Connection → Store in Vault** to re-enter `fyp_pass` |
| Workbench connects but `SHOW TABLES;` returns nothing | Wrong default schema | In the SQL Editor type `USE fyp_supervision;` and re-run |
| `Successfully validated N migrations` shows a number < 38 | Backend ran against an older copy of the source tree | Rebuild: `docker compose build backend && docker compose up -d backend` |
| EER diagram is unreadably small | Default layout | After reverse-engineering, **Arrange → Auto Layout**, then *Fit page to window* before exporting |
| Foreign-key arrows missing in EER | Workbench auto-layout chose to suppress them | In the EER toolbar, toggle the *Display Relationships* button (the line-with-arrow icon) |
