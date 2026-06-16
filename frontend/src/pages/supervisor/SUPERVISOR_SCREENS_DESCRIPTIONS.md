---
tags: [folder/frontend, path/frontend\src\pages\supervisor\supervisor_screens_descriptions, component/src-pages-supervisor]
---
# Supervisor Module Screen Descriptions

This document provides brief descriptions of each screen in the Supervisor module of the FYP Supervision System.

---

## 4.4.1 Supervisor Dashboard
**URL:** `/supervisor/dashboard`

The Supervisor Dashboard provides an at-a-glance overview of all supervision activities. It displays key metrics including total supervisees, pending requests, upcoming meetings, logs to review, proposals to review, and documents to review. The dashboard features a supervisee status distribution chart showing students by project status (In Progress, Not Started, Completed, On Hold) and risk levels (Low, Medium, High, Critical). A recent activity feed shows the latest actions requiring attention, and quick action buttons provide shortcuts to common tasks like reviewing requests, reviewing logs, scheduling meetings, and posting announcements.

---

## 4.4.2 Supervisor Profile
**URL:** `/supervisor/profile`

The Supervisor Profile screen allows supervisors to manage their professional profile and supervision preferences. Supervisors can view and edit personal information including contact details, office location, and external profile links (LinkedIn, Google Scholar). The page displays supervision capacity showing current students versus maximum quota with available slots. Supervisors can manage their research areas, technical expertise, and preferred project types using tag-based input fields. An availability toggle allows supervisors to indicate whether they are currently accepting new students.

---

## 4.4.3 Supervision Requests Inbox
**URL:** `/supervisor/requests`

The Supervision Requests Inbox displays all student supervision requests received by the supervisor. Requests can be filtered by status (All, Pending, Accepted, Rejected) and searched by student name, project title, or research area. Each request card shows the student's details (name, program, year, CGPA), proposed project title and description, research area, and submission date. Pending requests are highlighted with visual indicators to prompt timely responses. A summary section displays aggregate counts of requests by status.

---

## 4.4.4 My Supervisees
**URL:** `/supervisor/supervisees`

The My Supervisees screen provides a comprehensive view of all students under the supervisor's guidance. The list can be filtered by project status (All, In Progress, On Hold, At Risk) and sorted by name, progress, or risk level. Each supervisee card displays student information, project title, overall progress bar with percentage, meeting count, pending log count, and last meeting date. Students at high or critical risk are visually highlighted. Risk indicators (colored dots) provide quick visibility into student performance concerns. A summary section shows the distribution of supervisees across different statuses.

---

## 4.4.5 Proposal Review
**URL:** `/supervisor/proposals`

The Proposal Review screen presents all student proposals awaiting supervisor review and feedback. Proposals can be filtered by status (All, Submitted, Under Review, Needs Revision, Approved) and searched by student name or title. Each proposal card shows the title, student name, version number, AI analysis score (if available) with clarity and feasibility sub-scores, revision history count, and submission date. Proposals requiring attention are highlighted with visual indicators. The summary section displays counts of proposals at each review stage.

---

## 4.4.6 Meeting Management
**URL:** `/supervisor/meetings`

The Meeting Management screen enables supervisors to schedule and manage meetings with supervisees. Quick stats cards display pending approvals, upcoming meetings, completed meetings, and total count. Meetings can be filtered by status and searched by student name or title. Each meeting card shows the date in a prominent badge, meeting title, student name, time, duration, meeting type (In Person, Online, Hybrid), location, and agenda preview. A "Schedule Meeting" button allows supervisors to create new meeting requests. Meeting cards indicate who initiated the request (supervisor or student).

---

## 4.4.7 Supervision Logs Review
**URL:** `/supervisor/logs`

The Supervision Logs Review screen allows supervisors to review and sign weekly supervision logs submitted by supervisees. Logs can be filtered by status (All, Pending, Approved, Signed) and searched by student name or content. Each log card displays the week number in a prominent badge, student name, date range, status, activity preview, hours spent, and submission date. Pending logs are highlighted to prompt timely review. Supervisors can approve logs, request revisions, or sign completed logs. The summary section shows counts of logs at each review stage.

---

## 4.4.8 Documents Review
**URL:** `/supervisor/documents`

The Documents Review screen provides access to all documents uploaded by supervisees for review and feedback. Documents can be filtered by type (All, Proposals, Reports, Presentations) and by individual student. Each document card shows the file icon based on type, title, student name, document type badge, file name, size, version number, feedback count, description, and upload date. The search function allows finding specific documents quickly. A summary section displays document counts by type and those with feedback.

---

## 4.4.9 Announcements
**URL:** `/supervisor/announcements`

The Announcements screen enables supervisors to create and manage announcements for their supervisees. Announcements can be searched by title or content. Each announcement card displays priority level (Low, Normal, High, Urgent) with color-coded styling, title, visibility scope (All Supervisees, Specific Students, FYP1, FYP2), content preview, view count, publication date, and expiration date. Edit and delete actions are available for each announcement. Expired announcements are visually distinguished. A "New Announcement" button allows creating new announcements. The summary section shows total count, active announcements, high-priority items, and total views.

---

## 4.4.10 Notifications Center
**URL:** `/supervisor/notifications`

The Notifications Center consolidates all supervisor-related notifications in one place. Notifications can be filtered to show all or only unread items. Each notification displays an icon indicating the type (Request, Meeting, Log, Document, Proposal, System), title, message, timestamp, and read/unread status with visual indicators. Clicking a notification marks it as read and navigates to the relevant detail page. A "mark as read" button allows marking items read without navigation. The category summary section shows notification counts by type (Requests, Meetings, Logs, Documents) for quick overview of activity areas.

---

*Document generated for FYP Supervision System - Supervisor Module*
