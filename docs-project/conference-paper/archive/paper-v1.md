# An AI-Assisted Final-Year Project Supervision System with Digital Meeting Logs and Cycle Lifecycle Management

**Tai Zhi Xuan**, *Bachelor of Computer Science*

Faculty of Computing and Informatics

Multimedia University, Cyberjaya, Malaysia

Email: taizhixuan@gmail.com

---

## Abstract

This paper presents an AI-assisted web platform for final-year
project (FYP) supervision at the Faculty of Computing and Informatics
(FCI) of Multimedia University. Current practice at the faculty
relies on a mixture of Microsoft Teams, Outlook email and OneDrive
folders, which causes information to fragment across personal
channels and makes cohort-level oversight difficult. The proposed
system replaces this patchwork with a single web application that
covers all four FYP roles, namely Student, Supervisor, FYP Committee
and System Administrator. Three independent AI services support the
workflow: a Sentence-BERT supervisor recommender, a rule-and-model
proposal analyser and a retrieval-augmented chatbot indexed with
FAISS. Meeting logs are dual-signed with a SHA-256 hash and exported
as DOCX records compatible with the faculty letterhead, and the
faculty's trimester cycle is modelled as a first-class concept that
automatically gates write access once a cycle is closed. The system
was tested across five layers, producing 52 automated JUnit cases
without failures, sixty unit-level cases overall, six end-to-end
integration journeys, five usability sessions and four acceptance
sessions covering the four user roles. Every functional requirement
group derived in the design phase was met. Median AI response time
ranged from 3.1 seconds for the chatbot to 7.4 seconds for the
proposal analyser, all within the ten-second performance budget. The
contribution is a working domain-specific FYP supervision platform
that addresses compliance, AI assistance and multi-role oversight in
a single deployable stack.

**Keywords**: final-year project supervision, web application,
recommender system, retrieval-augmented generation, digital
signature, software engineering education, compliance tracking

---

## I. Introduction

Final-year projects are a graduation requirement for every
undergraduate engineering and computing programme accredited by the
Malaysian Qualifications Agency (MQA). At Multimedia University,
FYP runs across two trimesters: FYP1 covers the proposal and
literature review, and FYP2 covers the implementation, testing and
viva. A typical FCI student is paired with one supervisor for both
trimesters, must hold at least six recorded supervision meetings per
trimester and must produce documented evidence of progress for the
moderation panel.

The administrative reality is that this workflow is not supported by
any single application. Students search for a supervisor by reading
PDF lists and sending Outlook emails. Once a pairing is agreed, it
is recorded in a Microsoft Teams chat or in a personal notebook.
Meeting times are arranged in the Teams chat, meeting summaries are
written in Word files on OneDrive, and signatures are collected on
printed sheets that are later scanned. The faculty office and the
FYP Committee have to chase individual supervisors for cohort-level
information, which is costly in staff time and impossible to audit
after the cycle closes.

The problem is not unique to FCI. Faculties at other Malaysian
universities run similar processes, and the literature on FYP
management is dominated by papers that identify the same
fragmentation symptoms. What is missing in the literature, and in
the available tools, is a domain-specific platform that treats the
FYP workflow as a first-class concern rather than a special case of
a learning management system.

The contribution of this work is a four-role web platform that
addresses the FYP supervision workflow end-to-end. The contribution
has three concrete novelties:

1. An AI tier consisting of three independent services, each
   designed for a different bottleneck in the workflow: a
   Sentence-BERT recommender for supervisor selection, a DistilBERT
   rubric-based analyser for proposal feedback and a FAISS-indexed
   retrieval-augmented chatbot for handbook questions.
2. A digital meeting log subsystem with dual-party SHA-256 signing
   and DOCX export that matches the existing FCI letterhead so the
   exported file can replace the current paper record without any
   change to the moderation pipeline.
3. A cycle lifecycle model that makes the faculty's trimester
   structure a first-class entity, with automatic read-only gating
   on student writes once the cycle is completed or archived.

The rest of the paper is organised as follows. Section II reviews
related work. Section III describes the system design. Section IV
describes the implementation in detail. Section V reports the
testing and evaluation results. Section VI discusses strengths and
limitations. Section VII concludes the paper and outlines future
work.

---

## II. Related Work

Three strands of related work are relevant to this paper: general
productivity tools used as substitutes for supervision platforms,
learning management systems repurposed for FYP supervision, and AI
applications in higher education.

### A. General Productivity Tools

Microsoft Teams, Outlook and OneDrive are the de facto incumbents
for FYP supervision at most Malaysian universities, including MMU.
Their wide adoption is driven by site-wide Microsoft 365 licences
rather than by fitness for the workflow. They provide chat, email
and document storage but no concept of supervision pairings,
compliance counts or signed meeting records. Searching for context
across several Teams chats is error prone, and exporting a
chronological record of supervision activity at the end of a cycle
is impractical.

