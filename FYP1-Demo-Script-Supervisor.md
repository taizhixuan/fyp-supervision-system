# FYP1 Presentation Demo Script - Supervisor Use Cases
## AI-Powered FYP Supervision Management System

**Presenter:** [Your Name]
**Date:** [Presentation Date]
**FYP Phase:** FYP1 (Screen Design / Frontend Prototype)

---

## Introduction Script (1 minute)

> "Now let me demonstrate the supervisor's perspective of the system. Supervisors have a different set of features tailored to managing their supervisees, reviewing proposals, and signing meeting logs."

---

## Demo Flow Overview - Supervisor Use Cases

| Order | Use Case | Screen(s) | Duration |
|-------|----------|-----------|----------|
| 1 | UC1 - Login as Supervisor | Login | 1 min |
| 2 | UC16 - Manage Supervisor Profile | Supervisor Profile | 1 min |
| 3 | Dashboard Overview | Supervisor Dashboard | 2 min |
| 4 | UC17 - Review Supervisor Requests | Request Inbox, Request Detail | 2 min |
| 5 | UC18 - View Supervisee List | Supervisees List, Detail | 2 min |
| 6 | UC19 - Review Student Proposal | Proposal Queue, Review Detail | 2 min |
| 7 | UC20 - Manage Supervision Meetings | Meetings, Create Meeting | 2 min |
| 8 | UC21 - Review & Sign Meeting Logs | Meeting Logs Review, Detail | 3 min |
| 9 | UC23 - Review FYP Documents | Documents Review, Detail | 2 min |
| 10 | UC24 - Publish Announcements | Announcements, Create | 1 min |
| 11 | Notifications | Notifications Center | 1 min |

**Total Demo Time:** ~19 minutes

---

## Detailed Demo Scripts

### 1. UC1 - Login as Supervisor (1 minute)

**URL:** `http://localhost:3003/login`

#### Demo Script:

> "Supervisors log in using the same login page but with their staff credentials. The system automatically detects their role and redirects them to the supervisor dashboard."

**Actions:**
1. Show **Login Page**
2. Enter supervisor credentials (mock: supervisor@mmu.edu.my)
3. Click Login → Redirects to Supervisor Dashboard

**Key Points to Mention:**
- Same authentication system, different role
- Role-based access control determines which features are visible

---

### 2. UC16 - Manage Supervisor Profile (1 minute)

**URL:** `http://localhost:3003/supervisor/profile`

#### Demo Script:

> "Supervisors can manage their profile, including their research areas, expertise, and supervision capacity."

**Actions:**
1. Navigate to **My Profile** from sidebar
2. Show profile information:
   - Personal details (Name, Email, Department)
   - Academic title and position
   - Research areas / expertise
   - Current supervision load vs. capacity

> "The research areas are used by the AI recommendation system to match students with suitable supervisors."

**Actions:**
3. Show the **Supervision Capacity** section
4. Point out current load (e.g., 5/8 students)

**Key Points to Mention:**
- Research areas feed into student matching algorithm
- Supervisors can set their maximum capacity
- Can toggle "Accepting new students" status

---

### 3. Dashboard Overview (2 minutes)

**URL:** `http://localhost:3003/supervisor/dashboard`

#### Demo Script:

> "The supervisor dashboard provides an overview of all supervision activities."

**Actions:**
1. Show **Dashboard Overview** with widgets:
   - Quick stats (Total Supervisees, Pending Requests, Pending Logs)
   - Active Projects summary
   - Upcoming Meetings
   - Recent Activities

> "Supervisors can see at a glance how many students they're supervising, pending actions, and upcoming meetings."

**Actions:**
2. Point out **Pending Actions** section:
   - X supervision requests pending
   - X meeting logs awaiting review
   - X proposals to review

3. Show **Quick Actions** buttons

**Key Points to Mention:**
- Centralized view of all supervisory duties
- Clear indication of pending actions
- Quick navigation to common tasks

---

### 4. UC17 - Review Supervisor Requests (2 minutes)

**URL:** `http://localhost:3003/supervisor/requests`

#### Demo Script:

> "When students send supervision requests, supervisors receive them in their Request Inbox."

