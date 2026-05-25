# Chapter 7: Conclusion

This final chapter looks back at the FYP Supervision System as a
whole. It checks each of the project objectives against what was
actually built, points out the parts of the system that work well and
the parts that still have rough edges, sets out the work that would
make sense as a follow-up, and ends with a short reflection on what
the project taught the developer along the way.

---

## 7.1 Overview

The FYP Supervision System is a four-role web application built for
the MMU Faculty of Computing and Informatics. It replaces the
paper-and-WhatsApp process that the faculty has used for years with a
single web platform that the four parties — students, supervisors,
the FYP Committee and the system administrator — can use in one
place. Three independent AI services sit behind the main application:
one recommends supervisors to students, one gives feedback on
proposals, and one answers handbook questions through a chatbot. The
implementation is described in Chapter 5 and the verification work is
recorded in Chapter 6.

The work over the two-trimester FYP block produced 39 Flyway
migrations, 36 JPA entities, 47 Spring controllers, 24 services, and
a React front end with role-based routing and feature gates. The
system was tested across five layers and accepted by the project
supervisor and one tester from each of the four user roles.

---

## 7.2 Achievement of Project Objectives

The objectives stated in Chapter 1 were used as the success criteria
for the project. Each objective is mapped below to the chapter or
section that delivered it, together with a short note on the
evidence that supports the claim.

**Table 7.1: Project Objectives and Delivered Outcomes**

| # | Project Objective | Delivered In | Evidence |
|---|---|---|---|
| 1 | Design and develop a web-based FYP supervision system that supports the four MMU FCI roles | Sections 5.5.1–5.5.4, 5.5.9, 5.5.10 | All four role workflows are implemented and were exercised by role-specific acceptance testers (Tables 6.22–6.25) |
| 2 | Integrate AI services for supervisor matching and proposal feedback | Sections 5.5.3, 5.5.5, 5.5.11 | Three Flask services run on ports 5001, 5002 and 5003; integration journeys 1 and 5 in Section 6.2 confirm they reply within the 10 s NFR budget |
| 3 | Implement digital meeting logs with dual digital signatures and FCI 6-log compliance | Section 5.5.6 | 15 JUnit cases in `MeetingLogDocumentServiceTest` and 5 in `MeetingLogComplianceServiceTest`; bulk DOCX export verified by acceptance testers |
| 4 | Centralise announcements, document exchange and an FAQ chatbot | Sections 5.5.8, 5.5.2, 5.5.4, 5.5.11 | Audience-aware announcements with 10 JUnit cases; document upload by phase and type; chatbot tested as task T7 in Section 6.4 |
| 5 | Ensure the system is secure, role-gated and deployable on MMU infrastructure | Sections 5.5.1, 5.5.7, 5.8 | Five-failure lockout (`AuthServiceLoginThrottleTest`); URL-prefix authority routing in `SecurityConfig`; cycle-ended read-only gate (`StudentAccessServiceTest`); Docker Compose stack deployable on standard Java 17 / MySQL 8 hosts |

The traceability matrices in Section 6.3 add a second layer of
evidence by mapping each functional and non-functional requirement
group from Chapter 3 to its delivered counterpart. Every functional
requirement group was met. Two non-functional requirements were
flagged as deployment-time items rather than development-time ones,
and they are picked up again as recommendations in Section 7.5.

---

## 7.3 Project Strengths

A few aspects of the implementation stand out as genuine
contributions rather than just template features.

The first is the depth of role coverage. Many student projects in
this space cover one or two roles in detail and gesture at the rest.
The system here covers all four MMU FCI roles end-to-end, with a
real workflow for each. The Committee role in particular has its own
cohort dashboard with risk scoring and CSV export, which is the kind
of feature that usually shows up only in commercial products.

The second is the meeting log subsystem. Digital signing with
SHA-256 hashing, dual-party signature locking, and DOCX export that
matches the FCI letterhead down to the trimester header are not
trivial. The 15 JUnit cases that protect the renderer (covering
checkbox sentinel-swaps, signature embedding, cross-run text
replacement and the FYP1/FYP2 template split) cost more time than
expected to write but make the output reliable enough that the
faculty could in principle accept the exported DOCX as the official
record.

