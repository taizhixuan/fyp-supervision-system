**1.1 Project Overview**

At Multimedia University (MMU), it is mandatory that all students undertake a Final Year Project (FYP) at the Faculty of Computing and Informatics (FCI), Bachelor of Computer Science programme. The FYP involves the students applying the knowledge that they have acquired during their studies to a real-life problem including problem identification, solution design, system development as well as formal report writing. Supervision also plays a crucial role in this process since it helps students maintain their progress, deliver the work that is needed within the deadlines, and improve the quality of their final project.
Based on the experiences with the previous FYP batches in FCI, the process of supervision is frequently handled with the help of a number of separate tools. Email, messaging applications, spreadsheets, printed logbooks, and shared folders are prevalent methods of coordinating proposals, consultations, and tracking of progress among students and supervisors. This causes meeting notes, feedback, file versions, and action items to be scattered across different platforms. As a result, it becomes difficult to have a clear history of supervision and keep track of the project progress, which could lead to misunderstanding, missed tasks and the last-minute rush towards submission times.
To address these issues, this project proposes FYP Supervision System that is a web-based system that centralises all the key supervision activities at MMU FCI. The system will enable students to manage their profiles, request supervisors, submit project proposals, schedule consultation sessions, maintain supervision logs, upload project documents and view important guidelines or reminders. Supervisors are able to manage information of supervisees, review proposals and documents, respond to meeting requests, provide feedback, sign supervisee supervision logs, as well as monitor supervisee progress through a structured dashboard.
<!--
UPDATED 2026-05-10: AI feature descriptions in this paragraph have
been refreshed to match the FYP2 implementation.
- Recommender now uses Sentence-BERT semantic similarity together with
  research-area / skill overlap, programme match, and remaining
  supervision quota — broader than the original "topic similarity +
  workload" wording.
- Proposal analyser combines NLP techniques with a fine-tuned text-
  quality model rather than NLP alone.
- Chatbot description now mentions retrieval over a curated knowledge
  base, which is the actual mechanism.
-->
The system contains also the AI-assisted features to enhance the supervision process. The supervisor recommendation module assists in recommending appropriate supervisors by combining semantic similarity between the student's profile and each supervisor's research areas with overlapping skills, programme alignment, and the supervisor's remaining supervision quota. The proposal analysis module combines natural language processing techniques (readability metrics, section coverage checks) with a fine-tuned text-quality model that scores the proposal as a whole, so the system can flag both structural gaps (such as a missing problem statement or methodology) and weaknesses in the writing itself. It also includes a chatbot assistant that retrieves the most relevant passages from a curated FYP knowledge base before answering, so common questions about procedures, deadlines, and system usage can be addressed without taking up supervisor time.
The system is implemented as a web application based on Java Spring Boot as a back end, and MySQL as the primary database. The AI services are implemented in Python and linked to the main backend with the help of the RESTful APIs. In FYP1, the project was concerned with studying the background, conducting requirements analysis, and designing the system. FYP2 focuses on system implementation, module integration, testing, evaluation and final documentation.
Overall, this project will provide a viable supervision management system to MMU FCI. Replacing the scattered manual practices with a formal online system with AI-based support, the system is expected to assist students in managing their FYP in a more systematic manner.


---

**1.2 Problem Statement**

At MMU FCI, FYP supervision is currently carried out without a dedicated system. Students and supervisors rely on whatever tools are available to them, such as email for formal communication, messaging applications for quick updates, and shared cloud folders for documents. Since these tools are not connected to one another, supervision information becomes spread across different places. A proposal draft may sit in one inbox while the latest feedback is in chat messages and the meeting summary is stored in a separate document. As a result, both sides often lack a clear view of what has been completed, what is still pending, and where the project actually stands.

This fragmented setup creates several issues as the semester progresses. A student may overlook a required revision because the comment was given verbally during a meeting and not written down, or because the supervisor's reply was placed within a long email thread. Supervisors who guide several students at the same time face a similar difficulty, since there is no consolidated view that shows the status of each supervisee. Meeting outcomes are sometimes recorded in detail, but more often they are only remembered by the participants, which weakens accountability when an action item is forgotten in a later session. For the FYP coordinator, verifying whether students have met the minimum supervision requirements often requires asking each supervisor manually, which adds further administrative effort.

The early phase of FYP is also poorly supported by the current arrangement. When students first search for a supervisor, they generally have little to refer to beyond a list of names and broad research areas. As a result, popular lecturers tend to receive a high number of requests, while others receive comparatively fewer. The proposal stage faces a similar limitation. Without an automated check, students sometimes submit proposals that are missing essential sections such as the problem statement, objectives, scope, or methodology, and these gaps are only identified after the supervisor has reviewed the document. A considerable portion of supervision time is therefore spent on pointing out structural and completeness issues, instead of discussing the research content itself.