**Actions:**
1. Navigate to **Requests** from sidebar
2. Show **Request Inbox** with pending requests
3. Point out request cards showing:
   - Student name and matric number
   - Proposed project title
   - Request date
   - Status badge

> "Each request shows the student's proposed project and their reason for choosing this supervisor."

**Actions:**
4. Click on a request to view details
5. Show **Request Detail** page:
   - Student profile summary
   - Proposed project details
   - Student's research interests
   - Why they chose this supervisor

> "Supervisors can review the student's background and proposed project before making a decision."

**Actions:**
6. Show the **Action Buttons**:
   - Accept Request
   - Reject Request (with reason)
7. Click **Accept** (simulate)

**Key Points to Mention:**
- Students can only send requests to available supervisors
- Supervisors can see student's profile and research interests
- Acceptance/rejection notifications sent to student

---

### 5. UC18 - View Supervisee List (2 minutes)

**URL:** `http://localhost:3003/supervisor/supervisees`

#### Demo Script:

> "The Supervisees page shows all students currently under this supervisor's supervision."

**Actions:**
1. Navigate to **Supervisees** from sidebar
2. Show **Supervisees List** with:
   - Student cards with photos
   - Project titles
   - FYP phase (FYP1 or FYP2)
   - Progress indicators

> "Supervisors can track each student's progress at a glance."

**Actions:**
3. Click on a student card
4. Show **Supervisee Detail** page:
   - Full student profile
   - Project details
   - Progress timeline
   - Meeting history
   - Document submissions
   - Supervision log history

> "This comprehensive view allows supervisors to monitor each student's entire FYP journey."

**Actions:**
5. Show the different tabs/sections
6. Point out the progress visualization

**Key Points to Mention:**
- Consolidated view of each student's progress
- Easy access to all related documents and logs
- Progress tracking from proposal to completion

---

### 6. UC19 - Review Student Proposal (2 minutes)

**URL:** `http://localhost:3003/supervisor/proposals`

#### Demo Script:

> "Supervisors review and provide feedback on their students' proposals."

**Actions:**
1. Navigate to **Proposals** from sidebar
2. Show **Proposal Review Queue** with:
   - List of proposals pending review
   - Status indicators (New, Under Review, Revised)
   - Submission dates

> "Proposals requiring attention are highlighted at the top."

**Actions:**
3. Click on a proposal to review
4. Show **Proposal Review Detail** page:
   - Proposal content (all sections)
   - Supervisor feedback section
   - Review decision buttons

> "Supervisors can read the full proposal and add section-by-section feedback."

**Actions:**
5. Show the **feedback input areas** for each section
6. Demonstrate adding a comment
7. Show the **Decision Options**:
   - Approve for Committee Review
   - Request Revision
   - Reject

**Key Points to Mention:**
- Section-by-section review capability
- Detailed feedback for students
- Clear workflow: Supervisor Review → Committee Review

---

### 7. UC20 - Manage Supervision Meetings (2 minutes)

**URL:** `http://localhost:3003/supervisor/meetings`

#### Demo Script:

> "Supervisors can manage all supervision meetings - both those requested by students and meetings they initiate."

**Actions:**
1. Navigate to **Meetings** from sidebar
2. Show **Meeting Management** page:
   - Calendar view or list view
   - Upcoming meetings
   - Meeting requests from students

> "Supervisors can see all scheduled meetings and pending requests."

**Actions:**
3. Show the **Pending Requests** section (if any)
4. Click **Create Meeting** button
5. Show **Create Meeting** form:
   - Select student(s)
   - Set date and time
   - Choose platform (Teams, Zoom, In-person)
   - Add agenda

> "Supervisors can also initiate meetings with their students."

**Actions:**
6. Click on an existing meeting
7. Show **Meeting Detail** with:
   - Meeting information
   - Attendees
   - Agenda
   - Meeting link
   - Reschedule/Cancel options

**Key Points to Mention:**
- Two-way meeting scheduling (student or supervisor initiated)
- Multiple platform support
- Automatic notifications to students

---

### 8. UC21 - Review & Sign Meeting Logs (3 minutes)

**URL:** `http://localhost:3003/supervisor/meeting-logs`

#### Demo Script:

