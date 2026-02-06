# FYP1 Presentation Demo Script
## AI-Powered FYP Supervision Management System

**Presenter:** [Your Name]
**Date:** [Presentation Date]
**FYP Phase:** FYP1 (Screen Design / Frontend Prototype)

---

## Introduction Script (2 minutes)

> "Good morning/afternoon. Today I will be presenting my Final Year Project titled **AI-Powered FYP Supervision Management System**."
>
> "The objective of this system is to digitize and streamline the FYP supervision process at MMU FCI. Currently, students face challenges in finding suitable supervisors, tracking proposal status, managing meetings, and maintaining supervision logs manually."
>
> "My system addresses these pain points by providing a centralized web platform with features including AI-powered supervisor recommendations, digital supervision logs with e-signatures, real-time notifications, and an integrated chatbot for FYP-related queries."
>
> "For FYP1, I have completed the **screen design and frontend prototype** using React, TypeScript, and Tailwind CSS. I first designed the UI in Figma, then implemented it as a working frontend prototype with mock data."
>
> "Let me now demonstrate the student workflow through the system."

---

## Demo Flow Overview

| Order | Use Case | Screen(s) | Duration |
|-------|----------|-----------|----------|
| 1 | UC1 - Register and Log In | Landing, Register, Login | 2 min |
| 2 | UC3 - View FYP Dashboard | Student Dashboard | 2 min |
| 3 | UC2 - Manage Student Profile | Student Profile | 1 min |
| 4 | UC4 - Browse and Search Supervisors | Supervisor Directory | 2 min |
| 5 | UC5 - View AI Supervisor Recommendations | AI Recommendations | 2 min |
| 6 | UC6 - Send Supervisor Request | Create Request, My Requests | 2 min |
| 7 | UC7 & UC8 - Manage Proposal | Proposal Workspace, Status | 3 min |
| 8 | UC10 - Manage Meeting Schedule | Meetings List, Detail | 2 min |
| 9 | UC11 - Manage Supervision Log | Meeting Logs (MMU Format) | 3 min |
| 10 | UC12 - Upload and Manage Documents | Documents List, Upload | 2 min |
| 11 | UC13 - View Guidelines and Deadlines | Resources Hub, Deadlines | 1 min |
| 12 | UC14 - View Notifications | Notification Center | 1 min |
| 13 | UC15 - FYP Chatbot | Chatbot | 2 min |

**Total Demo Time:** ~25 minutes

---

## Detailed Demo Scripts

### 1. UC1 - Register and Log In (2 minutes)

**URL:** `http://localhost:3003/` → `http://localhost:3003/register` → `http://localhost:3003/login`

#### Demo Script:

> "Let me start with the landing page. This is the first screen users see when they access the system."

**Actions:**
1. Show the **Landing Page** with system features overview
2. Click **"Get Started"** or **"Register"** button

> "Students can register using their MMU email. The system validates the email format to ensure only MMU students can register."

**Actions:**
3. Show the **Registration Page**
4. Point out the form fields: Full Name, MMU Email, Student ID, Password
5. Highlight the validation messages (email must be @student.mmu.edu.my)

> "After registration, students log in with their credentials."

**Actions:**
6. Navigate to **Login Page**
7. Show the login form with email and password fields
8. Point out the "Forgot Password" link
9. Click Login (mock login will redirect to dashboard)

**Key Points to Mention:**
- Email validation ensures only MMU students
- Secure password requirements
- Session management with JWT tokens (backend implementation in FYP2)

---

### 2. UC3 - View FYP Dashboard (2 minutes)

**URL:** `http://localhost:3003/student/dashboard`

#### Demo Script:

> "After logging in, students are directed to their personalized dashboard. This provides an overview of their FYP progress."

**Actions:**
1. Show the **Dashboard Overview** with welcome message
2. Point out the **Quick Stats Cards**:
   - Project Status
   - Proposal Status
   - Upcoming Meetings
   - Pending Tasks

> "The dashboard displays key metrics at a glance. Students can see their project status, pending tasks, and upcoming deadlines."

**Actions:**
3. Show the **Recent Activities** section
4. Point out **Upcoming Deadlines** widget
5. Show **Quick Actions** buttons

> "Quick actions allow students to jump directly to common tasks like scheduling a meeting or uploading a document."