The third is the AI tier. Rather than wrap a single hosted LLM, the
system runs three different AI services with three different
strategies: a deterministic Sentence-BERT scorer for supervisor
recommendation, a hybrid rule-based and DistilBERT pipeline for
proposal analysis, and a FAISS-backed retrieval-augmented chatbot.
Keeping them as independent Flask services makes each one
replaceable without touching the main backend.

The fourth is the cycle lifecycle. A real faculty operates in
trimester cycles, and most student projects ignore that. The system
here treats cycles as first-class objects, with read-only gating on
the student side once a cycle is completed or archived, automatic
placeholder backfill for missing meeting logs and per-cycle
audience filtering on announcements. This matches how the FCI office
actually works rather than how a student might guess it works.

The fifth is the layered authorisation model. URL prefix authority
routing in Spring Security, per-row visibility checks inside
services, cycle-status gating at every student write endpoint, and a
matching three-tier feature gate on the React side means that
authorisation is not a single line of code that an attacker can
bypass but a defence in depth.

---

## 7.4 Project Limitations

The system is functionally complete against the FYP2 objectives, but
several limitations are worth stating plainly.

The most important is that the system has not yet been deployed
behind the real MMU TLS proxy. NFR9 (HTTPS) is met in development
through a self-signed certificate, and the production deployment is
straightforward in principle — the Docker Compose stack is portable
and the backend already trusts an X-Forwarded-Proto header — but the
final cut-over to the MMU reverse proxy was outside the scope of
FYP2.

The backup endpoint exists and writes a timestamped ZIP under
`uploads/backups/`, but it is not yet on a cron schedule.
NFR8 is therefore satisfied as a capability, not as a running
process. A weekly schedule would need to be set up by the
deployment administrator.

Performance was measured under development conditions: one developer
laptop running the full Compose stack, five concurrent testers at the
busiest moment. No load test against a 1000-student cohort was
attempted. The performance budget in NFR4 and NFR5 holds at the scale
that was tested, but extrapolation to the full FCI cohort is not
backed by evidence.

The user interface is English-only. NFR1 covers responsiveness but
does not require localisation. MMU is bilingual in practice (English
and Bahasa Malaysia) and a meaningful share of students would prefer
a Mandarin or Bahasa interface. Adding translation strings was not
scoped into the original project plan.

The audit log is recorded in the database but is not yet surfaced in
a viewer screen. An administrator who wants to inspect the log has
to query the table directly. A simple read-only viewer page would
close the gap.

The system does not integrate with MMU's existing single sign-on or
student information system. Identities are managed inside the
application instead of being federated. This is a reasonable
boundary for an FYP, but a real deployment would benefit from
SSO so that students do not need a second password.

Finally, the usability and acceptance testing sample sizes are
small: five usability subjects and four acceptance sessions. The
findings are useful but not statistically strong. A larger pilot
with one full FYP cohort would harden the design conclusions.

---

## 7.5 Future Work

The limitations above lead directly into a list of follow-up
projects, ordered from most immediate to most ambitious.

**Table 7.2: Future Work Items**

| # | Item | Scope | Driver |
|---|---|---|---|
| 1 | Production deployment behind MMU TLS proxy | Infrastructure | Closes NFR9 deployment-side; covers Limitation 1 |
| 2 | Scheduled database backups via cron with off-site rotation | Operations | Closes NFR8 deployment-side; covers Limitation 2 |
| 3 | Uptime and health monitoring dashboard | Operations | Operationalises NFR7 |
| 4 | Audit log viewer page for the administrator | Backend + Frontend | Closes Limitation 5 |
| 5 | Single sign-on against the MMU identity provider | Backend integration | Closes Limitation 6 |
| 6 | Multi-language UI (English, Bahasa Malaysia, Mandarin) | Frontend i18n | Closes Limitation 4 |
| 7 | Cohort statistics dashboard for the FYP Committee | Frontend + reporting | Extension of Section 5.5.9 |
| 8 | Native mobile app or installable PWA | Frontend | Extends NFR1 to mobile devices |
| 9 | Push notifications via Firebase Cloud Messaging | Backend integration | Extension of Section 5.5.8 |
| 10 | Rate-limiting and request queueing for the AI services | Backend | Hardens NFR5 against load |
| 11 | Replace local DistilBERT with a hosted LLM for proposal analysis | AI tier | Improves Section 5.5.5 accuracy if budget allows |
| 12 | A larger pilot study with one full FYP cohort | Evaluation | Strengthens Section 6.4 and Section 6.5 evidence |

