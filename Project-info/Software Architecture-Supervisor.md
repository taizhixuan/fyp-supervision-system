flowchart TB
  %% =========================
  %% Supervisor Software Architecture
  %% =========================

  subgraph SupUI["Supervisor Portal (React SPA)"]
    SVD["Supervisor Dashboard / Progress"]
    SVP["Manage Supervisor Profile<br/>Research Areas, Quota, Availability"]
    SVR["Review & Respond Supervisor Requests"]
    SVL["Supervisee List & Project Details"]
    SVPR["Review Student Proposal<br/>View versions + AI results"]
    SVM["Manage Supervision Meetings<br/>Confirm/Reschedule"]
    SVLog["Review/Comment/Sign Meeting Log"]
    SVDOC["Review Documents / Upload Feedback"]
    SVA["Publish Announcements to supervisees"]
    SVNoti["Notifications"]
  end

  subgraph Backend["Spring Boot Backend (Supervisor APIs)"]
    Auth["Auth & RBAC"]
    SupervisorProfileSvc["Supervisor Profile Service"]
    RequestSvc["Supervisor Request Service"]
    ProjectSvc["Project & Supervisee Service"]
    ProposalSvc["Proposal Review Service"]
    MeetingSvc["Meeting Service"]
    LogSvc["Meeting Log & Signature Service"]
    DocSvc["Document Review/Feedback Service"]
    AnnSvc["Announcement Service"]
    NotiSvc["Notification Service"]
    AIClient["AI Client (REST)"]
    AuditSvc["Audit Log Service"]
  end

  subgraph Data["Persistence"]
    DB[(MySQL)]
    FS[(File Storage)]
  end

  subgraph AI["AI Microservices (Flask)"]
    PA["Proposal Analyzer"]
    REC["Supervisor Recommendation - optional view"]
  end

  %% UI -> Backend
  SVD --> Backend
  SVP --> Backend
  SVR --> Backend
  SVL --> Backend
  SVPR --> Backend
  SVM --> Backend
  SVLog --> Backend
  SVDOC --> Backend
  SVA --> Backend
  SVNoti --> Backend

  %% Backend internal deps
  Backend --> Auth
  Backend --> SupervisorProfileSvc
  Backend --> RequestSvc
  Backend --> ProjectSvc
  Backend --> ProposalSvc
  Backend --> MeetingSvc
  Backend --> LogSvc
  Backend --> DocSvc
  Backend --> AnnSvc
  Backend --> NotiSvc
  Backend --> AIClient
  Backend --> AuditSvc

  %% Data
  SupervisorProfileSvc --> DB
  RequestSvc --> DB
  ProjectSvc --> DB
  ProposalSvc --> DB
  MeetingSvc --> DB
  LogSvc --> DB
  DocSvc --> DB
  AnnSvc --> DB
  NotiSvc --> DB
  AuditSvc --> DB

  ProposalSvc --> FS
  DocSvc --> FS

  %% AI calls
  AIClient -->|analyzeProposal| PA
  AIClient -->|recommendSupervisor optional| REC
