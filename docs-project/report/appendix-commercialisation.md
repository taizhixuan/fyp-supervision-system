# Appendix: Commercialisation Proposal

This appendix presents a commercialisation proposal for the FYP
Supervision System, written in the format set out by the FCI FYP2
Commercialisation Proposal Guidelines. The proposal treats the system
as a product that other faculties and other universities could
license, rather than a one-off project for MMU FCI.

---

## 1. Executive Summary

The FYP Supervision System is a web platform that brings the full
final-year project workflow into one place. Students, supervisors, the
FYP Committee and the system administrator each have their own role
on the platform, and the four roles share a single source of truth
for pairings, meetings, proposals, documents and announcements.

Faculties today run this workflow across several disconnected tools
such as Microsoft Teams chats, Outlook email threads and OneDrive
shared folders. Information is split across these channels and is
hard to audit at the end of a trimester. The proposed system replaces
the patchwork with one application that is purpose-built for the
final-year project workflow, with three AI services that assist with
supervisor matching, proposal feedback and frequently asked
questions, and a digital meeting log that is signed by both parties
and exported as an official record.

Initial deployment is at MMU FCI as the pilot site. After the pilot
year, the system can be offered to other faculties within MMU and
then to other Malaysian universities that run similar FYP programmes.
The revenue model is an annual per-institution subscription with an
optional add-on for the AI services. The business is expected to
become profitable in the second year of operation once two or three
paying institutions are onboarded.

---

## 2. Market Analysis

### 2.1 Target Customers and Customer Segments

The primary target customer is the academic faculty that runs an
undergraduate final-year project programme. Within that segment, the
buyers and end users are not the same people, so the proposal
identifies both.

| Segment | Role | Why They Care |
|---|---|---|
| Primary buyer | Faculty dean or FYP committee chair | Wants a defensible compliance record, a faster onboarding cycle for students, and reduced staff workload during peak weeks |
| Procurement gatekeeper | University IT department | Wants something that fits the existing infrastructure, that does not duplicate Microsoft 365 licences, and that is easy to host on standard Linux servers |
| End user (largest by volume) | Undergraduate final-year student | Wants to be paired with a supervisor quickly, to know what is due and when, and to keep a personal record of supervision meetings |
| End user (academic) | Project supervisor | Wants supervisee progress at a glance, fewer disconnected message threads, and signed meeting logs for the moderation panel |
| End user (administrative) | Faculty office staff | Wants to onboard a new cohort without IT help, to broadcast announcements to the right group, and to export reports for accreditation visits |

The early geographic market is Malaysia, where FYP programmes are
mandatory for engineering and computing degrees. The Malaysian
Qualifications Agency requires that universities keep documented
evidence of supervision activity for at least five years, and a
typical Malaysian university has between one thousand and three
thousand FYP students enrolled across all faculties in a given year.
The ASEAN region as a whole has a similar regulatory pattern, so
expansion to Indonesia, Vietnam, Thailand and the Philippines is a
realistic medium-term move.

### 2.2 Competitor Landscape

The system competes against three categories of incumbent solution.

| Category | Examples | What They Offer | Where They Fall Short |
|---|---|---|---|
| General productivity tools | Microsoft Teams, Outlook, OneDrive, SharePoint | Chat, email, document storage, calendar | Not designed for FYP supervision; no compliance tracking; no AI matching; logs are scattered across threads and folders |
| Generic learning management | Moodle, Canvas, Blackboard | Course pages, assignment submission, grade book | Treats FYP as a course, which fits poorly because supervision is one to one and runs for two trimesters, not one |
| Bespoke faculty systems | Each university tends to build a small in-house tool, often a SharePoint list with custom views | Local fit | Heavy maintenance cost, no AI features, hard to upgrade once the staff member who built it leaves |
| Project management tools | Asana, Trello, ClickUp, Monday | Task tracking, boards, deadlines | Not academic; no role-based access for committee or administrator; no concept of trimester cycles |

Among these, the Microsoft 365 stack is the strongest incumbent
because it is already paid for and already used. The competitive
position of the proposed system rests on doing one thing that
Microsoft 365 cannot do, which is the FYP-specific workflow with
compliance enforcement, signed meeting logs and AI matching, all in
one place.

---

## 3. Problem Statement

The faculty office, the project supervisors and the students each run
into a different version of the same root problem: there is no single
place where the FYP workflow lives.