Items 1 to 3 are operational tasks for the deployment phase. Items 4
to 6 are short feature additions that close the limitations called
out earlier. Items 7 to 12 are larger pieces of work that would each
take a separate development cycle.

---

## 7.6 Personal Reflection

The project pushed the developer well beyond the comfort zone of a
typical coursework assignment. The system has four user roles, five
runtime services, 39 database migrations and three independent AI
pipelines, and getting them to behave together took more discipline
than any single piece of code. A few things stood out as
particularly useful learning.

Working with a strict layered architecture — controller, service,
repository, entity on the backend; page, hook, API client, type on
the frontend — was uncomfortable at first because every small change
needed edits in several files. By the second trimester it became the
opposite: it was the layering that made it possible to swap out the
AI services, change the meeting log template, and add the cycle
lifecycle gate without breaking the rest of the system.

Schema migrations taught a lesson that books rarely explain well.
Flyway treats every applied migration as immutable, so a typo in V15
cannot be corrected by editing V15 — it has to be undone by V16. The
project incurred this lesson the hard way more than once. The
discipline that came out of that experience (always read
`db/migration/` before claiming a version number, never reach into a
migration that has already shipped) carried over into other
production-style habits.

Testing was the second big lesson. The first version of the meeting
log DOCX renderer passed every JUnit case yet produced a broken file
when opened in Word, because the JUnit cases were inspecting the
output XML rather than the rendered document. Adding cases that
opened the produced bytes with `XWPFDocument` and checked the
pictures, footer text and font size — the same things a human would
verify — was a turning point in how the developer thinks about
testing.

Working on three different stacks side-by-side (Spring Boot on Java
17, React with Vite, Flask with PyTorch) required keeping mental
context switches under control. The CLAUDE.md project memory and
the discipline of converting every operational fact into a written
note rather than holding it in the head turned out to be a major
multiplier on the developer's productivity. Each fact added to the
memory was one fewer fact to re-derive on the next session.

Finally, the project changed the developer's understanding of what
"finished" means. The first draft of any feature was usually
functional but not really finished — the spinner state was missing,
the empty-list case was untested, the loading message was wrong.
Building a feature is perhaps 60% of the work; the other 40% is
making it behave well in the corner cases that nobody plans for.
That ratio is something the developer expects to carry forward into
future work.

---

## 7.7 Conclusion

The FYP Supervision System set out to replace a paper-and-WhatsApp
process with a web-based platform that supports the four roles in
the MMU FCI FYP workflow, and to use AI services to assist with the
parts that most benefit from automation. The system that was
delivered does that, and the testing work in Chapter 6 confirms it.
The five objectives from Chapter 1 were each met, the eight
functional requirement groups from Chapter 3 are all in place, and
the system has been signed off by the project supervisor and one
tester from each of the four user roles.

The limitations that remain are real but operational: production
deployment, scheduled backups, an audit log viewer, single sign-on
and a fuller pilot study. None of them block the system from being
used by FCI in its current state, but each would make the system
more comfortable to operate at scale.

What the developer takes away from the project is more than a
working system. The combination of working with a real faculty
process, a multi-tier architecture, an AI tier, a strict testing
discipline and a long-running database schema, all under one
codebase, was an experience that no single coursework module could
have provided. The developer would consider the project a success
not only because the system works, but because it leaves behind a
set of habits — layered architecture, written project memory, tests
that mimic what a human would check — that will be useful long
after the FYP grade is recorded.
