flowchart TB
  %% =========================
  %% Student Software Architecture
  %% =========================

  subgraph StudentUI["Student Portal (React SPA)"]
    SD["Dashboard"]
    SSD["Supervisor Directory & Search"]
    SAR["AI Supervisor Recommendations"]
    SSR["Supervisor Request"]
    SP["Proposal Module\n(Versioning + AI Check)"]
    SM["Meeting Schedule"]
    SL["Supervision Log\n(Create/Submit/Sign)"]
    SDoc["FYP Documents Upload/Manage"]
    SRes["Guidelines / Rubrics / Deadlines"]
    SNoti["Notifications"]
    SChat["Chatbot"]
  end

  subgraph Backend["Spring Boot Backend (Student APIs)"]
    Auth["Auth & RBAC"]
    StudentSvc["Student/Profile Service"]
    SupervisorSvc["Supervisor Directory Service"]
    RequestSvc["Supervisor Request Service"]
    ProposalSvc["Proposal Service\n(Proposal + Versions + Reviews)"]
    MeetingSvc["Meeting Service"]
    LogSvc["Meeting Log & Signature Service"]
    DocSvc["Project Document Service"]
    ResourceSvc["Resource & Deadline Service"]
    NotiSvc["Notification Service"]
    ChatSvc["Chat Session/Message Service"]
    AIClient["AI Client (REST)"]
    AuditSvc["Audit Log Service"]
  end

  subgraph Data["Persistence"]
    DB[(MySQL)]
    FS[(File Storage)]
  end

  subgraph AI["AI Microservices (Flask)"]
    REC["Supervisor Recommendation"]
    PA["Proposal Analyzer"]
    CB["Chatbot"]
  end

  %% UI -> Backend
  SD --> Backend
  SSD --> Backend
  SAR --> Backend
  SSR --> Backend
  SP --> Backend
  SM --> Backend
  SL --> Backend
  SDoc --> Backend
  SRes --> Backend
  SNoti --> Backend
  SChat --> Backend

  %% Backend internal deps
  Backend --> Auth
  Backend --> StudentSvc
  Backend --> SupervisorSvc
  Backend --> RequestSvc
  Backend --> ProposalSvc
  Backend --> MeetingSvc
  Backend --> LogSvc
  Backend --> DocSvc
  Backend --> ResourceSvc
  Backend --> NotiSvc
  Backend --> ChatSvc
  Backend --> AIClient
  Backend --> AuditSvc

  %% Data
  StudentSvc --> DB
  SupervisorSvc --> DB
  RequestSvc --> DB
  ProposalSvc --> DB
  MeetingSvc --> DB
  LogSvc --> DB
  DocSvc --> DB
  ResourceSvc --> DB
  NotiSvc --> DB
  ChatSvc --> DB
  AuditSvc --> DB

  DocSvc --> FS
  ProposalSvc --> FS

  %% AI calls
  AIClient -->|recommend| REC
  AIClient -->|analyze| PA
  AIClient -->|chat| CB