A student starting FYP1 has to find a supervisor by reading static
PDF lists, by sending Outlook emails to several lecturers and by
waiting for a reply that is often delayed during the busy weeks. Once
a supervisor agrees, the pairing is written down in a Microsoft Teams
chat or in the supervisor's notebook, but nothing automatically marks
the student as paired in the faculty office record. Meeting times are
arranged in a Teams chat, meeting summaries are written in a Word
file on OneDrive, and signatures are collected on a printed sheet
that is later scanned and emailed back. A student who needs to know
their own compliance status with the FCI six-meeting rule must count
the entries by hand.

A supervisor with eight supervisees has eight separate Teams chats,
eight folders in OneDrive and a personal spreadsheet for tracking
progress. Important reminders are easy to lose in the cross-traffic
of teaching, research and administrative email. At the end of the
trimester, the supervisor has to compile a moderation report by
hand, copying entries from several sources.

The faculty office and the FYP Committee have the hardest task.
Their job is to look across the entire cohort and identify students
who are falling behind, but the information needed for that view is
spread across personal Teams chats, individual OneDrive folders and
private supervisor notebooks. Cohort-level reporting is essentially
done by chasing individual supervisors for an update.

The needs that come out of this picture are:

- one canonical place to record who supervises whom, with the office
  automatically updated when a pairing is made;
- compliance tracking that runs in the background and shows each
  student a clear progress indicator;
- meeting logs that are signed by both parties and stored as official
  records, without printing and scanning;
- a way for the committee to see the whole cohort at once and act on
  the at-risk students before the end of the trimester;
- help for students who do not know which supervisor matches their
  interests, beyond browsing a long list.

---

## 4. Unique Value Proposition

The FYP Supervision System is the only platform on the Malaysian
market that combines all five of the following in one product.

1. Purpose-built for the FYP workflow rather than retrofitted from a
   general tool. The cycles, the six-log rule, the dual-party
   signature on a meeting log and the four role groups are first
   class concepts in the system, not features bolted on.
2. Three AI services that assist the parts of the workflow most
   prone to friction. The recommender helps students find a
   supervisor whose work matches their interests. The proposal
   analyser gives students a structured rubric score before they
   submit. The chatbot answers the handbook questions that today
   flood the faculty office.
3. A meeting log with SHA-256 signed records and DOCX export. The
   exported file matches the existing FCI letterhead so faculty can
   accept it as the official record without changing their internal
   process.
4. Cohort-level reporting for the committee with risk colouring, CSV
   export and drill-down into individual student timelines. This
   reproduces in a few clicks what currently takes a committee chair
   several days of chasing.
5. Cycle lifecycle handling. The system understands that a faculty
   operates in trimester cycles, that an active cycle is different
   from a completed one and that data must remain readable but
   read-only after the cycle has closed.

The strengths of the system against the alternative of staying on
Microsoft 365 are summarised in the table below.

| Capability | Microsoft 365 Stack | Moodle | FYP Supervision System |
|---|---|---|---|
| Single canonical pairing record | No | Partial | Yes |
| Six-log compliance tracking | No | No | Yes |
| Digital signature on meeting logs | No | No | Yes |
| AI supervisor recommendation | No | No | Yes |
| AI proposal rubric feedback | No | No | Yes |
| Cohort risk view for committee | No | Partial | Yes |
| Cycle lifecycle and read-only gate | No | No | Yes |
| Bilingual or multilingual UI | Yes | Yes | Planned in Year 2 |

---

## 5. Objectives

The commercialisation objectives are stated below in point form so
that progress can be measured against them.

1. Sign at least one paying customer within twelve months of the
   pilot conclusion.
2. Reach annual recurring revenue of fifty thousand Malaysian
   ringgit by the end of the second commercial year.
3. Reduce average time from start of trimester to confirmed
   student-supervisor pairing from three weeks (current baseline at
   the pilot faculty) to one week or less.
4. Achieve a daily-active-user rate of seventy per cent among
   enrolled FYP students at any subscribing institution.
5. Achieve a compliance rate of ninety per cent for the six-meeting
   requirement at any subscribing institution by the end of the
   first full trimester of use.
6. Reduce the time the faculty office spends on compiling
   end-of-trimester reports from an estimated two working days to
   under two hours.
7. Reach three subscribing institutions by the end of the third
   commercial year.

Each objective is measurable from data already collected by the
system, so an annual review can be carried out without additional
instrumentation.

---

## 6. Methods and Scope of Work

The methods are the same set of technologies described in Chapter 5
of the report. They are repeated here in business terms.

The system uses Spring Boot on Java 17 for the main application,
React with TypeScript for the front end, MySQL 8 for the database
and three independent Flask services for the AI components.
Everything is packaged in Docker Compose so the same stack runs on a
developer laptop, on a faculty test server and on a production
cloud instance with no change to the application code.

