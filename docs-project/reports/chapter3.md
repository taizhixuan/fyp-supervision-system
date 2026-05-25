# Chapter 3: REQUIREMENTS

## 3.4 Requirements

Based on the background study, questionnaire results and observations, the following actors and requirements for the FYP Supervision System were identified.

**System actors**

- Student

- Supervisor

- FYP Committee

- System Administrator

### 3.4.1 Functional Requirements

The Functional requirements define what the system must do to support the FYP supervision workflow. Based on the problem findings and the use cases in Section 3.5, the functional requirements are organised by key modules and main actors (Student, Supervisor, FYP Committee, System Administrator), including AI-supported functions.

To keep the report concise, only a summary of the functional requirement groups is presented in this section. The complete functional requirements list (FR1–FR47) is provided in Appendix D (Table D.1) for reference and traceability.

> <mark>**FYP2 design evolution.** The functional requirements catalogued in this section capture the FYP1 design baseline (FR1–FR47). Additional features added during FYP2 implementation — pre-approved roster auto-activation, login throttling, Web Push subscriptions, FYP1 pass tracking, final-report grading, and explicit FYP cycle lifecycle management — are documented as new use cases UC34–UC36 (Section 3.5.4) and as new alternative paths in UC1, UC14 and UC30. The matching sequence diagrams appear in the Sequence Diagram document (§4.2.1, §4.2.14, §4.2.30, and the new §4.2.34–§4.2.36). Implementation detail for each addition is documented in Chapter 5.</mark>

Table 3.1 summarises the major functional modules and the most important requirement IDs that drive the system design.

Table 3.1: Summary of Functional Requirements (Main Modules)

| **Module** | **Key Functional Requirements (FR IDs)** | **Summary** |
|:---|----|----|
| User access & profile | FR1–FR2, FR41 | Users log in using MMU credentials, maintain profiles, and system admin manages accounts/roles. |
| Supervisor discovery & matching | FR3–FR8, FR29–FR32 | Students search/filter supervisors and request supervision; supervisors manage availability and respond to requests; AI recommends suitable supervisors. |
| Proposal submission & AI checking | FR9–FR17, FR12–FR15 | Students submit proposals via form/upload with versioning; AI proposal analyzer checks completeness; supervisors review/comment/approve; project status is visible to students. |
| Meetings & supervision log | FR18–FR23, FR44–FR46 | Students propose meetings; supervisors confirm/reschedule; meeting logs store summaries & action items; both parties sign and logs are locked after signing; admin verifies minimum logs. |
| Document & guideline management | FR24–FR27, FR34, FR40 | Students upload documents by phase/type; supervisors upload feedback/supporting files; admin uploads official templates/handbook; system sends deadline/meeting reminders. |
| Dashboards, reporting & announcements | FR33, FR38–FR39, FR47 | Supervisor dashboard shows supervisee progress; admin dashboard/reporting supports monitoring; announcements can be published for students/supervisees. |
| Chatbot support | FR28 | Chatbot answers common FYP questions (rules, deadlines, formatting, system usage). |
| System configuration & integration | FR42–FR43, FR45 | System admin configures FYP cycles/parameters and integration/export; meeting logs are securely locked as official records. |

### 

### 3.4.2 Non-Functional Requirements

The non-functional requirements describe quality attributes that the system must satisfy:

Table 3.2: Non-Functional Requirements (NFR)

| **ID** | **Category** | **Description** |
|----|----|----|
| NFR1 | Usability | The system shall provide a web-based, responsive user interface that works on modern desktop and laptop browsers. |
| NFR2 | Usability | The system shall use clear and consistent navigation with menu entries such as Dashboard, Projects, Meetings, Documents and Help. |
| NFR3 | Usability | All forms shall include validation and user-friendly error messages to reduce data entry mistakes. |
| NFR4 | Performance | Under normal network conditions, common actions (loading dashboard, opening project details) shall complete within 3 seconds. |
| NFR5 | Performance | AI services (proposal checker, supervisor recommendation, chatbot) shall return results within 10 seconds for typical proposal sizes. |
| NFR6 | Scalability | The system architecture shall support multiple FYP batches and future extension to other faculties without major redesign. |
| NFR7 | Availability | The system shall be available at least 99% of the time during the semester, excluding scheduled maintenance. |
| NFR8 | Reliability | The system shall perform regular backups of the database to prevent data loss. |
| NFR9 | Security | All client–server communication shall use HTTPS encryption. |
| NFR10 | Security | Access to data shall be role-based: students only see their own projects; supervisors only see their supervisees; FYP Committee and System Admin have broader access as required. |
| NFR11 | Security | FYP documents and personal data shall be stored securely with appropriate access control in the database or storage server. |
| NFR12 | Maintainability | The system shall be implemented using modular, well-documented code to ease maintenance and enhancement. |
| NFR13 | Maintainability | Interfaces between the main web application and AI microservices shall be clearly defined and documented. |
| NFR14 | Compatibility | The system shall be deployable on MMU’s existing infrastructure (e.g. Spring Boot backend, MySQL database, Python AI services). |
| NFR15 | Portability | The system shall be deployable either on-premise or on a cloud platform with minimal configuration changes. |

### 3.4.3 User Requirements

User requirements capture what each type of user expects to achieve when using the proposed FYP Supervision System. They are written from the user’s perspective and are mapped to the detailed Functional Requirements in Section 3.4.1 to ensure traceability.

To keep the main report concise, this section presents a high-level summary by actor. The complete user requirements list (UR1–UR27) with FR mapping is provided in Appendix E (Table E.1).

Table 3.3: Summary of User Requirements (by Actor)

| **Actor** | **User requirement summary (what they expect)** | **Related UR IDs** |
|----|----|----|
| Student | Single place to access FYP info; discover available supervisors; request supervision without mass emailing; guided proposal submission with AI checking; track status and deadlines; manage meetings, logs, and documents; ask common questions anytime. | UR1–UR11 |
| Supervisor | Maintain supervision profile/quota; efficiently respond to requests; review proposals online with feedback; schedule meetings and maintain supervision logs; monitor supervisee progress; share documents/feedback; publish announcements to supervisees. | UR12–UR18 |
| FYP Committee | Oversee proposals and approval workflow; monitor project/supervisor allocation; generate administrative reports (e.g., meeting logs compliance); publish faculty-wide announcements; manage official templates/guidelines in one place. | UR19–UR24 |
| System Admin | Securely manage accounts/roles; configure FYP cycles and key parameters (e.g., quota limits); manage integration/export settings when needed. | UR25–UR27 |

## 3.5 Use Case Diagram

Table 3.4 Use Cases by Actor

+-------------------------+------------------------------------------------------------------------------------------+
| **Actor**               | **Use Cases**                                                                            |
+=========================+==========================================================================================+
| **Student**             | UC1 -- Register and Log In                                                               |
|                         +------------------------------------------------------------------------------------------+
|                         | UC2 -- Manage Student Profile                                                            |
|                         +------------------------------------------------------------------------------------------+
|                         | UC3 -- View FYP Dashboard                                                                |
|                         +------------------------------------------------------------------------------------------+
|                         | UC4 -- Browse and Search Supervisors                                                     |
|                         +------------------------------------------------------------------------------------------+
|                         | UC5 -- View AI Supervisor Recommendations                                                |
|                         +------------------------------------------------------------------------------------------+
|                         | UC6 -- Send Supervisor Request                                                           |
|                         +------------------------------------------------------------------------------------------+
|                         | UC7 -- Manage Proposal                                                                   |
|                         +------------------------------------------------------------------------------------------+
|                         | UC8 -- View Proposal Status                                                              |
|                         +------------------------------------------------------------------------------------------+
|                         | UC9 -- View Project Registration Status                                                  |
|                         +------------------------------------------------------------------------------------------+
|                         | UC10 -- Manage Meeting Schedule                                                          |
|                         +------------------------------------------------------------------------------------------+
|                         | UC11 -- Manage Supervision Log                                                           |
|                         +------------------------------------------------------------------------------------------+
|                         | UC12 -- Upload and Manage FYP Documents                                                  |
|                         +------------------------------------------------------------------------------------------+
|                         | UC13 -- View FYP Guidelines, Rubrics and Deadlines                                       |
|                         +------------------------------------------------------------------------------------------+
|                         | UC14 -- View Reminders and Notifications                                                 |
|                         +------------------------------------------------------------------------------------------+
|                         | UC15 -- Ask Questions Using the FYP Chatbot                                              |
|                         +------------------------------------------------------------------------------------------+
|                         | [UC35 -- Grade Final Report (read finalised grade)]{.mark}                               |
+-------------------------+------------------------------------------------------------------------------------------+
| **Supervisor**          | UC1 -- Register and Log In                                                               |
|                         +------------------------------------------------------------------------------------------+
|                         | UC16 -- Manage Supervisor Profile                                                        |
|                         +------------------------------------------------------------------------------------------+
|                         | UC17 -- Review and Respond to Supervisor Requests                                        |
|                         +------------------------------------------------------------------------------------------+
|                         | UC18 -- View Supervisee List and Project Details                                         |
|                         +------------------------------------------------------------------------------------------+
|                         | UC19 -- Review Student Proposal                                                          |
|                         +------------------------------------------------------------------------------------------+
|                         | UC20 -- Manage Supervision Meetings                                                      |
|                         +------------------------------------------------------------------------------------------+
|                         | UC21 -- Review, Comment on and Sign Supervision Log                                      |
|                         +------------------------------------------------------------------------------------------+
|                         | UC22 -- View Supervisee Progress Dashboard                                               |
|                         +------------------------------------------------------------------------------------------+
|                         | UC23 -- Upload, Download and Review FYP Documents                                        |
|                         +------------------------------------------------------------------------------------------+
|                         | UC24 -- Publish FYP Announcements                                                        |
|                         +------------------------------------------------------------------------------------------+
|                         | [UC35 -- Grade Final Report (grader)]{.mark}                                             |
+-------------------------+------------------------------------------------------------------------------------------+
| **FYP Committee**       | UC1 -- Register and Log In                                                               |
|                         +------------------------------------------------------------------------------------------+
|                         | UC24 -- Publish FYP Announcements                                                        |
|                         +------------------------------------------------------------------------------------------+
|                         | UC25 -- View Proposal Review Queue                                                       |
|                         +------------------------------------------------------------------------------------------+
|                         | UC26 -- Review Proposal                                                                  |
|                         +------------------------------------------------------------------------------------------+
|                         | UC27 -- Manage General FYP Documents                                                     |
|                         +------------------------------------------------------------------------------------------+
|                         | UC28 -- View FYP Project and Pairing Overview                                            |
|                         +------------------------------------------------------------------------------------------+
|                         | UC29 -- Generate and Export FYP Reports                                                  |
+-------------------------+------------------------------------------------------------------------------------------+
| **System                | UC1 -- Register and Log In                                                               |
| Administrator**         |                                                                                          |
|                         +------------------------------------------------------------------------------------------+
|                         | UC30 -- Manage User Accounts and Roles                                                   |
|                         +------------------------------------------------------------------------------------------+
|                         | UC31 -- Configure System Parameters                                                      |
|                         +------------------------------------------------------------------------------------------+
|                         | UC32 -- Configure Integration and Export Settings                                        |
|                         +------------------------------------------------------------------------------------------+
|                         | UC33 -- Perform System Maintenance                                                       |
|                         +------------------------------------------------------------------------------------------+
|                         | [UC34 -- Track FYP1 Pass Outcome]{.mark}                                                 |
|                         +------------------------------------------------------------------------------------------+
|                         | [UC35 -- Grade Final Report (finaliser)]{.mark}                                          |
|                         +------------------------------------------------------------------------------------------+
|                         | [UC36 -- Manage FYP Cycle Lifecycle]{.mark}                                              |
+-------------------------+------------------------------------------------------------------------------------------+