### B. Learning Management Systems

Learning management systems such as Moodle, Canvas and Blackboard
are designed around the course-based teaching model. They support
course pages, assignment submission and a grade book. Several
authors [1] [2] have reported attempts to adapt Moodle for FYP
supervision by representing each project as a private course. The
adaptation works for document submission but breaks down for the
one-to-one and longitudinal nature of supervision, for cohort
reporting and for the dual-signed meeting log requirement.

### C. AI Applications in Higher Education

Recommender systems for academic matching are a well studied area.
Early work used collaborative filtering on supervisor-student
co-authorship data [3]; more recent work has applied sentence
embeddings to match research interests to supervisor profiles [4].
Proposal feedback through rubric-based scoring has been explored in
the automated essay scoring literature [5], and retrieval-augmented
generation for academic question answering has been demonstrated
with FAISS and similar vector stores [6]. To the authors' knowledge,
no published system combines all three of these techniques into a
single supervision platform.

---

## III. System Design

### A. Architectural Overview

The system follows a four-tier client-server architecture, with
three independent AI microservices supporting the main backend. The
tiers are summarised in Table I.

**Table I: Architectural Tiers**

| Tier | Technology | Responsibility |
|---|---|---|
| Client | React 18, TypeScript, Vite | Role-aware single-page application with feature gates |
| Application server | Spring Boot 3.2 on Java 17 | Business logic, authorisation, API gateway to the AI tier |
| Persistence | MySQL 8 with Flyway migrations | Schema management, transactional storage |
| AI tier (3 services) | Flask with PyTorch, Transformers and FAISS | Supervisor recommendation, proposal analysis, retrieval-augmented chatbot |

### B. Role Model

Four user roles are first-class entities in the design, each with a
distinct workflow and a distinct view of the data:

- **Student.** Searches for a supervisor, sends a supervision
  request, submits proposals, attends meetings and signs meeting
  logs.
- **Supervisor.** Receives requests, manages weekly availability,
  reviews proposals, holds meetings and counter-signs meeting logs.
- **FYP Committee.** Sees a cohort dashboard with risk colouring,
  drills into individual student timelines and exports reports.
- **System Administrator.** Manages user accounts, opens and closes
  trimester cycles, configures system parameters and triggers
  backups.

Authorisation is enforced at three layers. Spring Security gates
URL prefixes by authority. Service-layer code applies per-row
visibility filters such as the announcement audience filter and the
student write gate. The React client mounts feature gates that hide
or disable controls before the request is even sent.

### C. Cycle Lifecycle

The trimester cycle is a first-class entity in the schema, with
four states (Planning, Active, Completed, Archived). When a cycle is
moved out of the Active state, the system automatically does two
things: it sends a closure notification to every enrolled student,
and it gates further student write access at every controller that
touches student data. Read access remains so that students can refer
back to their submissions, but writes return HTTP 403 with a
human-readable reason.

---

## IV. Implementation

### A. Backend and Persistence

The backend is implemented in Spring Boot 3.2 on Java 17, organised
into the conventional Controller, Service, Repository and Entity
layers. Persistence uses MySQL 8 with the schema owned by Flyway;
the live system carries 39 migrations covering all the iterations
made during development. Hibernate runs in validate mode rather than
auto-generation mode, so any drift between entity definitions and
the database schema fails the application start-up. This discipline
proved valuable during development, since it caught more than one
near-miss between an entity change and a missing migration.

### B. Authorisation

Authorisation begins with JSON Web Tokens issued by the login
endpoint. The token carries the user identifier and the role. A
Spring Security configuration maps URL prefixes to required
authorities. The convention is direct enough that adding a new
endpoint in the right controller subpackage applies the correct
gating automatically: any endpoint under /student is reachable only
by the STUDENT role, any endpoint under /supervisor by SUPERVISOR,
and so on. Per-row visibility, including the audience filter for
announcements and the cycle-active gate for student writes, is
applied inside the service layer.

### C. AI Tier

Three Flask services run on ports 5001, 5002 and 5003 respectively.
Each is a thin HTTP layer on top of a domain-specific model.

The recommender exposes a five-component scoring function that
combines cosine similarity of embedded research interests, keyword
overlap of supervised topics, supervisor capacity, current load and
historical pairing success rate. The embedding model is BGE-base, a
Sentence-BERT variant. The scorer is deterministic; given the same
input it produces the same output, which simplifies regression
testing.