**Key Points to Mention:**
- Personalized dashboard based on student's FYP phase
- Real-time status updates
- Quick access to important features

---

### 3. UC2 - Manage Student Profile (1 minute)

**URL:** `http://localhost:3003/student/profile`

#### Demo Script:

> "Students can manage their profile information from the Profile page."

**Actions:**
1. Click **"My Profile"** from sidebar
2. Show the profile form with:
   - Personal Information (Name, Email, Student ID)
   - Academic Information (Programme, Faculty, Year)
   - Research Interests
   - Skills and Technologies

> "Research interests are important as they are used by the AI recommendation system to suggest suitable supervisors."

**Actions:**
3. Show the **Research Interests** tags
4. Show the **Skills** section

**Key Points to Mention:**
- Profile data feeds into AI recommendation engine
- Research interests matching with supervisor expertise
- Profile completion indicator

---

### 4. UC4 - Browse and Search Supervisors (2 minutes)

**URL:** `http://localhost:3003/student/supervisors`

#### Demo Script:

> "One of the key features is the Supervisor Directory. Students can browse all available supervisors and filter based on various criteria."

**Actions:**
1. Navigate to **Supervisors** from sidebar
2. Show the **Supervisor Directory** with supervisor cards
3. Demonstrate the **Search** functionality
4. Show **Filter Options**:
   - Department
   - Research Area
   - Availability Status

> "Each supervisor card shows their name, department, research areas, and current supervision load. The colored indicator shows if they are accepting new students."

**Actions:**
5. Click on a supervisor card to view details
6. Show **Supervisor Detail Page** with:
   - Full profile
   - Research areas
   - Past projects
   - Current load
   - Contact information

> "Students can view the supervisor's expertise and past FYP projects to make an informed decision."

**Actions:**
7. Show the **"Compare Supervisors"** feature
8. Select 2-3 supervisors and click compare
9. Show the comparison table

**Key Points to Mention:**
- Real-time availability status
- Detailed supervisor profiles
- Side-by-side comparison feature

---

### 5. UC5 - View AI Supervisor Recommendations (2 minutes)

**URL:** `http://localhost:3003/student/recommendations`

#### Demo Script:

> "This is one of the AI-powered features of my system. Based on the student's research interests and skills, the system recommends suitable supervisors."

**Actions:**
1. Navigate to **AI Recommendations** page
2. Show the **recommendation cards** with match percentages

> "The AI analyzes the student's profile and matches it against supervisor expertise. Each recommendation shows a compatibility score."

**Actions:**
3. Point out the **Match Score** (e.g., 95% match)
4. Show **Why Recommended** section explaining the match
5. Show the matching criteria:
   - Research area overlap
   - Technical skills match
   - Past project relevance

> "Students can see exactly why each supervisor is recommended, making the selection process transparent and informed."

**Actions:**
6. Click **"View Profile"** to see supervisor details
7. Click **"Send Request"** to initiate supervision request

**Key Points to Mention:**
- AI-based matching algorithm
- Transparent scoring system
- Considers multiple factors: research areas, skills, availability
- Will be enhanced with ML model in FYP2

---

### 6. UC6 - Send Supervisor Request (2 minutes)

**URL:** `http://localhost:3003/student/request/new` → `http://localhost:3003/student/requests`

#### Demo Script:

> "Once a student identifies a suitable supervisor, they can send a supervision request through the system."

**Actions:**
1. Navigate to **Create Request** page
2. Show the request form:
   - Select Supervisor (dropdown)
   - Project Title (proposed)
   - Project Description
   - Why this supervisor?

> "Students must provide a project idea and explain why they chose this particular supervisor. This helps supervisors evaluate the request."

**Actions:**
3. Fill in sample data
4. Click **"Submit Request"**
5. Navigate to **My Requests** page

> "Students can track all their requests from the My Requests page. Each request shows its current status."

**Actions:**
6. Show request cards with statuses:
   - Pending (waiting for supervisor response)
   - Accepted
   - Rejected
7. Click on a request to view details and supervisor feedback

**Key Points to Mention:**
- Students can send multiple requests (up to 3 pending)
- Supervisors receive email notifications
- Students get notified when status changes

---

