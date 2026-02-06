flowchart LR
  subgraph Clients["Client Layer (Web Browser)"]
    S[Student Browser]
    SV[Supervisor Browser]
    FC[FYP Committee Browser]
    SA[System Admin Browser]
  end

  I[(Internet / HTTPS)]

  subgraph App["Application Layer (FYP Web Server)"]
    FE["React SPA Frontend"]
    BE["Spring Boot Backend (REST API)"]

    AUTH["Auth & RBAC (Spring Security/JWT)"]
    NOTI["Notification Service"]
    DOCS["Document Service"]
    AUD["Audit Logging Service"]
    AIClient["AI Integration Client (REST calls)"]
  end

  subgraph Data["Data Layer"]
    DB[(MySQL Database)]
    FS[(File Storage<br/>Local/Cloud Object Storage)]
  end

  subgraph AI["AI Microservices Layer (Python/Flask)"]
    REC["Supervisor Recommendation Service<br/>TF-IDF + Cosine Similarity"]
    PA["Proposal Analyzer Service<br/>NLP Rules/spaCy"]
    CB["FYP Chatbot Service"]
  end

  S --> I --> FE
  SV --> I --> FE
  FC --> I --> FE
  SA --> I --> FE

  FE -->|REST/JSON| BE

  BE --> AUTH
  BE --> NOTI
  BE --> DOCS
  BE --> AUD
  BE --> AIClient

  BE --> DB
  DOCS --> FS
  BE --> FS

  AIClient -->|/recommendSupervisor| REC
  AIClient -->|/analyzeProposal| PA
  AIClient -->|/chatbotQuery| CB