To address these issues, this project develops a web-based FYP Supervision System for MMU FCI that brings the main supervision activities into a single platform, including supervisor requests, proposal submission and review, meeting scheduling, supervision logs, document management, announcements, and progress tracking. Three AI-assisted features are also incorporated, namely a supervisor recommendation module, an automated proposal structure check, and an FYP chatbot. In FYP2, the work extends beyond design, with the focus placed on building the system, integrating the modules, conducting end-to-end testing, and evaluating whether the proposed solution offers a meaningful improvement over the current supervision workflow.

---

**1.3 Project Objectives**

This project sets out to develop a web-based FYP supervision system for MMU FCI and to determine whether it offers a real improvement over the way supervision is currently conducted. The system is intended to serve four groups of users, namely students, supervisors, the FYP Committee, and system administrators, with each group accessing only the functions relevant to their role.

The specific objectives are as follows:

- To study how FYP supervision is currently carried out at MMU FCI and to gather input from students, supervisors, and coordinators, in order to identify the functional and non-functional requirements of the proposed system.
- To design a secure web-based solution that meets the gathered requirements and provides role-based access for the four user groups, so that each user is only able to view and use the functions assigned to their role.
- To develop the system so that it covers the main supervision workflows, including supervisor requests, proposal submission and review, meeting scheduling, supervision logs, document submission, feedback, and announcements.
- To incorporate three AI-assisted features into the system, namely a supervisor recommendation module, an automated proposal structure checker, and an FYP chatbot, in order to provide additional support during the early phase of FYP and to reduce repetitive tasks.
- To test the completed system and evaluate, through user feedback and system testing, whether the implemented solution improves the current supervision workflow in FCI.

---

**1.4 Expected Deliverables**

The deliverables produced from this project are as follows.

- The FYP Supervision System, deployed as a working web application that is able to handle a complete supervision cycle, beginning from a student submitting a supervisor request, followed by the supervisor's confirmation, proposal review, meeting scheduling, log keeping, document upload, and the delivery of announcements and reminders to the relevant users.
- A MySQL database built according to the ERD and data dictionary prepared in FYP1. The schema is required to support user accounts, project records, proposals, meetings, logs, documents, announcements, notifications, and the audit data needed for traceability.
- Three AI-assisted components, namely supervisor recommendation, proposal structure checking, and an FYP chatbot, implemented as Python services and connected to the main backend through RESTful APIs.
- Four role-based interfaces, designed for students, supervisors, FYP Committee members, and system administrators respectively. Each role is restricted to the screens and functions that apply to it.
- Testing artefacts, including the test cases prepared during development, the results obtained from executing them, and the supporting evidence collected during system validation.
- An evaluation write-up that examines the system from the perspectives of functionality, usability, and the extent to which the prototype addresses the supervision issues identified earlier.
- The final FYP2 report, which presents the implementation details, testing results, evaluation discussion, conclusion, and recommendations for future enhancement.
- A final presentation and live demonstration that walks through the completed workflow of the system.

---

**1.5 Goals of the Project**

The overall aim of this project is to achieve a more organised FYP supervision lifecycle, in which the scattered manual practices currently used at FCI are replaced with a structured digital platform and supported by intelligent features at the points where they provide the greatest benefit. The system is developed with the following goals in mind:

- To reduce the amount of time that supervisors and the FYP Committee spend on administrative and monitoring tasks, so that a greater portion of their time can be directed towards the academic aspect of supervision.
- To improve the way student progress, supervision records, feedback, and follow-up actions are tracked and verified, so that important items are not lost as the semester progresses.
- To raise the overall quality of project proposals from the early stage, by providing students with automated structural feedback before their work is reviewed by the supervisor.
- To reduce the friction commonly experienced by students during the supervision process, particularly in supervisor selection, proposal submission, meeting coordination, and ongoing communication with their supervisor.
- To produce a working and testable platform, rather than a design only, so that the project is able to demonstrate in practice how FYP supervision can be conducted within a single system.

---

1.6.2 Gantt Chart

Figure 1.1 shows the planned schedule for FYP2 from Week 2 to Week 17. The trimester begins with a project review and planning phase, where the FYP1 report, project scope, functional and non-functional requirements, and supervisor feedback are reviewed to identify the improvements and adjustments needed before implementation. The requirements baseline and project plan are then updated to reflect the agreed direction.
Following this, the system design is refined, covering the database schema, software architecture, security model, and the API and integration contracts between the Spring Boot backend and the three Flask AI services (recommendation, proposal analyser, chatbot).
The main development work is carried out from Week 6 to Week 13, organised by actor module so that progress can be tracked clearly. The Core Platform (authentication, role-based access control, and shared services) and the Student and Supervisor modules are delivered first, followed by the FYP Committee and System Admin modules together with the initial AI integration. Each module covers its frontend, backend, database, and AI integration work, and the prototype is iteratively improved into a more complete working system through a prototype review and fix step.
Testing activities are then planned and executed to verify system functions, fix defects, and evaluate the completed modules end to end. Towards the end of the trimester, the report is finalised, followed by final submission and preparation for the presentation and demonstration. Overall, the Gantt chart ensures that requirements review, design, module-level implementation, AI integration, testing, documentation, and presentation preparation are completed in a structured and traceable sequence.
