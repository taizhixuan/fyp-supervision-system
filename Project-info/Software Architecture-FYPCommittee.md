flowchart TB
  %% =========================
  %% FYP Committee (Coordinator) Software Architecture
  %% =========================

  subgraph FCUI["FYP Committee Portal (React SPA)"]
    FCAnn["Publish FYP Announcements<br/>FYP-wide / targeted"]
    FCQueue["Proposal Review Queue"]
    FCReview["Review Proposal<br/>Approve/Reject/Revision"]
    FCRes["Manage General FYP Documents<br/>Templates/Rubrics/Handbook"]
    FCOverview["Project & Pairing Overview<br/>Load, unpaired, status"]
    FCReport["Generate & Export Reports"]
    FCNoti["Notifications"]
  end

  subgraph Backend["Spring Boot Backend (Committee APIs)"]
    Auth["Auth & RBAC"]
    AnnSvc["Announcement Service<br/>scope + audience"]
    ProposalQueueSvc["Proposal Queue Service"]
    ProposalReviewSvc["Committee Proposal Review Service"]
    ResourceSvc["Resource Document Service"]
    OverviewSvc["Project/Pairing Analytics Service"]
    ReportSvc["Report Export Service"]
    NotiSvc["Notification Service"]
    AuditSvc["Audit Log Service"]
    AIClient["AI Client (REST)"]
  end

  subgraph Data["Persistence"]
    DB[(MySQL)]
    FS[(File Storage)]
  end

  subgraph AI["AI Microservices (Flask)"]
    PA["Proposal Analyzer<br/>display AI results"]
  end

  %% UI -> Backend
  FCAnn --> Backend
  FCQueue --> Backend
  FCReview --> Backend
  FCRes --> Backend
  FCOverview --> Backend
  FCReport --> Backend
  FCNoti --> Backend

  %% Backend internal deps
  Backend --> Auth
  Backend --> AnnSvc
  Backend --> ProposalQueueSvc
  Backend --> ProposalReviewSvc
  Backend --> ResourceSvc
  Backend --> OverviewSvc
  Backend --> ReportSvc
  Backend --> NotiSvc
  Backend --> AuditSvc
  Backend --> AIClient

  %% Data
  AnnSvc --> DB
  ProposalQueueSvc --> DB
  ProposalReviewSvc --> DB
  ResourceSvc --> DB
  OverviewSvc --> DB
  ReportSvc --> DB
  NotiSvc --> DB
  AuditSvc --> DB

  ResourceSvc --> FS
  ProposalReviewSvc --> FS

  %% AI calls
  AIClient -->|analyzeProposal optional refresh| PA