### 7. UC7 & UC8 - Manage Proposal (3 minutes)

**URL:** `http://localhost:3003/student/proposal` → `http://localhost:3003/student/proposal/status`

#### Demo Script:

> "After being assigned a supervisor, students work on their FYP proposal. The Proposal Workspace provides a structured environment for this."

**Actions:**
1. Navigate to **Proposal** from sidebar
2. Show the **Proposal Workspace** with sections:
   - Project Title
   - Problem Statement
   - Objectives
   - Scope
   - Literature Review
   - Methodology

> "The workspace follows the MMU FCI proposal template structure. Students can save drafts and submit when ready."

**Actions:**
3. Show the **auto-save** feature
4. Show the **word count** indicators
5. Click **"Save Draft"** button

> "The system tracks proposal versions. Students can view their submission history."

**Actions:**
6. Navigate to **Proposal History** page
7. Show version list with timestamps

> "Students can also use the AI-powered Proposal Analysis feature to get feedback on their writing."

**Actions:**
8. Navigate to **Proposal Analysis** page
9. Show AI feedback on:
   - Writing quality
   - Completeness check
   - Suggestions for improvement

> "The Proposal Status page shows the current review status and any feedback from supervisor or committee."

**Actions:**
10. Navigate to **Proposal Status** page
11. Show status timeline:
    - Draft → Submitted → Under Review → Revision Required / Approved
12. Show supervisor/committee comments

**Key Points to Mention:**
- Structured proposal template
- Version history tracking
- AI-powered writing analysis
- Clear status tracking with feedback

---

### 8. UC10 - Manage Meeting Schedule (2 minutes)

**URL:** `http://localhost:3003/student/meetings` → `http://localhost:3003/student/meetings/new`

#### Demo Script:

> "The system helps students schedule and manage supervision meetings with their supervisor."

**Actions:**
1. Navigate to **Meetings** from sidebar
2. Show the **Meetings List** with:
   - Quick stats (upcoming, confirmed, pending)
   - Filter by status
   - Meeting cards

> "Students can see all their meetings at a glance. The cards show date, time, location or meeting link, and status."

**Actions:**
3. Point out the **Quick Actions** - Supervision Logs link
4. Click on a meeting card
5. Show **Meeting Detail** page with:
   - Meeting information
   - Agenda
   - Platform (Teams/Zoom/In-person)
   - Meeting link

> "Students can request new meetings by clicking the Request Meeting button."

**Actions:**
6. Navigate to **Meeting Request** page
7. Show the form:
   - Proposed date/time
   - Duration
   - Platform preference
   - Agenda/Purpose

> "The meeting platform supports online meetings via Microsoft Teams, Zoom, Google Meet, or in-person meetings."

**Key Points to Mention:**
- Calendar integration
- Multiple platform support
- Automatic meeting link sharing
- Email notifications

---

### 9. UC11 - Manage Supervision Log (3 minutes)

**URL:** `http://localhost:3003/student/meeting-logs` → `http://localhost:3003/student/meeting-logs/new`

#### Demo Script:

> "This is one of the most important features - the Digital Supervision Log. It follows the official MMU FCI meeting log format."

**Actions:**
1. Navigate to **Meeting Logs** from sidebar (or via Quick Actions in Meetings)
2. Show the **Meeting Logs List** with:
   - Status filters (Draft, Submitted, Signed, Locked)
   - Quick stats
   - Log cards with status badges

> "The system digitizes the paper-based meeting log form. Each log follows the official template with all required sections."

**Actions:**
3. Click **"Create New Log"**
4. Show the **Meeting Log Form** with sections:
   - Meeting Details (date, number, mode)
   - Section 1: Tasks Carried Out (6 checkboxes)
   - Section 2: Work Done Details
   - Section 3: Work To Be Done
   - Section 4: Problems & Solutions

> "The task checkboxes match the official MMU format. Unselected tasks will appear with strikethrough in the final document."

**Actions:**
5. Check some task boxes
6. Fill in work done details
7. Click **"Save as Draft"** or **"Submit for Review"**

> "After submission, the supervisor reviews and adds comments. Once approved, both parties sign digitally."