> "This is a crucial feature - the digital Meeting Log following MMU FCI format. Supervisors review, comment, and sign meeting logs submitted by students."

**Actions:**
1. Navigate to **Meeting Logs** from sidebar
2. Show **Meeting Logs Review** page:
   - Quick stats (Pending Review, Awaiting Student, Completed)
   - Filter by status
   - List of meeting logs from all supervisees

> "The dashboard shows how many logs need attention. Pending review logs are highlighted."

**Actions:**
3. Click on a log with "Pending Review" status
4. Show **Meeting Log Review Detail** page:
   - Student info banner
   - Action required banner
   - Full log content in MMU format

> "The supervisor can review all sections: tasks carried out, work done, work to be done, and problems faced."

**Actions:**
5. Scroll through the log sections:
   - Section 1: Tasks (checkboxes with details)
   - Section 2: Work To Be Done
   - Section 3: Problems & Solutions
   - Section 4: Supervisor Comments

> "The supervisor adds their comments in Section 4."

**Actions:**
6. Type supervisor comments in the text area
7. Click **Save Comments**

> "After reviewing, the supervisor has two options: Approve and Sign, or Request Correction."

**Actions:**
8. Show the **Action Buttons**:
   - "Approve & Sign" (green)
   - "Request Correction" (red)

9. Click **"Request Correction"** (to show the modal)
10. Show the correction reason input
11. Close modal

> "If corrections are needed, the student is notified and must resubmit."

**Actions:**
12. Click **"Approve & Sign"**
13. Show the **Signature Pad Modal**
14. Draw a signature
15. Click **Save Signature**

> "The supervisor's signature is captured with SHA-256 hash for verification. The log status changes to 'Awaiting Student Signature'."

**Actions:**
16. Show the updated status
17. Navigate back to list to show the status change

**Key Points to Mention:**
- Official MMU FCI meeting log format
- Two-step signature process (Supervisor → Student)
- Request correction workflow
- Digital signature with cryptographic hash
- Once locked, logs cannot be modified

---

### 9. UC23 - Review FYP Documents (2 minutes)

**URL:** `http://localhost:3003/supervisor/documents`

#### Demo Script:

> "Supervisors can review documents uploaded by their students."

**Actions:**
1. Navigate to **Documents** from sidebar
2. Show **Documents Review** page:
   - List of documents from supervisees
   - Filter by student or document type
   - Feedback status indicators

> "Documents are organized by type: Proposals, Reports, Presentations, etc."

**Actions:**
3. Click on a document to review
4. Show **Document Detail** page:
   - Document preview/download
   - Version history
   - Feedback section

> "Supervisors can view the document, check previous versions, and add feedback."

**Actions:**
5. Show the **Add Feedback** section
6. Point out previous feedback (if any)

**Key Points to Mention:**
- Centralized document management
- Version tracking
- Inline feedback capability

---

### 10. UC24 - Publish Announcements (1 minute)

**URL:** `http://localhost:3003/supervisor/announcements`

#### Demo Script:

> "Supervisors can publish announcements visible to their supervisees."

**Actions:**
1. Navigate to **Announcements** from sidebar
2. Show **Announcements List** with existing announcements
3. Click **Create Announcement**
4. Show **Create Announcement** form:
   - Title
   - Content (rich text)
   - Target audience (all supervisees or specific students)
   - Priority level

> "Announcements can be targeted to all supervisees or specific students."

**Key Points to Mention:**
- Targeted announcements
- Priority levels for urgent notices
- Students receive notifications

---

### 11. Notifications (1 minute)

**URL:** `http://localhost:3003/supervisor/notifications`

#### Demo Script:

> "The Notifications Center shows all alerts for the supervisor."

**Actions:**
1. Click **Bell Icon** or navigate to Notifications
2. Show **Notifications Center**:
   - New supervision requests
   - Meeting log submissions
   - Student document uploads
   - Meeting reminders

> "Supervisors stay informed about all activities requiring their attention."

**Key Points to Mention:**
- Real-time notifications
- Email notifications for important events
- Clear categorization by type

---

## Supervisor Demo Conclusion (30 seconds)