The scope of work for the pilot phase covers the entire FYP1 and
FYP2 cycle: registration, supervisor selection, proposal
submission, meeting management, meeting log creation and signing,
document exchange, committee reporting and end-of-cycle archival.
The scope explicitly excludes grading, since grading at MMU FCI is
handled by a separate moderation panel outside this system; a
grading module is listed as a future feature rather than an MVP
requirement.

The innovativeness of the solution lies in three places. First, the
three-service AI tier is unusual in this domain; most education
platforms either avoid AI altogether or wrap a single hosted large
language model behind a chat interface. Splitting the AI work into a
deterministic recommender, a rule-and-model proposal analyser and a
retrieval-augmented chatbot keeps each model accountable to the task
it is good at. Second, the dual-party SHA-256 signed meeting log is
a feature most other systems leave to a printed sheet, but it is
exactly the feature that satisfies the Malaysian Qualifications
Agency requirement for evidence of supervision. Third, the cycle
lifecycle with automatic read-only gating reflects how a real
faculty operates rather than how a software vendor might imagine it
operates.

---

## 7. Business Model

### 7.1 Revenue Streams

The product is sold as a subscription, with three lines of revenue.

| Revenue Line | Description | Indicative Pricing (RM, per academic year) |
|---|---|---|
| Core platform subscription | The base application with all four role groups and the meeting log workflow | 25,000 to 80,000 depending on faculty size |
| AI services add-on | Bundled licence for the recommender, analyser and chatbot | 10,000 to 30,000 |
| Setup and customisation | One-time fee covering branding, integration with the institution's identity provider, and a half-day staff training session | 8,000 to 15,000 |

A discount of twenty per cent applies for the first two pilot
customers in any new country.

### 7.2 Cost Side

The main cost categories are listed below with their first-year
estimate in Malaysian ringgit.

| Cost Category | Description | First-Year Estimate (RM) |
|---|---|---|
| Cloud hosting | Two production environments and one staging environment on a regional cloud provider | 24,000 |
| AI inference | GPU-hour budget for the proposal analyser, plus a small allocation for the chatbot retrieval index | 12,000 |
| Development | One full-time developer salary (the founder), or two part-time engineers | 96,000 |
| Sales and marketing | Conference attendance, faculty visits, demonstration material | 8,000 |
| Legal and accounting | Company registration, contract templates, basic accounting | 6,000 |

### 7.3 Path to Profitability

With the pricing above, a single mid-sized faculty customer brings
in roughly RM 75,000 per academic year for the platform plus the AI
add-on. Three such customers by the end of the second year would
generate annual recurring revenue of about RM 225,000, against an
estimated cost base of about RM 150,000 once the team grows to two
people. The business therefore reaches positive operating margin in
year two and pays back the initial investment by year three.

---

## 8. Milestones and Key Metrics

### 8.1 Milestones

**Table A.1: Twenty-Four-Month Milestone Plan**

| Month | Milestone | Measurable Outcome |
|---|---|---|
| 0 | Pilot launch at MMU FCI | System live for one full FYP cycle |
| 3 | First written feedback from pilot supervisors and students | Survey response rate above sixty per cent |
| 6 | Pilot review and feature backlog refresh | Documented decision on production deployment |
| 9 | Production deployment behind the MMU TLS proxy | Uptime above ninety-eight per cent over four weeks |
| 12 | First paying customer signed | Signed contract and first invoice |
| 15 | Multi-language interface released | Bahasa Malaysia and English both supported |
| 18 | Second paying customer onboarded | Two production tenants live |
| 21 | Mobile companion application beta | Available on Android and iOS |
| 24 | Third paying customer onboarded | Annual recurring revenue at or above target |

### 8.2 Key Metrics

The following metrics are tracked from the live system. They are
reviewed monthly with the pilot faculty and quarterly with paying
customers.

- Number of subscribing institutions.
- Number of enrolled FYP students across all tenants.
- Daily active user count per tenant.
- Average time from cycle start to confirmed student-supervisor
  pairing.
- Six-meeting compliance rate at end of trimester.
- Number of meeting logs signed by both parties.
- AI service response time at the ninety-fifth percentile.
- Customer retention rate after first renewal cycle.
- Net Promoter Score from end-of-year survey.

---

## 9. Project Outcome

A successful outcome for the project, both academically and
commercially, is described below at three time horizons.

In the short term, by the end of the FYP2 cycle, the system runs
correctly through one full pilot cycle at MMU FCI. All four roles
have used the system in production. Acceptance testing has been
signed off by the supervisor and one representative of each user
role. The system has produced exportable, signed meeting log records
that the faculty can place into its moderation files without
reformatting.