**Actions:**
8. Navigate to a log with **"Awaiting Your Signature"** status (ml-002)
9. Show the **Signatures Section** with supervisor's signature displayed
10. Click **"Sign Meeting Log"**
11. Show the **Signature Pad** (canvas-based digital signature)
12. Draw a signature
13. Click **"Save Signature"**

> "The digital signature is captured with SHA-256 hash for verification. Once both parties sign, the log is locked and can be exported as PDF."

**Actions:**
14. Navigate to a **Locked** log (ml-001)
15. Show both signatures displayed
16. Show the **"Download PDF"** button

**Key Points to Mention:**
- Official MMU FCI format compliance
- Digital signature with SHA-256 verification
- Workflow: Draft → Submitted → Supervisor Signed → Locked
- PDF export for records
- Cannot be edited once locked (integrity)

---

### 10. UC12 - Upload and Manage Documents (2 minutes)

**URL:** `http://localhost:3003/student/documents` → `http://localhost:3003/student/documents/upload`

#### Demo Script:

> "Students can upload and manage all their FYP documents through the Documents section."

**Actions:**
1. Navigate to **Documents** from sidebar
2. Show the **Documents List** with:
   - Document categories (Proposal, Reports, Presentations)
   - Upload status
   - Supervisor feedback status

> "Documents are organized by category. Students can see which documents have been reviewed and any feedback from the supervisor."

**Actions:**
3. Click **"Upload Document"**
4. Show the upload form:
   - Document title
   - Category selection
   - File upload (drag & drop)
   - Description

> "The system supports various file formats including PDF, DOCX, and PPTX. There's a file size limit of 25MB."

**Actions:**
5. Show drag-and-drop upload area
6. Click on a document to view details
7. Show **Document Detail** page with:
   - File preview
   - Download button
   - Version history
   - Supervisor comments

> "Students can view the full version history and track all changes."

**Actions:**
8. Navigate to **Document History** page
9. Show version timeline

**Key Points to Mention:**
- Organized document management
- Version control
- Supervisor feedback integration
- Secure file storage

---

### 11. UC13 - View Guidelines and Deadlines (1 minute)

**URL:** `http://localhost:3003/student/resources` → `http://localhost:3003/student/deadlines`

#### Demo Script:

> "Students can access all FYP resources including guidelines, rubrics, and templates from the Resources Hub."

**Actions:**
1. Navigate to **Resources Hub** (if available in sidebar, or from dashboard)
2. Show resource categories:
   - FYP Guidelines
   - Evaluation Rubrics
   - Templates
   - Past FYP Examples

> "The Deadline Calendar shows all important FYP deadlines."

**Actions:**
3. Navigate to **Deadlines Calendar**
4. Show calendar view with deadlines highlighted
5. Show deadline details:
   - Title
   - Due date
   - Category
   - Reminders

**Key Points to Mention:**
- Centralized resource access
- Calendar-based deadline tracking
- Automatic reminders before deadlines

---

### 12. UC14 - View Notifications (1 minute)

**URL:** `http://localhost:3003/student/notifications`

#### Demo Script:

> "The system keeps students informed through real-time notifications."

**Actions:**
1. Click the **Bell Icon** in the top navigation
2. Show notification dropdown with recent notifications
3. Click **"View All"**
4. Show **Notification Center** with:
   - All notifications list
   - Filter by type
   - Mark as read

> "Students receive notifications for important events like supervisor responses, meeting reminders, and deadline alerts."

**Actions:**
5. Show different notification types:
   - Supervisor accepted your request
   - Meeting reminder
   - Proposal feedback received
   - Deadline approaching

> "Students can customize their notification preferences."

**Actions:**
6. Navigate to **Notification Settings**
7. Show toggle options for email and in-app notifications

**Key Points to Mention:**
- Real-time notifications
- Multiple channels (in-app, email)
- Customizable preferences

---

### 13. UC15 - FYP Chatbot (2 minutes)

**URL:** `http://localhost:3003/student/chatbot`

#### Demo Script:

> "Finally, the system includes an AI-powered chatbot to help students with FYP-related questions."

**Actions:**
1. Navigate to **Chatbot** from sidebar
2. Show the chat interface

> "Students can ask questions about FYP processes, deadlines, requirements, and get instant answers."

**Actions:**
3. Type a sample question: "What are the proposal submission requirements?"
4. Show the chatbot response
5. Type another question: "How do I schedule a meeting with my supervisor?"
6. Show the response with relevant steps