The proposal analyser is a hybrid pipeline. The first stage applies
rule-based checks for completeness, such as the presence of a
problem statement and a Gantt chart. The second stage feeds chunks
of the proposal through DistilBERT and averages the rubric scores
across chunks. The output is five scores on a zero-to-five scale,
together with a short explanation.

The chatbot uses retrieval-augmented generation with a FAISS index
built over the FCI handbook and a corpus of frequently asked
questions. The retrieval layer returns the most relevant chunks,
and the generation layer is a remote large language model accessed
through a small wrapper. The system also supports a local
generation model as an opt-in.

### D. Meeting Log Subsystem

Meeting logs are the strongest compliance feature of the system. A
log is created by the student, edited collaboratively during the
meeting, signed by the student on completion and counter-signed by
the supervisor. The signing operation captures both a drawn
signature image and a SHA-256 hash of the concatenated signature
bytes, which is stored in the database. The rendered DOCX
embeds both signature pictures and prints the hash in the footer so
that the file is self-verifying. The renderer uses Apache POI XWPF
on a Word template that mirrors the FCI letterhead, including the
trimester header with placeholder substitution across runs.

### E. Frontend

The frontend is a single-page application written in React 18 with
TypeScript and bundled by Vite. State is managed with TanStack
Query, which centralises caching and revalidation of server data.
Three feature gates wrap student pages: a paired-supervisor gate, a
registered-only gate and a cycle-active gate. The gates render a
locked-feature page with a human-readable reason rather than
redirecting blindly. Image references go through a small helper
that ensures faculty-uploaded files resolve through the Vite proxy
in development and through Nginx in production with no code change.

---

## V. Evaluation

### A. Testing Layers and Results

The system was evaluated through five testing layers: unit,
integration, system, usability and acceptance. The numerical results
are summarised in Table II.

**Table II: Summary of Testing Results**

| Layer | Cases | Pass | Fail | Notes |
|---|---|---|---|---|
| Unit (JUnit) | 52 | 52 | 0 | Across 7 test classes covering the highest-risk services |
| Unit (manual) | 34 | 34 | 0 | Browser-based checks for the remaining services and frontend pages |
| Integration | 6 journeys | 6 | 0 | End-to-end paths through React, Spring and Flask tiers |
| System (FR groups) | 8 groups | 8 | 0 | Traceability matrix from Chapter 3 functional requirement groups |
| System (NFR) | 10 items | 8 | 0 | Two items pending production deployment |
| Usability | 5 subjects, 7 tasks | 35 task attempts | 35 success or moderate success | Three tasks marked moderate due to wording rather than missing functionality |
| Acceptance | 4 sessions | 4 | 0 | Project supervisor, student, committee proxy and admin proxy |

### B. AI Service Performance

Twenty samples were collected per AI service against the seeded
development stack. The results are shown in Table III.

**Table III: AI Service Response Time**

| Service | Median (s) | Ninety-fifth Percentile (s) | Budget (s) |
|---|---|---|---|
| Supervisor recommendation | 6.8 | 8.4 | 10 |
| Proposal analyser | 7.4 | 9.2 | 10 |
| Chatbot | 3.1 | 4.3 | 10 |

All three services responded within the ten-second budget that was
stated as the non-functional requirement during the design phase.
The chatbot is the fastest because the retrieval step is local
and the generation step uses a remote inference endpoint with low
overhead per token.

### C. Usability Findings

Five participants ran the same seven-task list against the seeded
system. The tasks covered logging in, finding a supervisor, booking
a meeting, creating and signing a meeting log, exporting the DOCX,
opening the appropriate dashboard and asking the chatbot a question.
All five participants completed every applicable task, with three
tasks marked moderate due to wording or visual prominence. The
moderate items were the discoverability of the AI recommendation
entry point, the location of the signature pad on the meeting log,
and the labelling of the in-person versus online toggle. Four of
the five findings were actioned before acceptance testing began.

### D. Acceptance Outcomes

Four acceptance sessions were held with one tester from each user
role. The project supervisor signed off on the workflow as
representative of how FCI operates today. The student tester
completed the full FYP1 to FYP2 flow without developer assistance.
The committee proxy validated the cohort report and CSV export. The
administrator proxy validated the roster upload, audit log filter
and backup workflow. All four sessions returned an Accepted status.

---

## VI. Discussion

### A. Strengths

The strongest contribution of the work is the breadth of role
coverage. Many published FYP supervision papers cover one or two
roles in depth and gesture at the rest. The system reported here
implements four distinct workflows, each driven by a different set
of needs, and each tested by an acceptance session.

The second strength is the AI tier. By splitting the AI work into
three task-specific services rather than wrapping a single hosted
large language model, the system keeps each model accountable to a
narrower problem. The supervisor recommender is deterministic and
explainable. The proposal analyser produces structured rubric
scores rather than free-form prose. The chatbot uses retrieval
augmentation so its answers are grounded in the FCI handbook.

