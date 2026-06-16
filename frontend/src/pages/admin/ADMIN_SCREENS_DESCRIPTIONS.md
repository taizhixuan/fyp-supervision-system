---
tags: [folder/frontend, path/frontend\src\pages\admin\admin_screens_descriptions, component/src-pages-admin]
---
# Admin Module Screen Descriptions

This document provides brief descriptions of each screen in the System Admin module of the FYP Supervision System.

---

## 4.6.1 System Dashboard
**URL:** `/admin/dashboard`

The System Dashboard provides administrators with a comprehensive overview of system health and operational status. It displays real-time system metrics including CPU usage, memory utilization, storage capacity, and database size with color-coded progress bars indicating health levels. A system alerts section shows unresolved warnings and errors requiring attention. Quick stats cards display total users, active projects, pending approvals, and last backup timestamp. The health checks panel monitors service availability (database, file storage, email, authentication) with status indicators and response times. Quick action buttons provide shortcuts to common administrative tasks, while a recent activity feed tracks system-wide changes and user actions.

---

## 4.6.2 User Management
**URL:** `/admin/users`

The User Management screen enables administrators to view, create, and manage all system users. Users can be filtered by role (Student, Supervisor, FYP Committee, System Admin) and status (Active, Inactive, Pending, Suspended). Quick stats cards show total users, pending approvals, active users, and suspended accounts. Each user entry displays name, email, role badge, status indicator, department, last login time, and creation date. Administrators can edit user details, change roles, reset passwords, or deactivate accounts. A search function allows finding users by name or email. Batch operations support activating or suspending multiple users simultaneously.

---

## 4.6.3 System Parameters
**URL:** `/admin/parameters`

The System Parameters screen allows administrators to configure system-wide settings organized by category. Categories include General (system name, timezone, language), Academic (grading scales, assessment criteria), Proposal (submission limits, review requirements), Supervision (capacity limits, meeting frequency), Notification (email templates, reminder timing), and Security (password policies, session timeouts). Each parameter displays its name, current value, data type, description, and last modified date. Parameters can be edited inline with validation based on data type. A search function helps locate specific settings. Changes are logged for audit purposes with the ability to revert to previous values.

---

## 4.6.4 Cycle Management
**URL:** `/admin/cycles`

The Cycle Management screen manages FYP academic cycles (FYP1 and FYP2). Administrators can create, edit, and manage cycles with configurable start/end dates, registration periods, and milestone deadlines. Active cycles are highlighted with a prominent banner showing current progress. Cycles can be filtered by status (Active, Upcoming, Completed, Draft) and type (FYP1, FYP2). Each cycle card displays the cycle name, academic year, type badge, status indicator, date range, student count, and progress percentage. Quick actions allow cloning previous cycles, setting deadlines in bulk, and transitioning cycle statuses. A timeline view shows overlapping cycles and milestone dates.

---

## 4.6.5 Integration Settings
**URL:** `/admin/integrations`

The Integration Settings screen manages external service connections and API configurations. Integrations are grouped by type: Email (SMTP, SendGrid), Storage (AWS S3, local), Authentication (LDAP, OAuth providers), AI (plagiarism detection, writing assistance), and Notifications (push services, SMS). Each integration displays name, type badge, connection status, last sync time, and configuration summary. Status overview cards show active, inactive, pending, and error counts. Administrators can test connections, update credentials, enable/disable integrations, and view connection logs. An API keys section manages internal API access with creation, rotation, and revocation capabilities.

---

## 4.6.6 Export Configuration
**URL:** `/admin/export`

The Export Configuration screen enables administrators to create and manage data export profiles for reporting and backup purposes. Quick stats show total configurations, recent exports, scheduled exports, and storage used. Export configurations can be created for various data types: Students, Supervisors, Projects, Proposals, Meetings, Logs, and Reports. Each configuration specifies format (CSV, Excel, JSON, PDF), included fields, date range filters, and scheduling options. A quick export section provides one-click exports for common scenarios like student lists, project summaries, and audit logs. Export history tracks all generated files with download links and retention settings.

---

## 4.6.7 Maintenance Center
**URL:** `/admin/maintenance`

The Maintenance Center provides tools for system maintenance, backup, and recovery operations. A system health status banner displays overall system condition (Healthy, Warning, Critical) with key metrics. Quick action cards enable manual database backup, system restore from backup, and cache/temp file cleanup. The health checks section monitors individual services with detailed status information. Recent backups are listed with timestamps, file sizes, types (full, incremental, differential), and restore options. Scheduled maintenance section shows upcoming maintenance windows with descriptions and expected downtime. Administrators can create maintenance schedules, download backup files, and initiate emergency maintenance mode.

---

*Document generated for FYP Supervision System - Admin Module*

## Related Files

- [[docs-project/modules/admin.md]] — Feature inventory that these screens implement
- [[frontend/CLAUDE.md]] — Frontend conventions followed in implementing these screens
- [[docs-project/concepts/frontend-architecture.md]] — Architectural patterns (routing, feature gates, API calls) used in admin screens