> "The chatbot is trained on FYP guidelines and can answer common questions 24/7, reducing the need to contact the FYP coordinator for basic queries."

**Key Points to Mention:**
- AI-powered responses
- Trained on FYP guidelines
- 24/7 availability
- Reduces administrative workload

---

## Demo Conclusion Script (1 minute)

> "This concludes the demonstration of the student workflow in my FYP Supervision Management System."
>
> "To summarize, the system provides:
> 1. **AI-powered supervisor matching** to help students find suitable supervisors
> 2. **Digital supervision logs** with e-signatures following MMU FCI format
> 3. **Centralized document management** with version control
> 4. **Real-time notifications** and deadline tracking
> 5. **AI chatbot** for instant FYP guidance"
>
> "For FYP1, I have completed the screen design and frontend prototype. In FYP2, I will implement the backend using Spring Boot and PostgreSQL, integrate the AI models, and deploy the system for user testing."
>
> "Thank you. I'm now open to questions."

---

## Potential Examiner Questions & Answers

### Design Approach Questions

#### Q1: "Why did you use code instead of Figma for screen design?"

**Answer:**
> "I actually used **both approaches** - Figma for initial wireframing and ideation, then code for the high-fidelity prototype. Here's why I chose to implement in code:
>
> **1. Interactive Prototype vs Static Mockups**
> - Figma produces static images, but my coded prototype is **fully interactive**
> - Examiners and stakeholders can click through the actual user flows
> - Form validations, state changes, and transitions work in real-time
>
> **2. Realistic Validation**
> - Code forces me to think about **real implementation constraints**
> - I discovered edge cases (empty states, error handling, loading states) that Figma wouldn't reveal
> - The design is proven to be technically feasible
>
> **3. Reusable Component Library**
> - I built a **reusable UI component library** (Button, Card, Input, Modal, etc.)
> - These components will be used directly in FYP2 - no design-to-code translation needed
> - Consistent design system enforced through code
>
> **4. Time Efficiency for FYP2**
> - Traditional approach: Figma (FYP1) → Rebuild in code (FYP2) = **duplicate work**
> - My approach: Code prototype (FYP1) → Add backend (FYP2) = **continuous progress**
> - I estimate this saves **3-4 weeks** of development time in FYP2
>
> **5. Responsive Design**
> - My prototype works on **desktop, tablet, and mobile**
> - Figma would require separate designs for each breakpoint
> - With Tailwind CSS, responsiveness is built-in
>
> **6. Real Data Simulation**
> - I use **mock data** that mirrors the actual API structure
> - When I connect to the backend, the integration will be seamless
> - Figma cannot simulate dynamic data
>
> In summary, while Figma is excellent for quick wireframing and stakeholder communication, a coded prototype provides a more **realistic, testable, and reusable** deliverable for a technical project like this."

#### Q2: "But isn't Figma faster for design iteration?"

**Answer:**
> "For initial brainstorming, yes. That's why I used Figma first to sketch ideas and get feedback. But for a system with **35+ screens** and complex workflows, maintaining Figma files becomes time-consuming.
>
> With code:
> - Changing a button style updates **all 35 screens instantly** (via the component library)
> - Adding a new field to a form takes minutes, not hours of copy-pasting
> - Version control with Git tracks all design changes
>
> The upfront investment in code pays off quickly for complex systems."

#### Q3: "How do you ensure good UI/UX without a dedicated design tool?"

**Answer:**
> "I follow established design principles and use proven frameworks:
>
> 1. **Tailwind CSS** - provides a consistent design system with spacing, colors, and typography scales
> 2. **Lucide Icons** - professional, consistent iconography
> 3. **Shadcn/UI patterns** - followed best practices for component design
> 4. **Accessibility** - all components include proper labels, keyboard navigation, and ARIA attributes
>
> I also referenced existing successful systems (Google Classroom, Canvas LMS) for UX patterns. The result is a professional, user-friendly interface that follows industry standards."

### Technical Questions

#### Q4: "Why did you choose React and TypeScript for the frontend?"