<img src="media/media/image2.jpeg" style="width:5.72014in;height:8.43452in" />

Figure 3.2 Use Case Diagram

### 3.5.1 Common Use Case Specification

Register use case specification

Table 3.5 UC1: Register and Log In

+------------------------+--------------------------------------------------------------------------------------------+
| Field                  | Details                                                                                    |
+========================+============================================================================================+
| Use Case ID            | UC1                                                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Register and Log In                                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Student, Supervisor, FYP Committee, System Administrator                                   |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Allows users to access the system through registration (for eligible users) and login. The |
|                        | system determines the user role and displays the authorised modules and dashboard          |
|                        | accordingly.                                                                               |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | System is available. For registration: user has a valid MMU ID and is eligible to          |
|                        | self-register (Student or Supervisor). For login: user account exists in the system.       |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | For registration: user account is created with an assigned role. For login: user is        |
|                        | authenticated, a session is created, and the role-based dashboard and menus are displayed. |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  User opens the system access page (Register or Log In).                                |
|                        |                                                                                            |
|                        | 2.  If the user is a Student or Supervisor and does not have an account, the user selects  |
|                        |     Register.                                                                              |
|                        |                                                                                            |
|                        | 3.  User enters required details (MMU ID, full name, email, phone) and accepts the terms.  |
|                        |                                                                                            |
|                        | 4.  System validates details and creates the user account with role Student or Supervisor. |
|                        |                                                                                            |
|                        | 5.  System redirects the user to the login page.                                           |
|                        |                                                                                            |
|                        | 6.  User enters MMU ID and password.                                                       |
|                        |                                                                                            |
|                        | 7.  System validates credentials.                                                          |
|                        |                                                                                            |
|                        | 8.  System retrieves the user role (Student, Supervisor, FYP Committee, or System          |
|                        |     Administrator) and permissions.                                                        |
|                        |                                                                                            |
|                        | 9.  System creates a session and redirects to the corresponding dashboard.                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: User account already exists → system directs user to Log In page.                      |
|                        |                                                                                            |
|                        | A2: FYP Committee or System Administrator registration attempt → system blocks             |
|                        | self-registration and informs that the account must be created by System Administrator.    |
|                        |                                                                                            |
|                        | A3: Invalid registration inputs → system highlights errors and requests correction.        |
|                        |                                                                                            |
|                        | A4: Invalid login credentials → system displays error and allows retry.                    |
|                        |                                                                                            |
|                        | [A5: Pre-approved roster match → during registration, the system checks the (mmu_id,       |
|                        | email) pair against \`approved_student_roster\` or \`approved_supervisor_roster\`. When    |
|                        | both fields match together, the account is created with status \`ACTIVE\` immediately and  |
|                        | the student is auto-enrolled in the currently active FYP1 cycle (placeholder Project row   |
|                        | created via \`CycleLifecycleService.attachStudentToActiveFyp1\`). The user can log in      |
|                        | straight away without admin review.]{.mark}                                                |
|                        |                                                                                            |
|                        | [A6: Repeated failed login attempts → after five consecutive failed password matches, the  |
|                        | system locks the account for fifteen minutes (\`user_account.lockout_until\`). Subsequent  |
|                        | attempts during the lockout window return a \"temporarily locked\" message stating how     |
|                        | long until the account is usable again. A successful login resets the counter.]{.mark}     |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Duplicate MMU ID or email during registration → system prevents account creation and   |
|                        | displays message.                                                                          |
|                        |                                                                                            |
|                        | E2: Authentication service unavailable → system displays service unavailable message and   |
|                        | logs the incident.                                                                         |
|                        |                                                                                            |
|                        | E3: Database/server error → system terminates the process and does not create account or   |
|                        | session.                                                                                   |
|                        |                                                                                            |
|                        | [E4: Authenticated account is \`PENDING\`, \`SUSPENDED\`, or \`BLOCKED\` → login is        |
|                        | rejected with a status-specific message (e.g. \"Your account is pending approval\"). The   |
|                        | JWT filter additionally re-reads account status on every authenticated request, so a       |
|                        | status flip terminates active sessions on the user\'s next call.]{.mark}                   |
+------------------------+--------------------------------------------------------------------------------------------+

### 

### 3.5.2 Student Use Case Specifications

Table 3.6 UC2: Manage Student Profile

+-------------------------+---------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                           |
+=========================+=======================================================================================+
| Use Case ID             | UC2                                                                                   |
+-------------------------+---------------------------------------------------------------------------------------+
| Use Case Name           | Manage Student Profile                                                                |
+-------------------------+---------------------------------------------------------------------------------------+
| Actors                  | Student                                                                               |
+-------------------------+---------------------------------------------------------------------------------------+
| Description             | Student views and updates personal and academic profile.                              |
+-------------------------+---------------------------------------------------------------------------------------+
| Pre-condition           | Student is logged in.                                                                 |
+-------------------------+---------------------------------------------------------------------------------------+
| Postcondition           | Profile is updated and saved.                                                         |
+-------------------------+---------------------------------------------------------------------------------------+
| Basic Path              | 1.  Student opens profile page.                                                       |
|                         |                                                                                       |
|                         | 2.  Student edits profile fields.                                                     |
|                         |                                                                                       |
|                         | 3.  System validates inputs.                                                          |
|                         |                                                                                       |
|                         | 4.  System saves profile changes.                                                     |
+-------------------------+---------------------------------------------------------------------------------------+
| Alternative Path        | A1: Student cancels changes → system discards edits.                                  |
+-------------------------+---------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Invalid input → system shows validation error messages.                           |
+-------------------------+---------------------------------------------------------------------------------------+

Table 3.7 UC3: View FYP Dashboard

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC3                                                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | View FYP Dashboard                                                                         |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Student                                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Student views project status, deadlines, and notifications.                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Student is logged in.                                                                      |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Dashboard is displayed.                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Student opens dashboard.                                                               |
|                        |                                                                                            |
|                        | 2.  System loads proposal, meetings, logs, and documents summary.                          |
|                        |                                                                                            |
|                        | 3.  System displays dashboard cards and alerts.                                            |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Student has no project → system displays next steps and guidance.                      |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Data retrieval error → system shows message and logs the error.                        |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.8 UC4: Browse and Search Supervisors

+-------------------------+-----------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                             |
+=========================+=========================================================================================+
| Use Case ID             | UC4                                                                                     |
+-------------------------+-----------------------------------------------------------------------------------------+
| Use Case Name           | Browse and Search Supervisors                                                           |
+-------------------------+-----------------------------------------------------------------------------------------+
| Actors                  | Student                                                                                 |
+-------------------------+-----------------------------------------------------------------------------------------+
| Description             | Student searches supervisors by research area and availability.                         |
+-------------------------+-----------------------------------------------------------------------------------------+
| Pre-condition           | Student is logged in.                                                                   |
+-------------------------+-----------------------------------------------------------------------------------------+
| Postcondition           | Supervisor list and details are displayed.                                              |
+-------------------------+-----------------------------------------------------------------------------------------+
| Basic Path              | 1.  Student opens supervisor directory.                                                 |
|                         |                                                                                         |
|                         | 2.  Student applies filters and keywords.                                               |
|                         |                                                                                         |
|                         | 3.  System displays matching supervisors.                                               |
|                         |                                                                                         |
|                         | 4.  Student views supervisor profile.                                                   |
+-------------------------+-----------------------------------------------------------------------------------------+
| Alternative Path        | A1: No results → system suggests adjusting filters.                                     |
+-------------------------+-----------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Directory service failure → system displays error banner.                           |
+-------------------------+-----------------------------------------------------------------------------------------+

Table 3.9 UC5: View AI Supervisor Recommendations

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC5                                                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | View AI Supervisor Recommendations                                                         |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Student                                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Student views recommended supervisors based on topic and profile.                          |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Student is logged in; topic keywords or draft proposal exists.                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Recommendation list is displayed.                                                          |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Student opens recommendations page.                                                    |
|                        |                                                                                            |
|                        | 2.  Student inputs topic or selects draft proposal.                                        |
|                        |                                                                                            |
|                        | 3.  System calls AI service.                                                               |
|                        |                                                                                            |
|                        | 4.  System displays ranked recommendations.                                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Missing topic information → system prompts student to enter keywords.\                 |
|                        | [A2: System filters out supervisors who are unavailable or over the supervision quota      |
|                        | before displaying the ranked list, so only eligible supervisors are recommended.]{.mark}   |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: AI service timeout → system shows failure and allows retry.                            |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.10 UC6: Send Supervisor Request

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC6                                                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Send Supervisor Request                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Student                                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Student requests supervision from a supervisor.                                            |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Student is logged in; supervisor is selectable; request rules are satisfied.               |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Request is created and supervisor is notified.                                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Student selects supervisor.                                                            |
|                        |                                                                                            |
|                        | 2.  Student enters message and topic.                                                      |
|                        |                                                                                            |
|                        | 3.  Student submits request.                                                               |
|                        |                                                                                            |
|                        | 4.  System records request as Pending and notifies supervisor.                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Student withdraws pending request → status becomes Withdrawn.                          |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Supervisor not accepting students → system blocks request and shows reason.            |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.11 UC7: Manage Proposal

+---------------------+-----------------------------------------------------------------------------------------------+
| **Field**           | **Details**                                                                                   |
+=====================+===============================================================================================+
| Use Case ID         | UC7                                                                                           |
+---------------------+-----------------------------------------------------------------------------------------------+
| Use Case Name       | Manage Proposal                                                                               |
+---------------------+-----------------------------------------------------------------------------------------------+
| Actors              | Student                                                                                       |
+---------------------+-----------------------------------------------------------------------------------------------+
| Description         | Student manages the proposal in a single workflow: create or edit proposal content (via form  |
|                     | or file upload), optionally run the AI proposal checker to evaluate completeness/quality, and |
|                     | submit the proposal to the assigned supervisor for review. Version history is maintained for  |
|                     | each saved or submitted proposal version.                                                     |
+---------------------+-----------------------------------------------------------------------------------------------+
| Pre-condition       | Student is logged in.                                                                         |
+---------------------+-----------------------------------------------------------------------------------------------+
| Postcondition       | Draft proposal is saved with version history.                                                 |
+---------------------+-----------------------------------------------------------------------------------------------+
| Basic Path          | 1.  Student opens the proposal module.                                                        |
|                     |                                                                                               |
|                     | 2.  System displays the latest proposal draft (or an empty draft if none exists).             |
|                     |                                                                                               |
|                     | 3.  Student creates/edits proposal content or uploads a proposal file.                        |
|                     |                                                                                               |
|                     | 4.  Student clicks Save Draft.                                                                |
|                     |                                                                                               |
|                     | 5.  System creates a new proposal version and stores content/file.                            |
|                     |                                                                                               |
|                     | 6.  Student clicks Run AI Checker.                                                            |
|                     |                                                                                               |
|                     | 7.  System analyses the latest version and displays a score, detected issues, missing         |
|                     |     sections, and suggested improvements.                                                     |
|                     |                                                                                               |
|                     | 8.  Student improves the proposal based on feedback and saves a new version if needed.        |
|                     |                                                                                               |
|                     | 9.  Student clicks Submit to Supervisor.                                                      |
|                     |                                                                                               |
|                     | 10. System updates proposal status to Submitted/Under Review, notifies the supervisor, and    |
|                     |     records the submission action.                                                            |
+---------------------+-----------------------------------------------------------------------------------------------+
| Alternative Path    | A1: Student skips AI checker → Student saves draft and proceeds to submit directly (Steps     |
|                     | 3--5, then Step 9--10).\                                                                      |
|                     | A2: Student uploads file instead of form input → System extracts/stores file and creates a    |
|                     | new version (Steps 3--5).\                                                                    |
|                     | A3: Student edits after running AI checker → Student saves a new version, then runs AI        |
|                     | checker again (repeat Steps 3--8) before submission.\                                         |
|                     | A4: No supervisor assigned yet → System allows submission but routes to committee queue or    |
|                     | prevents submission and prompts student to request/confirm supervisor (depends on your        |
|                     | rules).\                                                                                      |
|                     | [A5: Student runs AI checker on the overall proposal (not a specific version) → System        |
|                     | aggregates the latest proposal content across versions and stores the AI result at proposal   |
|                     | level for traceability, instead of attaching it to a single version.]{.mark}                  |
+---------------------+-----------------------------------------------------------------------------------------------+
| Exceptional Path    | E1: Unsupported file type / upload error → System rejects upload and shows accepted           |
|                     | formats/size limits.\                                                                         |
|                     | E2: AI service unavailable / timeout → System shows error, keeps draft saved, and allows      |
|                     | retry later.\                                                                                 |
|                     | E3: Missing mandatory proposal fields (e.g., title/objectives) → System blocks submission and |
|                     | highlights required sections.\                                                                |
|                     | E4: Duplicate submission attempt (already under review) → System prevents re-submit and       |
|                     | instructs student to wait for review or create a new revision version.                        |
+---------------------+-----------------------------------------------------------------------------------------------+

Table 3.12 UC8: View Proposal Status

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC8                                                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | View Proposal Status                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Student                                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Student tracks proposal status and supervisor feedback.                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Student is logged in.                                                                      |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | [Proposal status timeline is displayed, including the current status, AI proposal-checker  |
|                        | results (score, missing sections, suggested improvements), and the full supervisor /       |
|                        | committee review history with remarks and decisions.]{.mark}                               |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Student opens proposal status page.                                                    |
|                        |                                                                                            |
|                        | 2.  System displays status timeline and feedback.                                          |
|                        |                                                                                            |
|                        | 3.  Student views required actions.                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Revision requested → system displays required changes and edit link.                   |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Proposal record not found → system displays support message and logs issue.            |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.13 UC9: View Project Registration Status

+-------------------------+-------------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                               |
+=========================+===========================================================================================+
| Use Case ID             | UC9                                                                                       |
+-------------------------+-------------------------------------------------------------------------------------------+
| Use Case Name           | View Project Registration Status                                                          |
+-------------------------+-------------------------------------------------------------------------------------------+
| Actors                  | Student                                                                                   |
+-------------------------+-------------------------------------------------------------------------------------------+
| Description             | Student views registration and pairing status for FYP cycle.                              |
+-------------------------+-------------------------------------------------------------------------------------------+
| Pre-condition           | Student is logged in.                                                                     |
+-------------------------+-------------------------------------------------------------------------------------------+
| Postcondition           | Registration status is displayed.                                                         |
+-------------------------+-------------------------------------------------------------------------------------------+
| Basic Path              | 1.  Student opens registration status.                                                    |
|                         |                                                                                           |
|                         | 2.  System displays FYP stage and pairing info.                                           |
|                         |                                                                                           |
|                         | 3.  System displays next steps if applicable.                                             |
+-------------------------+-------------------------------------------------------------------------------------------+
| Alternative Path        | A1: Not registered → system displays registration guidance.                               |
+-------------------------+-------------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Status inconsistency → system warns user and logs warning.                            |
+-------------------------+-------------------------------------------------------------------------------------------+

Table 3.14 UC10: Manage Meeting Schedule

+---------------------+-----------------------------------------------------------------------------------------------+
| **Field**           | **Details**                                                                                   |
+=====================+===============================================================================================+
| Use Case ID         | UC10                                                                                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Use Case Name       | Manage Meeting Schedule                                                                       |
+---------------------+-----------------------------------------------------------------------------------------------+
| Actors              | Student                                                                                       |
+---------------------+-----------------------------------------------------------------------------------------------+
| Description         | Student manages supervision meeting scheduling in one module: view upcoming and past          |
|                     | meetings, propose new meeting slots with agenda, and update/cancel pending meeting requests   |
|                     | before supervisor confirmation.                                                               |
+---------------------+-----------------------------------------------------------------------------------------------+
| Pre-condition       | Student is logged in; student is paired with a supervisor.                                    |
+---------------------+-----------------------------------------------------------------------------------------------+
| Postcondition       | Meeting schedule is displayed, and/or a meeting request is created/updated with status        |
|                     | Pending Confirmation and the supervisor is notified.                                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Basic Path          | 1.  Student opens the Meeting Schedule module.                                                |
|                     |                                                                                               |
|                     | 2.  System displays a calendar/list view of upcoming and past meetings for the student's      |
|                     |     project.                                                                                  |
|                     |                                                                                               |
|                     | 3.  Student clicks Request Meeting.                                                           |
|                     |                                                                                               |
|                     | 4.  Student proposes date/time (start--end), selects platform (e.g.,                          |
|                     |     Teams/Zoom/Face-to-face), and enters an agenda.                                           |
|                     |                                                                                               |
|                     | 5.  Student submits the request.                                                              |
|                     |                                                                                               |
|                     | 6.  System creates the meeting record with status Proposed/Pending Confirmation and notifies  |
|                     |     the supervisor.                                                                           |
|                     |                                                                                               |
|                     | 7.  Student returns to the schedule view and sees the pending meeting request.                |
+---------------------+-----------------------------------------------------------------------------------------------+
| Alternative Path    | A1: Edit pending request → Student opens a pending request, edits time/agenda/platform, and   |
|                     | submits; system updates the meeting and re-notifies the supervisor.\                          |
|                     | A2: Cancel pending request → Student cancels a pending request; system updates status to      |
|                     | Cancelled and notifies the supervisor.\                                                       |
|                     | A3: View meeting details → Student opens a meeting item to view full details (agenda, status, |
|                     | confirmed time if available).\                                                                |
|                     | A4: Export schedule → Student chooses export; system generates a calendar export file (e.g.,  |
|                     | .ics) or downloadable schedule output.                                                        |
+---------------------+-----------------------------------------------------------------------------------------------+
| Exceptional Path    | E1: Proposed time violates policy (outside allowed hours / too short notice / clashes with    |
|                     | deadline blackout period) → system blocks submission and displays allowed rules.\             |
|                     | E2: Student not paired with supervisor → system disables request action and prompts student   |
|                     | to complete supervisor pairing first.\                                                        |
|                     | E3: Schedule/notification service error → system shows error message, logs the issue, and     |
|                     | keeps the request as unsent or retries based on system design.                                |
+---------------------+-----------------------------------------------------------------------------------------------+

Table 3.15 UC11: Manage Supervision Log

+---------------------+-----------------------------------------------------------------------------------------------+
| **Field**           | **Details**                                                                                   |
+=====================+===============================================================================================+
| Use Case ID         | UC11                                                                                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Use Case Name       | Manage Supervision Log                                                                        |
+---------------------+-----------------------------------------------------------------------------------------------+
| Actors              | Student                                                                                       |
+---------------------+-----------------------------------------------------------------------------------------------+
| Description         | Student manages supervision logs in one module: view meeting log history, create or upload a  |
|                     | meeting log for a meeting session, submit the log for supervisor review, and sign the log     |
|                     | once it reaches the signing stage. The log becomes an official supervision record when both   |
|                     | student and supervisor have signed and the log is locked.                                     |
+---------------------+-----------------------------------------------------------------------------------------------+
| Pre-condition       | Student is logged in; Student has an active project and related meeting record exists.        |
+---------------------+-----------------------------------------------------------------------------------------------+
| Postcondition       | [Log is saved in the corresponding state (Draft, Submitted, Signed, or Locked) depending on   |
|                     | the action performed. Once both the student and supervisor signatures have been recorded, the |
|                     | system locks the log and marks it as an immutable official supervision record.]{.mark}        |
+---------------------+-----------------------------------------------------------------------------------------------+
| Basic Path          | 1.  Student opens the Supervision Log module.                                                 |
|                     |                                                                                               |
|                     | 2.  System lists supervision logs by meeting (including status and signature progress).       |
|                     |                                                                                               |
|                     | 3.  Student selects a meeting and clicks Create/Upload Log.                                   |
|                     |                                                                                               |
|                     | 4.  Student fills in the log form (discussion summary, action items, next meeting date)       |
|                     |     and/or uploads the log file.                                                              |
|                     |                                                                                               |
|                     | 5.  Student saves the log as Draft or submits it as Submitted.                                |
|                     |                                                                                               |
|                     | 6.  System stores the log and notifies the supervisor for review/comments (if submitted).     |
|                     |                                                                                               |
|                     | 7.  After the supervisor reviews and signs, the student is notified.                          |
|                     |                                                                                               |
|                     | 8.  Student opens the log and clicks Sign Log.                                                |
|                     |                                                                                               |
|                     | 9.  System records the student signature. If both signatures exist, system locks the log and  |
|                     |     marks it as an official record.                                                           |
+---------------------+-----------------------------------------------------------------------------------------------+
| Alternative Path    | A1: View only (history) → Student only views logs and action items; no upload/sign actions    |
|                     | taken.\                                                                                       |
|                     | A2: Filter logs → Student filters logs by date range, meeting, or status                      |
|                     | (Draft/Submitted/Signed/Locked).\                                                             |
|                     | A3: Supervisor requests correction → Student receives feedback, edits the log, re-submits,    |
|                     | and proceeds to signing after supervisor signs again.\                                        |
|                     | A4: Save as draft → Student saves as Draft and continues editing later before submission.     |
+---------------------+-----------------------------------------------------------------------------------------------+
| Exceptional Path    | E1: Access to unauthorised log → System denies access and logs the attempt.\                  |
|                     | E2: Student attempts to edit locked log → System blocks the action and displays "Locked       |
|                     | record cannot be edited".\                                                                    |
|                     | E3: Upload error / unsupported file type → System rejects upload and shows accepted           |
|                     | formats/size limits.\                                                                         |
|                     | E4: Signing stage not reached (supervisor has not reviewed/signed yet) → System prevents      |
|                     | student signing and shows current status and required next step.                              |
+---------------------+-----------------------------------------------------------------------------------------------+

Table 3.16 UC12: Upload and Manage FYP Documents

+-------------------------+-------------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                               |
+=========================+===========================================================================================+
| Use Case ID             | UC12                                                                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Use Case Name           | Upload and Manage FYP Documents                                                           |
+-------------------------+-------------------------------------------------------------------------------------------+
| Actors                  | Student                                                                                   |
+-------------------------+-------------------------------------------------------------------------------------------+
| Description             | Student uploads reports, slides, and code archives by phase and type.                     |
+-------------------------+-------------------------------------------------------------------------------------------+
| Pre-condition           | Student is logged in.                                                                     |
+-------------------------+-------------------------------------------------------------------------------------------+
| Postcondition           | Document is stored and visible to authorised users.                                       |
+-------------------------+-------------------------------------------------------------------------------------------+
| Basic Path              | 1.  Student opens document module.                                                        |
|                         |                                                                                           |
|                         | 2.  Student selects document type and phase.                                              |
|                         |                                                                                           |
|                         | 3.  Student uploads file.                                                                 |
|                         |                                                                                           |
|                         | 4.  System stores file and updates list.                                                  |
+-------------------------+-------------------------------------------------------------------------------------------+
| Alternative Path        | A1: Replace document → system keeps version history.                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Exceptional Path        | E1: File exceeds limit or fails scan → system rejects and shows reason.                   |
+-------------------------+-------------------------------------------------------------------------------------------+

Table 3.17 UC13: View FYP Guidelines, Rubrics and Deadlines

+-------------------------+-------------------------------------------------------------------------------------------+
| **Field**               | **Detail**                                                                                |
+=========================+===========================================================================================+
| Use Case ID             | UC13                                                                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Use Case Name           | View FYP Guidelines, Rubrics and Deadlines                                                |
+-------------------------+-------------------------------------------------------------------------------------------+
| Actors                  | Student                                                                                   |
+-------------------------+-------------------------------------------------------------------------------------------+
| Description             | Student accesses official resources and deadlines.                                        |
+-------------------------+-------------------------------------------------------------------------------------------+
| Pre-condition           | Student is logged in.                                                                     |
+-------------------------+-------------------------------------------------------------------------------------------+
| Postcondition           | Resources are displayed and downloadable.                                                 |
+-------------------------+-------------------------------------------------------------------------------------------+
| Basic Path              | 1.  Student opens guidelines page.                                                        |
|                         |                                                                                           |
|                         | 2.  System displays resources by category.                                                |
|                         |                                                                                           |
|                         | 3.  Student opens or downloads resource.                                                  |
+-------------------------+-------------------------------------------------------------------------------------------+
| Alternative Path        | A1: Keyword search across resources.                                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Missing resource file → system shows error and logs incident.                         |
+-------------------------+-------------------------------------------------------------------------------------------+

Table 3.18 UC14: View Reminders and Notifications

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | [UC14]{.mark}                                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | View Reminders and Notifications                                                           |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Student                                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | System notifies student about meetings, deadlines, and announcements [through configured   |
|                        | channels (in-app inbox, email, and browser push), based on the student\'s notification     |
|                        | preferences]{.mark}.                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Student account exists; notification rules configured.                                     |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Notification is delivered and recorded.                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | Trigger occurs (deadline, meeting update, announcement).                                   |
|                        |                                                                                            |
|                        | []{.mark}                                                                                  |
|                        |                                                                                            |
|                        | System reads the student\'s notification preferences (channels and categories enabled).    |
|                        |                                                                                            |
|                        | System sends notification [through each enabled channel (in-app, email, browser            |
|                        | push)]{.mark}.                                                                             |
|                        |                                                                                            |
|                        | Student views notification in system.                                                      |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Student [opens notification preferences and customises which categories (meetings,     |
|                        | proposals, announcements, deadlines) and channels (in-app / email / browser push, with the |
|                        | VAPID push subscription handled at the browser level and stored in \`push_subscription\`)  |
|                        | to receive; the system stores the preferences and applies them to subsequent               |
|                        | notifications]{.mark}.\                                                                    |
|                        | \                                                                                          |
|                        | [A2: Student opts in to browser push → frontend requests the browser to subscribe to the   |
|                        | VAPID push service; on success, the resulting \`endpoint\`, \`p256dh\`, and \`auth_key\`   |
|                        | are POSTed to \`/notifications/push/subscribe\` and stored as a new \`PUSH_SUBSCRIPTION\`  |
|                        | row keyed by \`endpoint\`. Subsequent notifications eligible for push fan out through      |
|                        | \`PushService.sendToUser\`.]{.mark}                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Delivery failure → system retries and logs failure.                                    |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.19 UC15: Ask Questions Using the FYP Chatbot

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | [UC15]{.mark}                                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Ask Questions Using the FYP Chatbot                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Student                                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Student asks questions and receives chatbot guidance.                                      |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Student is logged in; chatbot service is available.                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Answer is displayed; conversation is stored.                                               |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Student opens chatbot.                                                                 |
|                        |                                                                                            |
|                        | 2.  Student asks question.                                                                 |
|                        |                                                                                            |
|                        | 3.  System returns answer and reference source if available.                               |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Low confidence → system suggests contacting FYP Committee and creates help request.    |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Chatbot unavailable → system displays fallback contact instructions.                   |
+------------------------+--------------------------------------------------------------------------------------------+

### 

### 3.5.2 Supervisor Use Case Specifications

Table 3.20 UC16: Manage Supervisor Profile

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC16                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Manage Supervisor Profile                                                                  |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Supervisor                                                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Supervisor updates research areas, quota, and availability.                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Supervisor is logged in.                                                                   |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Profile updates are saved and reflected in search and recommendations.                     |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Supervisor opens profile.                                                              |
|                        |                                                                                            |
|                        | 2.  Supervisor edits fields.                                                               |
|                        |                                                                                            |
|                        | 3.  System validates and saves changes.                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Set temporary unavailability dates.                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Quota violates policy → system blocks save and shows constraints.                      |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.21 UC17: Review and Respond to Supervisor Requests

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC17                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Review and Respond to Supervisor Requests                                                  |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Supervisor                                                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Supervisor accepts, rejects, or requests clarification for requests.                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Supervisor logged in; pending requests exist.                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Request status updated; student notified.                                                  |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Supervisor opens request list.                                                         |
|                        |                                                                                            |
|                        | 2.  Supervisor views request details.                                                      |
|                        |                                                                                            |
|                        | 3.  Supervisor selects accept or reject or clarify.                                        |
|                        |                                                                                            |
|                        | 4.  System updates status and notifies student.                                            |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Clarification requested → student replies, request remains pending.                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Acceptance exceeds quota → system blocks acceptance.                                   |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.22 UC18: View Supervisee List and Project Details

+-------------------------+-------------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                               |
+=========================+===========================================================================================+
| Use Case ID             | UC18                                                                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Use Case Name           | View Supervisee List and Project Details                                                  |
+-------------------------+-------------------------------------------------------------------------------------------+
| Actors                  | Supervisor                                                                                |
+-------------------------+-------------------------------------------------------------------------------------------+
| Description             | Supervisor views supervisees and their project information.                               |
+-------------------------+-------------------------------------------------------------------------------------------+
| Pre-condition           | Supervisor is logged in.                                                                  |
+-------------------------+-------------------------------------------------------------------------------------------+
| Postcondition           | Supervisee list and details are displayed.                                                |
+-------------------------+-------------------------------------------------------------------------------------------+
| Basic Path              | 1.  Supervisor opens supervisee list.                                                     |
|                         |                                                                                           |
|                         | 2.  System displays supervisees with status.                                              |
|                         |                                                                                           |
|                         | 3.  Supervisor opens a supervisee's project details.                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Alternative Path        | A1: Filter by FYP stage or risk status.                                                   |
+-------------------------+-------------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Access attempt to non-assigned student → system denies access.                        |
+-------------------------+-------------------------------------------------------------------------------------------+

Table 3.23 UC19: Review Student Proposal

+---------------------+-----------------------------------------------------------------------------------------------+
| **Field**           | **Details**                                                                                   |
+=====================+===============================================================================================+
| Use Case ID         | UC19                                                                                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Use Case Name       | Review Student Proposal                                                                       |
+---------------------+-----------------------------------------------------------------------------------------------+
| Actors              | Supervisor                                                                                    |
+---------------------+-----------------------------------------------------------------------------------------------+
| Description         | Supervisor reviews the student's submitted proposal in a single workflow screen. The          |
|                     | supervisor can view proposal versions and AI checking results, provide comments, request      |
|                     | revisions, or approve the proposal for project registration. All decisions and remarks are    |
|                     | recorded for traceability.                                                                    |
+---------------------+-----------------------------------------------------------------------------------------------+
| Pre-condition       | Supervisor logged in; proposal is submitted for review.                                       |
+---------------------+-----------------------------------------------------------------------------------------------+
| Postcondition       | Proposal review outcome is recorded. The proposal status is updated to Revision Required or   |
|                     | Approved, and the student is notified. If approved, the project registration status is        |
|                     | updated accordingly and the supervisor's supervision load may be updated.                     |
+---------------------+-----------------------------------------------------------------------------------------------+
| Basic Path          | 1.  Supervisor opens the Proposal Review module.                                              |
|                     |                                                                                               |
|                     | 2.  System lists submitted proposals from supervisees with current status.                    |
|                     |                                                                                               |
|                     | 3.  Supervisor selects a proposal to review.                                                  |
|                     |                                                                                               |
|                     | 4.  System displays proposal details, latest proposal version, and version history.           |
|                     |                                                                                               |
|                     | 5.  System displays AI checking results (score, missing sections, suggested improvements) for |
|                     |     the selected version (if available).                                                      |
|                     |                                                                                               |
|                     | 6.  Supervisor reviews the content and enters remarks/comments.                               |
|                     |                                                                                               |
|                     | 7.  Supervisor chooses an action: Request Revision or Approve.                                |
|                     |                                                                                               |
|                     | 8.  System records the review decision and remarks in the review history.                     |
|                     |                                                                                               |
|                     | 9.  System updates the proposal status accordingly and sends a notification to the student.   |
|                     |                                                                                               |
|                     | 10. If Approve, system updates the project registration status (e.g., Registered/Approved)    |
|                     |     and updates supervisor's current supervision load if applicable.                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Alternative Path    | A1: Review an older version → Supervisor selects a previous proposal version to compare       |
|                     | changes; system shows the chosen version and its AI result\                                   |
|                     | A2: Request multiple revisions → After student resubmits a new version, supervisor repeats    |
|                     | review and requests revision again until acceptable.                                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Exceptional Path    | E1: Proposal not found / already withdrawn → System shows message and refreshes the list.\    |
|                     | E2: Supervisor not authorised (proposal not under their supervisee list) → System denies      |
|                     | access and logs the attempt.\                                                                 |
|                     | E3: Missing required fields for decision (e.g., empty remarks when requesting revision if     |
|                     | required) → System blocks submission and prompts for required input.\                         |
|                     | E4: System error during status update/notification → System saves the review record, shows    |
|                     | error, and retries notification or logs for admin action.                                     |
+---------------------+-----------------------------------------------------------------------------------------------+

Table 3.24 UC20: Manage Supervision Meetings

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC20                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Manage Supervision Meetings                                                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Supervisor                                                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Supervisor confirms, reschedules, or cancels meeting requests.                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Supervisor logged in; meeting requests exist.                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Meeting status updated; student notified.                                                  |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Supervisor opens meeting requests.                                                     |
|                        |                                                                                            |
|                        | 2.  Supervisor selects request.                                                            |
|                        |                                                                                            |
|                        | 3.  Supervisor confirms or reschedules or cancels.                                         |
|                        |                                                                                            |
|                        | 4.  System updates schedule and notifies student.                                          |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Suggest alternative times → student selects a new slot.                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Time conflict detected → system blocks and suggests available slots.                   |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.25 UC21: Review, Comment on and Sign Supervision Log

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC21                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Review, Comment on and Sign Supervision Log                                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Supervisor                                                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Supervisor reviews log, adds comments, and signs.                                          |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Supervisor logged in; student submitted meeting log.                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Supervisor signature recorded; student prompted to sign; log locked after both signatures. |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Supervisor opens submitted log.                                                        |
|                        |                                                                                            |
|                        | 2.  Supervisor adds comments.                                                              |
|                        |                                                                                            |
|                        | 3.  Supervisor signs log.                                                                  |
|                        |                                                                                            |
|                        | 4.  System notifies student to sign.                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Request correction before signing → status becomes Correction Required.                |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Log already locked → system blocks modifications.                                      |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.26 UC22: View Supervisee Progress Dashboard

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC22                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | View Supervisee Progress Dashboard                                                         |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | Supervisor                                                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Supervisor views progress indicators for meetings, logs, documents, and deadlines.         |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | Supervisor logged in.                                                                      |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | [Dashboard is displayed showing, for each supervisee: proposal status, total and recent    |
|                        | meeting count, supervision-log compliance (submitted / signed / locked), document          |
|                        | submission state per phase, and upcoming deadlines, with at-risk supervisees               |
|                        | highlighted.]{.mark}                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Supervisor opens progress dashboard.                                                   |
|                        |                                                                                            |
|                        | 2.  System aggregates supervisee progress data [(proposal status, meeting count, log       |
|                        |     compliance, document submission state, upcoming deadlines)]{.mark}.                    |
|                        |                                                                                            |
|                        | 3.  System displays indicators and alerts [and highlights supervisees who are at risk      |
|                        |     (e.g., overdue logs, missing documents, no recent meetings)]{.mark}.                   |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Export progress summary report.                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Metrics service failure → system shows partial results and logs issue.                 |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.27 UC23: Upload, Download and Review FYP Documents

+-------------------------+---------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                           |
+=========================+=======================================================================================+
| Use Case ID             | UC23                                                                                  |
+-------------------------+---------------------------------------------------------------------------------------+
| Use Case Name           | Upload, Download and Review FYP Documents                                             |
+-------------------------+---------------------------------------------------------------------------------------+
| Actors                  | Supervisor                                                                            |
+-------------------------+---------------------------------------------------------------------------------------+
| Description             | Supervisor reviews student documents and uploads feedback.                            |
+-------------------------+---------------------------------------------------------------------------------------+
| Pre-condition           | Supervisor logged in; documents exist.                                                |
+-------------------------+---------------------------------------------------------------------------------------+
| Postcondition           | Feedback files stored; student notified.                                              |
+-------------------------+---------------------------------------------------------------------------------------+
| Basic Path              | 1.  Supervisor opens student documents list.                                          |
|                         |                                                                                       |
|                         | 2.  Supervisor downloads and reviews.                                                 |
|                         |                                                                                       |
|                         | 3.  Supervisor uploads feedback file.                                                 |
|                         |                                                                                       |
|                         | 4.  System notifies student.                                                          |
+-------------------------+---------------------------------------------------------------------------------------+
| Alternative Path        | A1: Request resubmission with remarks.                                                |
+-------------------------+---------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Upload fails security scan → system rejects upload.                               |
+-------------------------+---------------------------------------------------------------------------------------+

Table 3.28 UC24: Publish FYP Announcements

+-------------------------+-----------------------------------------------------------------------------+
| **Field**               | **Details**                                                                 |
+=========================+=============================================================================+
| Use Case ID             | UC24                                                                        |
+-------------------------+-----------------------------------------------------------------------------+
| Use Case Name           | Publish FYP Announcements                                                   |
+-------------------------+-----------------------------------------------------------------------------+
| Actors                  | Supervisor                                                                  |
+-------------------------+-----------------------------------------------------------------------------+
| Description             | Supervisor publishes announcements to supervisees.                          |
+-------------------------+-----------------------------------------------------------------------------+
| Pre-condition           | Supervisor logged in; supervisees exist.                                    |
+-------------------------+-----------------------------------------------------------------------------+
| Postcondition           | Announcement published; recipients notified.                                |
+-------------------------+-----------------------------------------------------------------------------+
| Basic Path              | 1.  Supervisor creates announcement.                                        |
|                         |                                                                             |
|                         | 2.  Supervisor selects audience (supervisees).                              |
|                         |                                                                             |
|                         | 3.  Supervisor publishes.                                                   |
|                         |                                                                             |
|                         | 4.  System sends notifications.                                             |
+-------------------------+-----------------------------------------------------------------------------+
| Alternative Path        | A1: Schedule announcement for a future date.                                |
+-------------------------+-----------------------------------------------------------------------------+
| Exceptional Path        | E1: Invalid content (empty) → system blocks publish.                        |
+-------------------------+-----------------------------------------------------------------------------+

### 3.5.3 FYP Committee Use Case Specifications

Table 3.29 UC24: Publish FYP Announcements

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC24                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Publish FYP Announcements                                                                  |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | FYP Committee                                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Admin publishes faculty-level announcements for selected users and cycles.                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | FYP Committee logged in.                                                                   |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | Announcement published and logged; recipients notified.                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Admin creates announcement.                                                            |
|                        |                                                                                            |
|                        | 2.  Admin selects audience and cycle.                                                      |
|                        |                                                                                            |
|                        | 3.  Admin publishes.                                                                       |
|                        |                                                                                            |
|                        | 4.  System sends notifications.                                                            |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Schedule announcement release time.                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Missing audience selection → system blocks publish.                                    |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.30 UC25: View Proposal Review Queue

+-------------------------+------------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                              |
+=========================+==========================================================================================+
| Use Case ID             | UC25                                                                                     |
+-------------------------+------------------------------------------------------------------------------------------+
| Use Case Name           | View Proposal Review Queue                                                               |
+-------------------------+------------------------------------------------------------------------------------------+
| Actors                  | FYP Committee                                                                            |
+-------------------------+------------------------------------------------------------------------------------------+
| Description             | Admin views proposals awaiting committee review.                                         |
+-------------------------+------------------------------------------------------------------------------------------+
| Pre-condition           | FYP Committee is logged in.                                                              |
+-------------------------+------------------------------------------------------------------------------------------+
| Postcondition           | Queue list displayed.                                                                    |
+-------------------------+------------------------------------------------------------------------------------------+
| Basic Path              | 1.  Admin opens queue page.                                                              |
|                         |                                                                                          |
|                         | 2.  System lists proposals with status and filters.                                      |
|                         |                                                                                          |
|                         | 3.  Admin opens a proposal record.                                                       |
+-------------------------+------------------------------------------------------------------------------------------+
| Alternative Path        | A1: Filter by programme or supervisor or status.                                         |
+-------------------------+------------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Permission error → system denies access and logs attempt.                            |
+-------------------------+------------------------------------------------------------------------------------------+

Table 3.31 UC26: Review Proposal

+---------------------+-----------------------------------------------------------------------------------------------+
| **Field**           | **Details**                                                                                   |
+=====================+===============================================================================================+
| Use Case ID         | UC26                                                                                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Use Case Name       | Review Proposal                                                                               |
+---------------------+-----------------------------------------------------------------------------------------------+
| Actors              | FYP Committee                                                                                 |
+---------------------+-----------------------------------------------------------------------------------------------+
| Description         | FYP Committee reviews submitted proposals in a single workflow screen. The committee can view |
|                     | proposal versions and AI checking results, record remarks, and make a decision to approve,    |
|                     | reject, or request revision. All decisions are stored for traceability and official record    |
|                     | keeping.                                                                                      |
+---------------------+-----------------------------------------------------------------------------------------------+
| Pre-condition       | FYP Committee logged in; proposal exists in queue.                                            |
+---------------------+-----------------------------------------------------------------------------------------------+
| Postcondition       | Committee decision is recorded. Proposal status is updated to Approved, Rejected, or Revision |
|                     | Required, and relevant parties (student and supervisor) are notified. If approved, project    |
|                     | registration status is updated accordingly.                                                   |
+---------------------+-----------------------------------------------------------------------------------------------+
| Basic Path          | 1.  Committee member opens the Proposal Review Queue.                                         |
|                     |                                                                                               |
|                     | 2.  System displays proposals pending committee action with filtering/sorting options.        |
|                     |                                                                                               |
|                     | 3.  Committee member selects a proposal.                                                      |
|                     |                                                                                               |
|                     | 4.  System displays proposal details, latest version, and version history.                    |
|                     |                                                                                               |
|                     | 5.  System displays AI checking results (score, missing sections, suggested improvements) for |
|                     |     the selected version (if available).                                                      |
|                     |                                                                                               |
|                     | 6.  Committee member reviews content and enters remarks/comments.                             |
|                     |                                                                                               |
|                     | 7.  Committee member selects a decision: Approve, Reject, or Request Revision.                |
|                     |                                                                                               |
|                     | 8.  System records the decision and remarks in the review history.                            |
|                     |                                                                                               |
|                     | 9.  System updates proposal status and, if applicable, updates project registration status.   |
|                     |                                                                                               |
|                     | 10. System notifies the student and supervisor of the outcome.                                |
+---------------------+-----------------------------------------------------------------------------------------------+
| Alternative Path    | A1: Review previous versions → Committee member opens earlier versions to compare changes;    |
|                     | system displays selected version and related AI results if available.\                        |
|                     | A2: Request additional information → Committee member requests clarification and specifies    |
|                     | required updates in remarks.\                                                                 |
|                     | A3: Multiple revision cycles → Student resubmits a new version; proposal returns to the queue |
|                     | until decision is finalised.\                                                                 |
|                     | A4: Assign to another committee member → Proposal remains in queue but reviewer changes.      |
+---------------------+-----------------------------------------------------------------------------------------------+
| Exceptional Path    | E1: Proposal not found / already finalised → System shows message and refreshes the queue.\   |
|                     | E2: Committee member not authorised → System denies access and logs the attempt.\             |
|                     | E3: Missing required remarks for revision/rejection → System blocks submission and prompts    |
|                     | for mandatory remarks.\                                                                       |
|                     | E4: System error during status update/notification → System saves the review record, shows    |
|                     | error, and retries notification or logs for admin follow-up.                                  |
+---------------------+-----------------------------------------------------------------------------------------------+

Table 3.32 UC27: Manage General FYP Documents

+-------------------------+-------------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                               |
+=========================+===========================================================================================+
| Use Case ID             | UC27                                                                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Use Case Name           | Manage General FYP Documents                                                              |
+-------------------------+-------------------------------------------------------------------------------------------+
| Actors                  | FYP Committee                                                                             |
+-------------------------+-------------------------------------------------------------------------------------------+
| Description             | Admin uploads and maintains handbook, templates, rubrics, and forms.                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Pre-condition           | FYP Committee logged in.                                                                  |
+-------------------------+-------------------------------------------------------------------------------------------+
| Postcondition           | Resources updated and published.                                                          |
+-------------------------+-------------------------------------------------------------------------------------------+
| Basic Path              | 1.  Admin opens resources module.                                                         |
|                         |                                                                                           |
|                         | 2.  Admin uploads or replaces files.                                                      |
|                         |                                                                                           |
|                         | 3.  Admin assigns category and publish settings.                                          |
|                         |                                                                                           |
|                         | 4.  System makes resources available to users.                                            |
+-------------------------+-------------------------------------------------------------------------------------------+
| Alternative Path        | A1: Archive old version for reference.                                                    |
+-------------------------+-------------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Invalid file type → system rejects upload.                                            |
+-------------------------+-------------------------------------------------------------------------------------------+

Table 3.33 UC28: View FYP Project and Pairing Overview

+---------------------+-----------------------------------------------------------------------------------------------+
| **Field**           | **Details**                                                                                   |
+=====================+===============================================================================================+
| Use Case ID         | UC28                                                                                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Use Case Name       | View FYP Project and Pairing Overview                                                         |
+---------------------+-----------------------------------------------------------------------------------------------+
| Actors              | FYP Committee                                                                                 |
+---------------------+-----------------------------------------------------------------------------------------------+
| Description         | FYP Committee monitors FYP projects and supervisor--student pairings across programmes and    |
|                     | cycles in a single dashboard. The dashboard summarises project statuses and pairing progress, |
|                     | and highlights unpaired students and overloaded supervisors to support timely administrative  |
|                     | actions.                                                                                      |
+---------------------+-----------------------------------------------------------------------------------------------+
| Pre-condition       | FYP Committee logged in.                                                                      |
+---------------------+-----------------------------------------------------------------------------------------------+
| Postcondition       | Overview dashboard is displayed with pairing status, project status summaries, and            |
|                     | highlighted exceptions (unpaired students / overloaded supervisors).                          |
+---------------------+-----------------------------------------------------------------------------------------------+
| Basic Path          | 1.  Committee member opens the Project & Pairing Overview dashboard.                          |
|                     |                                                                                               |
|                     | 2.  System retrieves and aggregates project and pairing data for the selected FYP cycle       |
|                     |     (default to current cycle).                                                               |
|                     |                                                                                               |
|                     | 3.  System displays overall statistics (e.g., total projects, paired vs unpaired students,    |
|                     |     supervisor load distribution).                                                            |
|                     |                                                                                               |
|                     | 4.  System lists key items, including: (a) unpaired students, (b) projects pending supervisor |
|                     |     assignment, and (c) supervisors approaching/exceeding quota.                              |
|                     |                                                                                               |
|                     | 5.  Committee member uses filters (programme, specialisation, supervisor, status) to refine   |
|                     |     the view.                                                                                 |
+---------------------+-----------------------------------------------------------------------------------------------+
| Alternative Path    | A1: Drill down by supervisor → Committee member selects a supervisor to view assigned         |
|                     | students/projects and current load.\                                                          |
|                     | A2: Drill down by programme/specialisation → Committee member filters by                      |
|                     | programme/specialisation to view localised pairing progress and exceptions.\                  |
|                     | A3: Export overview → Committee member exports the list/summary (e.g., CSV/PDF report) for    |
|                     | reporting purposes                                                                            |
+---------------------+-----------------------------------------------------------------------------------------------+
| Exceptional Path    | E1: Query timeout / dataset too large → System prompts the user to apply filters (e.g.,       |
|                     | cycle/programme) and retries with the refined query.\                                         |
|                     | E2: No data available for selected cycle → System displays an empty-state message and         |
|                     | suggests selecting another cycle or confirming cycle setup.\                                  |
|                     | E3: Access not authorised → System denies access and logs the attempt.                        |
+---------------------+-----------------------------------------------------------------------------------------------+

Table 3.34 UC29: Generate and Export FYP Reports

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC29                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Generate and Export FYP Reports                                                            |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | FYP Committee                                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Admin generates and exports reports such as pairing status and approved projects.          |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | FYP Committee logged in.                                                                   |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | [Report file is produced in the requested format (CSV / PDF) and the report metadata       |
|                        | (type, title, filters, format, file path, generated-by user, timestamp, expiry) is         |
|                        | persisted in the system so it can be re-downloaded later from the report history.]{.mark}  |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Admin selects report type.                                                             |
|                        |                                                                                            |
|                        | 2.  Admin sets filters [and chooses output format (CSV / PDF)]{.mark}.                     |
|                        |                                                                                            |
|                        | 3.  System generates report [and stores the report metadata (filters, format, file path,   |
|                        |     generated-by user, timestamp) for later retrieval]{.mark}.                             |
|                        |                                                                                            |
|                        | 4.  Admin downloads output file [or accesses it later from the report history              |
|                        |     list]{.mark}.                                                                          |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Save report configuration for reuse [(stored as a reusable export preset with selected |
|                        | fields, filters, and schedule)]{.mark}.                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Export generation failed → system displays error and logs incident.                    |
+------------------------+--------------------------------------------------------------------------------------------+

### 3.5.4 System Administrator Use Case Specifications

Table 3.35 UC30: Manage User Accounts and Roles

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC30                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Manage User Accounts and Roles                                                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | System Administrator                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | System administrator manages accounts, roles, and access rights.                           |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | System Administrator is logged in.                                                         |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | User account and role updates are applied.                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | 1.  Admin searches user.                                                                   |
|                        |                                                                                            |
|                        | 2.  Admin edits role and status.                                                           |
|                        |                                                                                            |
|                        | 3.  System validates and saves changes.                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Disable account for security reasons.\                                                 |
|                        | [A2: Bulk-create user accounts from a CSV file → Admin uploads a CSV containing MMU ID,    |
|                        | email, full name, and role; the system validates each row, creates the accounts in one     |
|                        | batch, and reports successes and row-level errors.]{.mark}\                                |
|                        | \                                                                                          |
|                        | [A3: Admin uploads a pre-approved roster CSV (student or supervisor side) at               |
|                        | \`/admin/approved-roster\` → matching self-registrations bypass the PENDING queue and      |
|                        | become ACTIVE on first login. This decouples cohort admission from registration and        |
|                        | removes the one-by-one approval load at the start of every cycle.]{.mark}\                 |
|                        | \                                                                                          |
|                        | [A4: Admin reviews the pending-registrations queue at \`/admin/pending-registrations\` →   |
|                        | for each non-roster registration, the admin clicks Approve (status flips to \`ACTIVE\`, an |
|                        | in-app notification fires, the user can log in) or Reject (status flips to \`BLOCKED\`     |
|                        | with an optional reason).]{.mark}                                                          |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Attempt to remove last System Administrator role → system blocks action.               |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.36 UC31: Configure System Parameters

+-------------------------+-------------------------------------------------------------------------------------------+
| **Field**               | **Details**                                                                               |
+=========================+===========================================================================================+
| Use Case ID             | UC31                                                                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Use Case Name           | Configure System Parameters                                                               |
+-------------------------+-------------------------------------------------------------------------------------------+
| Actors                  | System Administrator                                                                      |
+-------------------------+-------------------------------------------------------------------------------------------+
| Description             | Admin configures FYP cycles, sessions, and policy parameters.                             |
+-------------------------+-------------------------------------------------------------------------------------------+
| Pre-condition           | System Administrator logged in.                                                           |
+-------------------------+-------------------------------------------------------------------------------------------+
| Postcondition           | Settings saved and applied.                                                               |
+-------------------------+-------------------------------------------------------------------------------------------+
| Basic Path              | 1.  Admin opens settings.                                                                 |
|                         |                                                                                           |
|                         | 2.  Admin updates parameters.                                                             |
|                         |                                                                                           |
|                         | 3.  System validates constraints.                                                         |
|                         |                                                                                           |
|                         | 4.  System saves configuration.                                                           |
+-------------------------+-------------------------------------------------------------------------------------------+
| Alternative Path        | A1: Preview setting impact before applying.                                               |
+-------------------------+-------------------------------------------------------------------------------------------+
| Exceptional Path        | E1: Invalid values → system blocks save and displays constraints.                         |
+-------------------------+-------------------------------------------------------------------------------------------+

Table 3.37 UC32: Configure Integration and Export Settings

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | UC32                                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | Configure Integration and Export Settings                                                  |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | System Administrator                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | Admin configures integrations and export formats for faculty systems. [The use case covers |
|                        | two related sub-flows: (a) Integration Settings --- managing third-party endpoints (e.g.,  |
|                        | MMU SSO, email service, AI services) with credentials and test connections; and (b) Export |
|                        | Configurations --- defining reusable export presets (data type, fields, filters, format,   |
|                        | schedule) used by reporting and data-exchange features.]{.mark}                            |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | System Administrator logged in; integration info available.                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | [(a) Integration sub-flow: Integration record is stored with type, provider, endpoint,     |
|                        | settings, and last-test result; connection is tested and status is recorded. (b) Export    |
|                        | sub-flow: Export configuration record is stored with name, data type, format, included     |
|                        | fields, filters, date format, and optional schedule, and is available as a reusable preset |
|                        | for report generation and data export.]{.mark}                                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | []{.mark}                                                                                  |
|                        |                                                                                            |
|                        | Admin chooses to manage Integration Settings or Export Configurations.                     |
|                        |                                                                                            |
|                        | Admin enters endpoints and credentials [(integration sub-flow) or defines export name,     |
|                        | data type, format, fields, filters, and schedule (export sub-flow)]{.mark}.                |
|                        |                                                                                            |
|                        | Admin runs test connection [(integration sub-flow) or previews a sample export (export     |
|                        | sub-flow)]{.mark}.                                                                         |
|                        |                                                                                            |
|                        | System saves settings [and records the last-test result or last-export timestamp           |
|                        | accordingly]{.mark}.                                                                       |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | A1: Disable integration temporarily.\                                                      |
|                        | [A2: Edit an existing export configuration → Admin updates fields, filters, or schedule;   |
|                        | system updates the preset and the next scheduled run uses the new definition.\             |
|                        | A3: Run an export immediately from a saved configuration → System generates the file using |
|                        | the preset and updates the last-export path and timestamp.]{.mark}                         |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | E1: Test connection fails → system blocks or saves as disabled with error note.\           |
|                        | [E2: Export configuration validation fails (e.g., unknown field, invalid date format) →    |
|                        | System blocks save and displays the offending field.]{.mark}                               |
+------------------------+--------------------------------------------------------------------------------------------+

Table 3.38 UC33: Perform System Maintenance

+-----------------------------+---------------------------------------------------------------------------------------+
| **Field**                   | **Details**                                                                           |
+=============================+=======================================================================================+
| Use Case ID                 | UC33                                                                                  |
+-----------------------------+---------------------------------------------------------------------------------------+
| Use Case Name               | Perform System Maintenance                                                            |
+-----------------------------+---------------------------------------------------------------------------------------+
| Actors                      | System Administrator                                                                  |
+-----------------------------+---------------------------------------------------------------------------------------+
| Description                 | Admin performs backup, restore, and monitoring tasks.                                 |
+-----------------------------+---------------------------------------------------------------------------------------+
| Pre-condition               | System Administrator logged in; maintenance permissions granted.                      |
+-----------------------------+---------------------------------------------------------------------------------------+
| Postcondition               | [A maintenance job record is created with job type, status (Pending / Running /       |
|                             | Completed / Failed), start and completion timestamps, result message and structured   |
|                             | result data, and the triggering administrator\'s identity. The job result is retained |
|                             | for auditing and visible in the maintenance job history.]{.mark}                      |
+-----------------------------+---------------------------------------------------------------------------------------+
| Basic Path                  | 1.  Admin selects maintenance task [(e.g., backup, cleanup, integrity check, cache    |
|                             |     reset)]{.mark}.                                                                   |
|                             |                                                                                       |
|                             | 2.  Admin confirms execution.                                                         |
|                             |                                                                                       |
|                             | 3.  System [creates a maintenance job record (status = Running, triggered-by user     |
|                             |     recorded), runs the task, and updates the record on completion with outcome       |
|                             |     status, result data, and timestamps]{.mark}.                                      |
+-----------------------------+---------------------------------------------------------------------------------------+
| Alternative Path            | A1: Schedule automatic backup.\                                                       |
|                             | [A2: View maintenance job history → Admin opens the job list, filters by job type or  |
|                             | status, and inspects past runs and their result details.]{.mark}                      |
+-----------------------------+---------------------------------------------------------------------------------------+
| Exceptional Path            | E1: Backup fails due to storage issue → system alerts and logs critical error [and    |
|                             | marks the maintenance job as Failed with the error message captured in the job        |
|                             | record]{.mark}.                                                                       |
+-----------------------------+---------------------------------------------------------------------------------------+

<mark>Table 3.39 UC34: Track FYP1 Pass Outcome</mark>

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | [UC34]{.mark}                                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | [Track FYP1 Pass Outcome]{.mark}                                                           |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | [System Administrator]{.mark}                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | [System Administrator records each student\'s FYP1 pass-or-fail decision against an        |
|                        | externally produced grade list (eBwise / Clic). The system surfaces the meeting-log        |
|                        | compliance count as a non-blocking soft warning so that students with fewer than the       |
|                        | FCI-required six logs are visible at decision time without being auto-rejected.]{.mark}    |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | [FYP1 cycle is \`ACTIVE\` or \`COMPLETED\`; admin is logged in.]{.mark}                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | [Each project\'s \`fyp1_passed\` flag is set (TRUE / FALSE / NULL); passed students will   |
|                        | be promoted to the next ACTIVE FYP2 cycle on their next login.]{.mark}                     |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | []{.mark}                                                                                  |
|                        |                                                                                            |
|                        | 1.  Admin opens the FYP1 Pass Tracking page.                                               |
|                        |                                                                                            |
|                        | 2.  System lists every project in the relevant cycle with a compliance badge (green when ≥ |
|                        |     6 LOCKED meeting logs for the FYP1 phase, yellow when below).                          |
|                        |                                                                                            |
|                        | 3.  Admin clicks Pass or Fail for each project.                                            |
|                        |                                                                                            |
|                        | 4.  System writes \`Project.fyp1_passed\` and audit-records the decision (\`FYP1_PASSED\`  |
|                        |     / \`FYP1_FAILED\`).                                                                    |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | [A1: Admin marks Pass when the badge is yellow → confirmation modal quotes the shortfall   |
|                        | (\"only 4 of 6 logs\"); admin confirms or cancels.\                                        |
|                        | \                                                                                          |
|                        | A2: Admin uploads a CSV of pass/fail decisions for batch processing (\`POST                |
|                        | /admin/projects/fyp1-passed/import\`); the system validates each row, applies the          |
|                        | outcomes, and reports successes and row-level errors.]{.mark}                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | [E1: Project has no supervisor or no Project row → system marks the row as ineligible and  |
|                        | skips it.\                                                                                 |
|                        | \                                                                                          |
|                        | E2: Database write fails → system rolls back, audit-records the failure, and surfaces the  |
|                        | error to the admin.]{.mark}                                                                |
+------------------------+--------------------------------------------------------------------------------------------+

<mark>Table 3.40 UC35: Grade Final Report</mark>

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | [UC35]{.mark}                                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | [Grade Final Report]{.mark}                                                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | [Supervisor (grader), System Administrator (finaliser), Student (reader of finalised       |
|                        | grade)]{.mark}                                                                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | [Supervisor grades a student\'s FYP1 or FYP2 final report against a JSON rubric. The grade |
|                        | goes through \`DRAFT → SUBMITTED → FINALISED\`. Only FINALISED grades are visible to the   |
|                        | student. The total score is the sum of the numeric criterion marks; the letter grade is    |
|                        | derived against the MMU FCI scale.]{.mark}                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | [Project exists and the student is paired; the grader is the assigned supervisor for the   |
|                        | project (per-row ownership check).]{.mark}                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | [One \`FypGrade\` row exists per (project, phase, grader); the FINALISED grade is visible  |
|                        | to the student on their dashboard.]{.mark}                                                 |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | []{.mark}                                                                                  |
|                        |                                                                                            |
|                        | 1.  Supervisor opens the supervisee\'s grading page.                                       |
|                        |                                                                                            |
|                        | 2.  Supervisor enters criterion marks against the rubric and optional remarks.             |
|                        |                                                                                            |
|                        | 3.  System derives \`total_score\` (sum of numeric criterion marks) and \`letter_grade\`   |
|                        |     (MMU FCI scale: ≥80 A, ≥75 A−, ≥70 B+, ≥65 B, ≥60 B−, ≥55 C+, ≥50 C, ≥45 C−, ≥40 D,    |
|                        |     otherwise F).                                                                          |
|                        |                                                                                            |
|                        | 4.  Supervisor saves as \`DRAFT\` or submits as \`SUBMITTED\`.                             |
|                        |                                                                                            |
|                        | 5.  Admin opens the grade administration page and reviews submitted grades.                |
|                        |                                                                                            |
|                        | 6.  Admin clicks Finalise → grade status flips to \`FINALISED\`; \`finalised_by_user_id\`  |
|                        |     and \`finalised_at\` are recorded.                                                     |
|                        |                                                                                            |
|                        | 7.  Student sees the FINALISED grade and the grader\'s remarks on their dashboard.         |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | [A1: Supervisor saves as DRAFT and returns later → grade remains hidden from the admin\'s  |
|                        | submitted-queue and from the student.\                                                     |
|                        | \                                                                                          |
|                        | A2: Multiple graders (supervisor + examiner) → separate \`FypGrade\` rows per grader;      |
|                        | \`UNIQUE (project_id, phase, grader_user_id)\` enforces one row per grader per             |
|                        | phase.]{.mark}                                                                             |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | [E1: A non-assigned supervisor attempts to grade the project → system rejects with \"You   |
|                        | are not the assigned supervisor for this project\" (per-row ownership check via            |
|                        | \`GradingService\`).\                                                                      |
|                        | \                                                                                          |
|                        | E2: Grader edits a FINALISED grade → system rejects; the admin must revert the grade to    |
|                        | SUBMITTED first.]{.mark}                                                                   |
+------------------------+--------------------------------------------------------------------------------------------+

<mark>Table 3.41 UC36: Manage FYP Cycle Lifecycle</mark>

+------------------------+--------------------------------------------------------------------------------------------+
| **Field**              | **Details**                                                                                |
+========================+============================================================================================+
| Use Case ID            | [UC36]{.mark}                                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Use Case Name          | [Manage FYP Cycle Lifecycle]{.mark}                                                        |
+------------------------+--------------------------------------------------------------------------------------------+
| Actors                 | [System Administrator]{.mark}                                                              |
+------------------------+--------------------------------------------------------------------------------------------+
| Description            | [System Administrator creates, activates, completes, and archives FYP cycles. Cycle        |
|                        | activation triggers placeholder backfill for unenrolled students; cycle completion         |
|                        | triggers notification fan-out and read-only mode for enrolled students. The invariant \"at |
|                        | most one ACTIVE cycle per \`cycle_type\` (FYP1 or FYP2)\" is enforced by                   |
|                        | \`CycleLifecycleService\`.]{.mark}                                                         |
+------------------------+--------------------------------------------------------------------------------------------+
| Pre-condition          | [System Administrator is logged in.]{.mark}                                                |
+------------------------+--------------------------------------------------------------------------------------------+
| Postcondition          | [Cycle status reflects the requested transition (\`PLANNING → ACTIVE → COMPLETED →         |
|                        | ARCHIVED\`); downstream side effects (placeholder rows, notifications, write-mode gating)  |
|                        | are applied automatically.]{.mark}                                                         |
+------------------------+--------------------------------------------------------------------------------------------+
| Basic Path             | []{.mark}                                                                                  |
|                        |                                                                                            |
|                        | 1.  Admin creates a new cycle with type (FYP1 / FYP2), academic year, semester, start and  |
|                        |     end dates. Cycle status starts as \`PLANNING\`.                                        |
|                        |                                                                                            |
|                        | 2.  Admin attaches deadlines to the cycle (proposal due, log compliance check, final       |
|                        |     report submission), each with a JSON array of reminder days.                           |
|                        |                                                                                            |
|                        | 3.  Admin activates the cycle. The system: (a) demotes any other ACTIVE cycle of the same  |
|                        |     type to \`COMPLETED\` and fans out notifications to all enrolled students; (b) for an  |
|                        |     FYP1 cycle, runs \`backfillFyp1Placeholders\` so every ACTIVE student without a        |
|                        |     Project row gets a placeholder one pinned to the new cycle.                            |
|                        |                                                                                            |
|                        | 4.  Cycle runs through the trimester. All student write endpoints work as normal.          |
|                        |                                                                                            |
|                        | 5.  End of trimester: admin marks the cycle \`COMPLETED\`. The system fans out             |
|                        |     notifications to every enrolled student and switches student write endpoints to        |
|                        |     read-only --- the cycle-active gate (\`StudentAccessService.requireActiveCycle\`)      |
|                        |     begins to throw 403 with a friendly \"your cycle has ended\" message.                  |
|                        |                                                                                            |
|                        | 6.  After the academic year closes, admin archives the cycle. It drops off default views   |
|                        |     but is preserved as a historical record.                                               |
+------------------------+--------------------------------------------------------------------------------------------+
| Alternative Path       | [A1: Stale-placeholder special case → a student whose previous placeholder cycle just      |
|                        | COMPLETED and who never picked a supervisor has their placeholder re-pointed to the next   |
|                        | ACTIVE FYP1 cycle automatically. The student is not punished for missing the previous      |
|                        | cycle.\                                                                                    |
|                        | \                                                                                          |
|                        | A2: FYP1 → FYP2 promotion → after a passed student\'s FYP1 cycle is COMPLETED and a new    |
|                        | FYP2 cycle is ACTIVE, the student\'s \`Project.stage\` flips on next login (handled by     |
|                        | \`AuthService.refreshFyp1Status\`).\                                                       |
|                        | \                                                                                          |
|                        | A3: Admin edits an existing PLANNING cycle (dates, deadlines) → changes apply directly; no |
|                        | notifications fire because the cycle is not yet visible to students.]{.mark}               |
+------------------------+--------------------------------------------------------------------------------------------+
| Exceptional Path       | [E1: Two ACTIVE cycles of the same type would coexist → blocked by the invariant; admin    |
|                        | must complete the existing one first.\                                                     |
|                        | \                                                                                          |
|                        | E2: Cycle activation fails after partial side-effect application → system rolls back the   |
|                        | partial state, logs the failure, and surfaces the error to the admin.]{.mark}              |
+------------------------+--------------------------------------------------------------------------------------------+

##  3.6 Entity Relationship Diagram

Note: refer to @Project-info/reports/ERD.md

Figure 3.3 Entity Relationship Diagram

### 3.6.1 ERD Overview

Figure 3.3 presents the Entity Relationship Diagram (ERD) of the FYP Supervision System. The ERD models the core data structure required to support user management, project supervision workflows, proposal handling, meeting management, document storage, system communications, and administrative auditing. The USER_ACCOUNT entity serves as the central identity table for all system roles (student, supervisor, and administrators), while STUDENT_PROFILE and SUPERVISOR_PROFILE store role-specific information using optional one-to-one relationships <mark>(both profile tables share their primary key with USER_ACCOUNT.user_id, and all role-based foreign keys throughout the schema reference USER_ACCOUNT.user_id directly)</mark>.

Each FYP_CYCLE contains multiple PROJECT records. A project is owned by a student and may be assigned to a supervisor through foreign keys referencing USER_ACCOUNT. Students may submit SUPERVISOR_REQUEST records to request supervision, supporting the supervisor selection and assignment process.

For proposal handling, each project is associated with PROPOSAL records and maintains revision history through PROPOSAL_VERSION. Automated proposal analysis results are stored in PROPOSAL_CHECK_RESULT, while review decisions and feedback are captured in PROPOSAL_REVIEW to support approval tracking and revision management. <mark>To support overall (proposal-level) AI checks, PROPOSAL_CHECK_RESULT may also reference a PROPOSAL directly, in addition to the version-level link, so AI evaluation can be recorded against either a specific PROPOSAL_VERSION or the proposal as a whole.</mark>

Supervision meetings are managed in MEETING, and each meeting may optionally generate a corresponding MEETING_LOG (0..1). Meeting logs can be verified by both parties via MEETING_LOG_SIGNATURE before being locked as an official supervision record. Project deliverables and uploaded files are stored in PROJECT_DOCUMENT, while shared templates, rubrics, and administrative materials are stored in RESOURCE_DOCUMENT.

Important dates and submissions are tracked using DEADLINE. System communication is supported through ANNOUNCEMENT, targeted audiences in ANNOUNCEMENT_AUDIENCE, and user NOTIFICATION for reminders and alerts. <mark>Per-user channel and category preferences for notifications are stored in USER_NOTIFICATION_PREFERENCES, which has an optional one-to-one relationship with USER_ACCOUNT.</mark> Chatbot interactions are recorded in CHAT_SESSION and CHAT_MESSAGE. Administrative configuration and traceability are supported through SYSTEM_PARAMETER, INTEGRATION_SETTING, and AUDIT_LOG.

<mark>For administrative reporting and operational tasks, three additional entities are introduced. GENERATED_REPORT records the metadata of every report produced by the FYP Committee (report type, title, format, filters, file path, expiry, and the generating user) so that previously generated reports can be retrieved later. EXPORT_CONFIG stores reusable export presets (data type, included fields, filters, output format, optional schedule, and last-export information) used by the reporting and data-exchange features. MAINTENANCE_JOB tracks system maintenance and cleanup tasks performed by the System Administrator, capturing the job type, status, start/completion timestamps, result, and the triggering administrator for full auditability.</mark>

The full database table descriptions for all entities shown in Figure 3.3, including attributes, keys, constraints, and field definitions, are provided in Appendix F (ERD Table Dictionary).

### 3.6.2 Use Case to Database Traceability (CRUD Mapping)

Tables 3.47–3.50 show traceability between use cases and database tables.

Table 3.47: Student Use Cases (UC1<mark>–UC15</mark>) and Main Database Tables Involved (CRUD)

| **Use Case** | **Main Tables Involved (CRUD)** |
|----|----|
| UC1 – Register and Log In | USER_ACCOUNT (C/R/U last_login_at), AUDIT_LOG (C) |
| UC2 – Manage Student Profile | STUDENT_PROFILE (C/U), USER_ACCOUNT (U), AUDIT_LOG (C) |
| UC3 – View FYP Dashboard | PROJECT (R), PROPOSAL (R), MEETING (R), DEADLINE (R), NOTIFICATION (R) |
| UC4 – Browse and Search Supervisors | SUPERVISOR_PROFILE (R), USER_ACCOUNT (R) |
| UC5 – View AI Supervisor Recommendations | SUPERVISOR_PROFILE (R), USER_ACCOUNT (R), AUDIT_LOG (C) |
| UC6 – Send Supervisor Request | SUPERVISOR_REQUEST (C), NOTIFICATION (C), AUDIT_LOG (C) |
| UC7 – Manage Proposal | PROPOSAL (C/U), PROPOSAL_VERSION (C), PROPOSAL_CHECK_RESULT (C<mark>, version-level or proposal-level</mark>), PROPOSAL_REVIEW (R), NOTIFICATION (C), AUDIT_LOG (C) |
| UC8 – View Proposal Status | PROPOSAL (R), PROPOSAL_VERSION (R), <mark>PROPOSAL_CHECK_RESULT (R), </mark>PROPOSAL_REVIEW (R) |
| UC9 – View Project Registration Status | PROJECT (R), FYP_CYCLE (R) |
| UC10 – Manage Meeting Schedule | MEETING (C/R/U), NOTIFICATION (C), AUDIT_LOG (C) |
| UC11 – Manage Supervision Log | MEETING_LOG (C/R/U), MEETING_LOG_SIGNATURE (C/R), MEETING (R), NOTIFICATION (C), AUDIT_LOG (C) |
| UC12 – Upload and Manage FYP Documents | PROJECT_DOCUMENT (C/R/U/D), AUDIT_LOG (C) |
| UC13 – View FYP Guidelines, Rubrics and Deadlines | RESOURCE_DOCUMENT (R), DEADLINE (R), ANNOUNCEMENT (R) |
| UC14 – View Reminders and Notifications | NOTIFICATION (R/U read_at)<mark>, USER_NOTIFICATION_PREFERENCES (R/U)</mark> |
| UC15 – Ask Questions Using the FYP Chatbot | CHAT_SESSION (C/R), CHAT_MESSAGE (C/R<mark>)</mark> |

Table 3.48: Supervisor Use Cases (UC1, <mark>UC16–UC24</mark>) and Main Database Tables Involved (CRUD)

| **Use Case** | **Main Tables Involved (CRUD)** |
|:---|:---|
| UC1 – Register and Log In | USER_ACCOUNT (C/R/U last_login_at), AUDIT_LOG (C) |
| UC16 – Manage Supervisor Profile | SUPERVISOR_PROFILE (C/U), USER_ACCOUNT (U), AUDIT_LOG (C) |
| UC17 – Review and Respond to Supervisor Requests | SUPERVISOR_REQUEST (R/U), PROJECT (U), NOTIFICATION (C), AUDIT_LOG (C) |
| UC18 – View Supervisee List and Project Details | PROJECT (R), USER_ACCOUNT (R), STUDENT_PROFILE (R) |
| UC19 – Review Student Proposal | PROPOSAL (R/U), PROPOSAL_VERSION (R), PROPOSAL_CHECK_RESULT (R), PROPOSAL_REVIEW (C), PROJECT (U), SUPERVISOR_PROFILE (U), NOTIFICATION (C), AUDIT_LOG (C) |
| UC20 – Manage Supervision Meetings | MEETING (C/R/U), NOTIFICATION (C), AUDIT_LOG (C) |
| UC21 – Review, Comment on and Sign Supervision Log | MEETING_LOG (R/U), MEETING_LOG_SIGNATURE (C), MEETING (R), NOTIFICATION (C), AUDIT_LOG (C) |
| UC22 – View Supervisee Progress Dashboard | PROJECT (R), PROPOSAL (R), MEETING (R), MEETING_LOG (R), PROJECT_DOCUMENT (R), DEADLINE (R) |
| UC23 – Upload, Download and Review FYP Documents | PROJECT_DOCUMENT (C/R), AUDIT_LOG (C) |
| UC24 – Publish FYP Announcements | ANNOUNCEMENT (C/R), ANNOUNCEMENT_AUDIENCE (C/R), NOTIFICATION (C), AUDIT_LOG (C) |

Table 3.49: FYP Committee Use Cases (UC1, <mark>UC24–UC29</mark>) and Main Database Tables Involved (CRUD)

| **Use Case** | **Main Tables Involved (CRUD)** |
|:---|:---|
| UC1 – Register and Log In | USER_ACCOUNT (C/R/U last_login_at), AUDIT_LOG (C) |
| UC24 – Publish FYP Announcements | ANNOUNCEMENT (C/R), ANNOUNCEMENT_AUDIENCE (C/R), NOTIFICATION (C), AUDIT_LOG (C) |
| UC25 – View Proposal Review Queue | PROPOSAL (R), PROJECT (R), USER_ACCOUNT (R) |
| UC26 – Review Proposal | PROPOSAL (R/U), PROPOSAL_VERSION (R), PROPOSAL_CHECK_RESULT (R), PROPOSAL_REVIEW (C), PROJECT (U), NOTIFICATION (C), AUDIT_LOG (C) |
| UC27 – Manage General FYP Documents | RESOURCE_DOCUMENT (C/R/U/D), AUDIT_LOG (C) |
| UC28 – View FYP Project and Pairing Overview | PROJECT (R), FYP_CYCLE (R), SUPERVISOR_PROFILE (R), STUDENT_PROFILE (R), SUPERVISOR_REQUEST (R), USER_ACCOUNT (R), AUDIT_LOG (C) |
| UC29 – Generate and Export FYP Reports | PROJECT (R), PROPOSAL (R), MEETING_LOG (R), PROJECT_DOCUMENT (R), USER_ACCOUNT (R), <mark>GENERATED_REPORT (C/R), EXPORT_CONFIG (R), </mark>AUDIT_LOG (C) |

Table 3.50: System Administrator Use Cases (UC1, <mark>UC30–UC33</mark>) and Main Database Tables Involved (CRUD)

| **Use Case** | **Main Tables Involved (CRUD)** |
|:---|:---|
| UC1 – Register and Log In | USER_ACCOUNT (C/R/U last_login_at), AUDIT_LOG (C) |
| UC30 – Manage User Accounts and Roles | USER_ACCOUNT (C/R/U/D), STUDENT_PROFILE (C/R/U/D), SUPERVISOR_PROFILE (C/R/U/D), AUDIT_LOG (C) |
| UC31 – Configure System Parameters | SYSTEM_PARAMETER (C/R/U/D), FYP_CYCLE (C/R/U/D), DEADLINE (C/R/U/D), AUDIT_LOG (C) |
| UC32 – Configure Integration and Export Settings | INTEGRATION_SETTING (C/R/U/D), <mark>EXPORT_CONFIG (C/R/U/D), </mark>AUDIT_LOG (C) |
| UC33 – Perform System Maintenance | <mark>MAINTENANCE_JOB (C/R/U), </mark>AUDIT_LOG (C/R) |

