flowchart TB
  %% =========================
  %% System Administrator Software Architecture
  %% =========================

  subgraph AdminUI["System Admin Console (React SPA)"]
    UAM["Manage User Accounts & Roles\n(Create/Update/Disable)"]
    PARAM["Configure System Parameters\n(Policy, Quotas, Limits)"]
    CYCLE["Manage FYP Cycles & Deadlines"]
    INTG["Integration & Export Settings"]
    MAINT["System Maintenance\n(Backup/Restore/Monitoring)"]
    AUDV["Audit Log Viewer"]
  end

  subgraph Backend["Spring Boot Backend (Admin APIs)"]
    Auth["Auth & RBAC (Admin-only)"]
    UserSvc["User & Role Management Service"]
    ParamSvc["System Parameter Service"]
    CycleSvc["FYP Cycle & Deadline Service"]
    IntegrationSvc["Integration Setting Service"]
    MaintenanceSvc["Maintenance Orchestrator\n(backup jobs, health checks)"]
    AuditSvc["Audit Log Service"]
    NotiSvc["Notification Service (Admin alerts)"]
  end

  subgraph Data["Persistence"]
    DB[(MySQL)]
    FS[(File Storage / Backups)]
  end

  %% UI -> Backend
  UAM --> Backend
  PARAM --> Backend
  CYCLE --> Backend
  INTG --> Backend
  MAINT --> Backend
  AUDV --> Backend

  %% Backend internal deps
  Backend --> Auth
  Backend --> UserSvc
  Backend --> ParamSvc
  Backend --> CycleSvc
  Backend --> IntegrationSvc
  Backend --> MaintenanceSvc
  Backend --> AuditSvc
  Backend --> NotiSvc

  %% Data
  UserSvc --> DB
  ParamSvc --> DB
  CycleSvc --> DB
  IntegrationSvc --> DB
  AuditSvc --> DB
  NotiSvc --> DB

  MaintenanceSvc --> DB
  MaintenanceSvc --> FS