> "This completes the supervisor workflow demonstration. To summarize, supervisors can:
> 1. Manage supervision requests and view their supervisee list
> 2. Review and provide feedback on student proposals
> 3. Schedule and manage supervision meetings
> 4. **Review and digitally sign MMU FCI meeting logs**
> 5. Review student documents and provide feedback
> 6. Publish targeted announcements
>
> The digital meeting log with e-signature is particularly important as it replaces the paper-based process with a secure, traceable digital workflow."

---

## Potential Examiner Questions - Supervisor Specific

### Q1: "How does the supervisor know which students need attention?"

**Answer:**
> "The supervisor dashboard prominently displays pending actions with count badges. There are three key indicators:
> 1. **Pending Requests** - new supervision requests awaiting response
> 2. **Pending Logs** - meeting logs waiting for review/signature
> 3. **Upcoming Deadlines** - students approaching submission deadlines
>
> Additionally, the system sends email notifications for new requests and submissions, so supervisors don't miss important actions."

### Q2: "What happens if a supervisor rejects a supervision request?"

**Answer:**
> "When a supervisor rejects a request, they must provide a reason. The student receives a notification with this feedback. The student can then:
> 1. Improve their proposal and send a new request to the same supervisor
> 2. Send requests to other supervisors
>
> The system allows students to have up to 3 pending requests simultaneously, so rejection from one supervisor doesn't block them completely."

### Q3: "How is the meeting log signature verified?"

**Answer:**
> "Each signature has two components:
> 1. **Visual signature** - the PNG image captured from the signature pad
> 2. **SHA-256 hash** - a cryptographic hash of the signature data
>
> When the log is viewed or exported to PDF, the system can verify that the signature hasn't been tampered with by comparing the stored hash. Additionally, each signature records the timestamp and the user ID, creating a complete audit trail."

### Q4: "Can a supervisor edit a meeting log after signing?"

**Answer:**
> "No. Once a supervisor signs the meeting log, it moves to 'Awaiting Student Signature' status. The supervisor can no longer edit their comments or signature. After both parties sign, the log is locked completely and becomes read-only. This ensures the integrity of the official supervision record."

### Q5: "How does the proposal review workflow work?"

**Answer:**
> "The proposal goes through a two-stage review:
> 1. **Supervisor Review** - The supervisor reviews first, provides feedback, and either requests revisions or approves for committee review
> 2. **Committee Review** - If approved by supervisor, the proposal goes to the FYP Committee for final approval
>
> At each stage, reviewers can request revisions, and students can resubmit. Only after both approvals is the project considered registered."

### Q6: "How many students can a supervisor handle?"

**Answer:**
> "Each supervisor has a configurable maximum capacity set in their profile. For example, a supervisor might set their limit to 8 students. The system tracks their current load and:
> 1. Shows availability status to students (accepting/not accepting)
> 2. Automatically prevents new requests when at capacity
> 3. Allows supervisors to temporarily close their availability
>
> This helps balance supervision workload across the faculty."

---

## Quick Reference - Supervisor URLs for Demo

| Screen | URL |
|--------|-----|
| Dashboard | `http://localhost:3003/supervisor/dashboard` |
| Profile | `http://localhost:3003/supervisor/profile` |
| Requests | `http://localhost:3003/supervisor/requests` |
| Supervisees | `http://localhost:3003/supervisor/supervisees` |
| Proposals | `http://localhost:3003/supervisor/proposals` |
| Meetings | `http://localhost:3003/supervisor/meetings` |
| Meeting Logs | `http://localhost:3003/supervisor/meeting-logs` |
| Meeting Log Detail (pending review) | `http://localhost:3003/supervisor/meeting-logs/ml-003` |
| Documents | `http://localhost:3003/supervisor/documents` |
| Announcements | `http://localhost:3003/supervisor/announcements` |
| Notifications | `http://localhost:3003/supervisor/notifications` |

---

## Pre-Demo Checklist - Supervisor Flow

- [ ] Ensure mock data has meeting logs with "SUBMITTED" status for demo
- [ ] Test signature pad functionality
- [ ] Verify the meeting log detail page loads correctly
- [ ] Check that supervisor comments can be saved
- [ ] Test the "Request Correction" modal
- [ ] Verify navigation between list and detail pages

---

*Document prepared for FYP1 Presentation - Supervisor Use Cases*
*Last updated: [Date]*