In the medium term, within twenty-four months, the system has been
moved off the developer laptop and onto a managed cloud environment.
At least three paying customer institutions are live, of which two
are outside MMU. The AI tier has been retrained on a wider corpus of
supervisor profiles, and the chatbot answers questions from at least
two faculty handbooks in addition to the original FCI handbook.

In the longer term, within five years, the system serves as the
default supervision platform for at least one Malaysian university
across all of its faculties, and has at least one paying customer in
each of three ASEAN countries. The product is recognised in the
education sector as the specialist option for FYP supervision, in
the same way that there are specialist tools for thesis examination
and conference management today.

---

## 10. SWOT Analysis

### 10.1 Strengths

- Purpose-built for the FYP supervision workflow, including the
  trimester cycle, the dual-party signed meeting log and the
  committee oversight view. None of these are first-class concepts in
  general productivity tools.
- Three independent AI services covering supervisor matching,
  proposal feedback and handbook questions. Each service can be
  improved or replaced without disturbing the other two.
- Layered authorisation built around four user roles with both URL
  gating and per-row visibility filtering, which closely matches the
  way academic compliance is audited.
- Containerised stack that runs on standard Java, MySQL and Python
  infrastructure, with no vendor lock-in and a low barrier to
  deploy.
- A working pilot already running at MMU FCI, with a paper trail of
  acceptance testing and a demonstrable user base from the start.

### 10.2 Weaknesses

- The team is small, currently one developer. Scaling support for
  several customer institutions at once requires a second hire
  before the third customer is signed.
- The product is English-only for the moment. Multi-language support
  is on the roadmap but the work is not yet started.
- The product has not yet been load-tested at the scale of a full
  one-thousand-student cohort across all faculties of a large
  university. Performance is known to hold for the pilot scale but
  not yet for the largest target deployment.
- The brand is unknown outside the pilot institution. Establishing
  trust with procurement and IT teams at a new university takes
  time, since the FYP workflow runs on a yearly cycle and procurement
  decisions are usually made once per year.
- The capital requirement for two full production-grade cloud
  environments, plus reserved GPU capacity for the AI services, is
  non-trivial for a one-person founder team and will need either
  early customer revenue or a small seed investment to cover.

### 10.3 Opportunities

- The Malaysian higher education market has many universities
  running similar FYP programmes, and none of them appears to have a
  purpose-built supervision platform of the kind described here.
  The market is therefore underserved by definition.
- The Malaysian Qualifications Agency continues to tighten its
  requirements for evidence of supervision. A signed and timestamped
  digital record is increasingly valuable as a compliance artefact.
- The wider ASEAN region runs similar regulatory frameworks, which
  makes geographic expansion easier than expanding into a
  different regulatory regime such as the European Union.
- The AI tier is a clear point of differentiation. As universities
  become more comfortable with AI-assisted tools, demand for an
  AI-aware FYP platform is likely to grow rather than shrink.
- Intellectual property in the meeting log rendering pipeline, the
  five-component recommendation scorer and the cycle lifecycle
  model is original and could be defended through copyright or, if
  appropriate, through a patent on the signing-and-export flow.

### 10.4 Threats

- Microsoft and Google could decide to add FYP-style templates to
  their existing Teams and Classroom products. They would not match
  the depth of the FYP-specific workflow, but they would match the
  pricing (often bundled with existing site licences). Mitigation
  is to keep the product feature gap visible and to focus on the
  parts of the workflow that the incumbents cannot easily replicate,
  namely the dual-signed meeting log and the AI tier.
- A university IT team could decide to build an in-house equivalent
  using a SharePoint list, a Power Automate flow and an OpenAI key.
  The result will usually be brittle and unsupported once the
  internal champion leaves, but it can stall a sales conversation
  for one or two cycles. Mitigation is to demonstrate total cost of
  ownership over three years rather than first-year cost alone.
- An open-source competitor could appear, perhaps from a research
  group at another university. Mitigation is to keep moving on the
  AI features and the customer service experience, which are
  harder to replicate than the core application.
- A change in the regulatory landscape, for example the introduction
  of a centralised national platform mandated by the Ministry of
  Higher Education, could displace the product in Malaysia.
  Mitigation is to maintain the option of selling the product to
  the Ministry itself, rather than to individual universities.
- Currency and inflation pressure on cloud infrastructure costs
  could compress margins. Mitigation is to negotiate annual rather
  than monthly cloud commitments once the customer base is stable.

---

## Reference

https://templates.office.com/en-US/Business-Plans