**Answer:**
> "I chose React because it's a component-based library that allows for reusable UI components, which is essential for a large system like this. TypeScript adds static typing which helps catch errors during development and improves code maintainability. Additionally, React has a large ecosystem with libraries like React Query for data fetching and React Hook Form for form handling, which accelerated my development."

#### Q5: "How does the AI supervisor recommendation work?"

**Answer:**
> "The AI recommendation system analyzes the student's profile - specifically their research interests, technical skills, and project preferences - and matches them against supervisor expertise and research areas. Currently, I'm using a keyword matching and scoring algorithm. In FYP2, I plan to implement a more sophisticated machine learning model using natural language processing to better understand semantic similarities between student interests and supervisor expertise."

#### Q6: "How do you ensure the digital signature is secure and valid?"

**Answer:**
> "The digital signature is captured using an HTML5 canvas element. When a user signs, the signature image is converted to a PNG data URL and a SHA-256 cryptographic hash is generated using the Web Crypto API. This hash serves as a unique fingerprint of the signature. In the backend (FYP2), I will store this hash and verify it to ensure the signature hasn't been tampered with. The log is also locked after both parties sign, preventing any further modifications."

#### Q7: "What database will you use and why?"

**Answer:**
> "I plan to use PostgreSQL as the database because it's a robust, open-source relational database that supports complex queries and has excellent support for JSON data types, which is useful for storing flexible data like supervisor research areas. PostgreSQL also has strong data integrity features and is widely used in production systems."

#### Q8: "How will you implement the chatbot?"

**Answer:**
> "For the chatbot, I plan to use a combination of approaches. First, I'll create a knowledge base of FYP FAQs and guidelines. For simple, pattern-based queries, I'll use intent classification. For more complex questions, I plan to integrate with an LLM API like Claude or OpenAI, with the knowledge base serving as context. The chatbot will be trained specifically on MMU FCI FYP guidelines to provide accurate, institution-specific answers."

#### Q9: "What is the technology stack for the backend?"

**Answer:**
> "For the backend, I plan to use:
> - **Spring Boot** with Java for the REST API
> - **PostgreSQL** for the database
> - **Flyway** for database migrations
> - **Spring Security** with JWT for authentication
> - **MinIO** or AWS S3 for file storage
> - **Redis** for caching and session management
>
> This stack is industry-standard and provides good scalability and maintainability."

### Design Questions

#### Q10: "How did you approach the UI/UX design?"

**Answer:**
> "I followed a user-centered design approach. First, I identified the key user personas - students, supervisors, committee members, and administrators. Then I mapped out the user journeys for each persona. I designed the wireframes in Figma, focusing on clarity and ease of use. The color palette uses navy blue as the primary color to convey professionalism and trust, with coral accents for calls-to-action. I also ensured the design is responsive for both desktop and mobile devices."

#### Q11: "Why does the meeting log follow the specific format shown?"

**Answer:**
> "The meeting log format is based on the official MMU FCI supervision meeting log template. I digitized this exact format to ensure compliance with university requirements and familiarity for users. The six task categories (Planning, Literature Review, Requirements Analysis, Design & Methodology, Prototype/POC, and Report Writing) are the standard categories used in FCI. This ensures that the digital version can be directly accepted by the faculty."

#### Q12: "How do you handle different user roles?"

**Answer:**
> "The system implements role-based access control (RBAC). There are four roles: Student, Supervisor, FYP Committee, and System Administrator. Each role has specific permissions and sees different interfaces. For example, students can only view and manage their own data, while supervisors can view all their supervisees. The routing is protected based on roles - if a student tries to access a supervisor page, they'll be redirected to an access denied page."

### Process Questions

#### Q13: "What challenges did you face during development?"

**Answer:**
> "The main challenges were:
> 1. **Complex form handling** - The meeting log form has many interdependent fields. I solved this using React Hook Form with Zod validation.
> 2. **Digital signature implementation** - Capturing and storing signatures securely required research into canvas APIs and cryptographic hashing.
> 3. **State management** - Managing the complex state across different pages. I used React Query for server state and React Context for auth state.
> 4. **UI consistency** - With over 30 screens, maintaining consistency was challenging. I solved this by creating a reusable component library."

#### Q14: "How will you test the system?"