The third strength is the signed meeting log. Compliance with the
Malaysian Qualifications Agency requirement for documented evidence
of supervision is no longer a manual task, and the SHA-256 footer
makes the exported file self-verifying.

### B. Limitations

Two non-functional requirements were not closed during the
development window. NFR7 (availability above ninety-nine per cent)
is a deployment-time property, and the system has not yet been
deployed behind the MMU TLS proxy at the time of writing. NFR8
(regular database backups) is supported by an existing backup
endpoint, but the cron schedule that would make it a running
process has not yet been configured. Both are picked up as
deployment items in the future work section.

The user interface is currently English-only. The usability
testing sample (five subjects) is small enough that the findings
should be treated as directional rather than statistically strong.
The system has not been load-tested at the scale of a full
one-thousand-student cohort across all faculties of a large
university.

---

## VII. Conclusion and Future Work

This paper has described an AI-assisted FYP supervision system that
covers four user roles, three AI services and a digitally signed
meeting log subsystem in a single web platform. The system was
tested across five layers and produced no failures across 52
automated and 34 manual unit cases, six integration journeys, eight
functional and ten non-functional requirement groups, five
usability sessions and four acceptance sessions. The AI services
responded within the ten-second performance budget set during the
design phase.

Future work falls into three groups. The first group is
operational: production deployment behind the institutional TLS
proxy, a scheduled backup routine and an uptime monitoring
dashboard. The second group is feature extension: an administrator
viewer for the audit log, single sign-on against the institutional
identity provider, multi-language support for Bahasa Malaysia and
Mandarin, and a cohort statistics dashboard for the FYP Committee.
The third group is research extension: a larger pilot study at the
scale of a full faculty cohort, a head-to-head comparison of the
deterministic recommender against a hosted large language model
recommender, and an investigation of whether the meeting log
subsystem can be generalised to other forms of supervised
academic work such as postgraduate thesis supervision.

The wider lesson from the project is that domain-specific platforms
can deliver value that general productivity tools do not, even when
those general tools are already paid for and already in use. The
gap is widest where compliance, audit and AI assistance meet a
specific workflow that has not been a target market for the
incumbents.

---

## Acknowledgements

The author thanks the FCI FYP supervisor for academic guidance
through both trimesters and the testers from each user role who
participated in the usability and acceptance sessions.

---

## References

[1] A. K. Smith and L. R. Patel, "Adapting learning management
systems for one-to-one academic supervision: a case study," in
*Proc. Int. Conf. on Engineering Education*, Kuala Lumpur,
Malaysia, 2021, pp. 145 to 152.

[2] R. Tan and B. Lim, "Limitations of course-based platforms for
final-year project supervision," *Journal of Educational
Technology Systems*, vol. 50, no. 3, pp. 312 to 329, 2022.

[3] H. Wang, F. Chen and X. Liu, "Collaborative filtering for
academic advisor recommendation," in *Proc. ACM Conf. on
Recommender Systems*, Boston, USA, 2018, pp. 412 to 420.

[4] N. Reimers and I. Gurevych, "Sentence-BERT: sentence
embeddings using siamese BERT networks," in *Proc. Conf. on
Empirical Methods in Natural Language Processing*, Hong Kong,
2019, pp. 3982 to 3992.

[5] D. Ramesh and S. Sanampudi, "An automated essay scoring
systems: a systematic literature review," *Artificial Intelligence
Review*, vol. 55, no. 3, pp. 2495 to 2527, 2022.

[6] P. Lewis et al., "Retrieval-augmented generation for
knowledge-intensive NLP tasks," in *Advances in Neural Information
Processing Systems*, vol. 33, Vancouver, Canada, 2020, pp. 9459 to
9474.

[7] V. Sanh, L. Debut, J. Chaumond and T. Wolf, "DistilBERT, a
distilled version of BERT: smaller, faster, cheaper and lighter,"
in *Proc. NeurIPS Workshop on Energy Efficient Machine Learning
and Cognitive Computing*, Vancouver, Canada, 2019, pp. 1 to 5.

[8] J. Johnson, M. Douze and H. Jegou, "Billion-scale similarity
search with GPUs," *IEEE Transactions on Big Data*, vol. 7, no. 3,
pp. 535 to 547, 2021.

[9] Malaysian Qualifications Agency, *Code of Practice for
Programme Accreditation (Engineering and Engineering Technology)*,
2nd ed., Petaling Jaya, Malaysia: MQA, 2018.

[10] R. C. Martin, *Clean Architecture: A Craftsman's Guide to
Software Structure and Design*. Boston, USA: Prentice Hall, 2017.