**Answer:**
> "I plan to implement testing at multiple levels:
> 1. **Unit tests** using Jest and React Testing Library for individual components
> 2. **Integration tests** for API endpoints using Spring Boot Test
> 3. **End-to-end tests** using Playwright or Cypress for critical user flows
> 4. **User acceptance testing** with actual FYP students and supervisors before deployment
>
> I'll also conduct usability testing to gather feedback on the interface."

#### Q15: "What is your timeline for FYP2?"

**Answer:**
> "My FYP2 timeline is:
> - **Week 1-3:** Backend setup - Spring Boot project, database schema, authentication
> - **Week 4-6:** Core APIs - User management, supervisor matching, meetings
> - **Week 7-9:** Advanced features - Meeting logs with signatures, document management
> - **Week 10-11:** AI integration - Chatbot, recommendation engine improvements
> - **Week 12-13:** Testing and bug fixes
> - **Week 14:** Deployment and documentation"

### Clarification Questions

#### Q16: "Is this frontend prototype connected to a real backend?"

**Answer:**
> "No, currently the frontend uses mock data for demonstration purposes. All the data you see is simulated. In FYP2, I will implement the Spring Boot backend with a PostgreSQL database, and connect the frontend to real APIs. The mock data structure I've created mirrors the actual API responses I plan to implement, making the integration straightforward."

#### Q17: "Can multiple students use this system simultaneously?"

**Answer:**
> "The system is designed for multi-user concurrent access. The frontend is stateless and uses token-based authentication, which inherently supports multiple simultaneous users. In the backend (FYP2), I'll implement proper database transactions and concurrency handling to ensure data consistency when multiple users access the same resources."

#### Q18: "How does this system improve over the current manual process?"

**Answer:**
> "The current process has several pain points:
> 1. **Finding supervisors** - Students manually email supervisors blindly. My system provides searchable directory with AI recommendations.
> 2. **Meeting logs** - Paper-based forms that can be lost. My system provides digital logs with e-signatures.
> 3. **Status tracking** - Students have no visibility into proposal status. My system shows real-time status.
> 4. **Communication** - Scattered across email and WhatsApp. My system centralizes all communication with notifications.
> 5. **Document management** - Files shared via email without version control. My system provides organized storage with history.
>
> The system saves time, reduces errors, and provides transparency for all stakeholders."

---

## Quick Reference - URLs for Demo

| Screen | URL |
|--------|-----|
| Landing Page | `http://localhost:3003/` |
| Register | `http://localhost:3003/register` |
| Login | `http://localhost:3003/login` |
| Dashboard | `http://localhost:3003/student/dashboard` |
| Profile | `http://localhost:3003/student/profile` |
| Supervisors | `http://localhost:3003/student/supervisors` |
| AI Recommendations | `http://localhost:3003/student/recommendations` |
| Create Request | `http://localhost:3003/student/request/new` |
| My Requests | `http://localhost:3003/student/requests` |
| Proposal | `http://localhost:3003/student/proposal` |
| Proposal Status | `http://localhost:3003/student/proposal/status` |
| Meetings | `http://localhost:3003/student/meetings` |
| Meeting Logs | `http://localhost:3003/student/meeting-logs` |
| Create Meeting Log | `http://localhost:3003/student/meeting-logs/new` |
| Meeting Log Detail (needs signature) | `http://localhost:3003/student/meeting-logs/ml-002` |
| Meeting Log Detail (locked) | `http://localhost:3003/student/meeting-logs/ml-001` |
| Documents | `http://localhost:3003/student/documents` |
| Notifications | `http://localhost:3003/student/notifications` |
| Chatbot | `http://localhost:3003/student/chatbot` |

---

## Pre-Demo Checklist

- [ ] Start the frontend dev server: `cd frontend && npm run dev`
- [ ] Verify the server is running on the expected port (3003 or 3004)
- [ ] Open browser and clear cache if needed
- [ ] Test all key navigation paths
- [ ] Ensure meeting log samples with signatures are loading (ml-001, ml-002)
- [ ] Have backup screenshots ready in case of technical issues
- [ ] Prepare Figma designs to show if asked about design process

---

## Backup Plan

If the live demo fails:
1. Show the Figma designs as backup
2. Use pre-recorded video demonstration
3. Show screenshots from the `/screenshots` folder (if available)

---

*Document prepared for FYP1 Presentation*
*Last updated: [Date]*
