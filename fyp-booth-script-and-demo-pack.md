---
title: FYP2 Booth Script & Demo Pack
project: FYP Supervision System (application-based)
event: Physical Poster Presentation, Term 2530
date: 10 February 2026 (Tuesday), 9:00am - 12:00noon
venue: CQAR 1004 - 1009 (FCI Level 1)
dress: Formal
---

# FYP2 Booth Script & Demo Pack

## 0. Before anyone arrives (do this first)

- Arrive early. Plug in, open the app, log in, and leave it running on the **dashboard** screen.
- Pre-seed the database so every demo path has data (a sample student, supervisor, moderator, an approved title, a few milestones, a logged meeting, some marks). Never demo on an empty system.
- Have **two browser tabs / logins** ready: one as Student, one as Supervisor. Switching is faster than logging out and in.
- Open your **video demo** in another tab as backup. If the live app breaks, you keep talking and play the video.
- Have the printed poster up, soft copy of the report + poster on the PC, and the video file on the PC (guidelines require all four present).
- Silence laptop notifications. Disable sleep/screensaver. Bring your charger and an extension cord.
- Glass of water nearby. You may repeat the full pitch many times across 3 hours.

---

## 1. The 45-second visitor pitch (for random visitors)

Use this when someone walks up. Hook with the problem, not the tech.

> "Hi, this is **[Project ID + Title]**, a FYP Supervision System.
> Right now at most universities, FYP supervision is scattered across email, WhatsApp, and spreadsheets, so meetings go unlogged, deadlines get missed, and documents get lost. My system puts the whole supervision process in one place.
> Students propose titles and submit deliverables, supervisors track progress and log consultations, and supervisors and moderators do the final evaluation, all with automatic deadline reminders.
> Want me to show you a quick run-through?"

Then jump to the demo (Section 3).

---

## 2. The full walkthrough (for the moderator)

The moderator scores you against the rubric and may not know your project. Follow your poster order so it stays tight. Aim for 3-4 minutes, then demo.

**Problem & objectives**
> "The problem I'm solving: FYP supervision is currently manual and fragmented. Students and supervisors coordinate over email and chat, progress isn't tracked centrally, and evaluation is done on paper or spreadsheets, which is slow and inconsistent.
> My objectives were to (1) centralise the supervision workflow, (2) give each role, the student, supervisor, and moderator, the right tools and visibility, and (3) make evaluation structured and traceable."

**Design**
> "I built it as a role-based web application with [your stack]. There are [N] roles. The data model centres on a Project entity linked to a student, a supervisor, a moderator, its milestones, submissions, and meeting logs. The backend exposes a REST API and the frontend consumes it."
*(Point to the architecture / ER diagram on your poster as you say this.)*

**Implementation & testing**
> "The core modules are: title proposal and approval, supervisor allocation, milestone and deliverable tracking, consultation logging, and evaluation. I tested it with [unit tests / manual test cases / user acceptance testing] covering the main workflows."

**Then:** "Let me show you the key flow live."  → demo.

**Conclusion (close strong)**
> "So the system replaces a fragmented manual process with one platform that tracks every project from proposal to final grade. If I had more time, I'd add [one honest next step, e.g. plagiarism-check integration, analytics dashboard for the coordinator]."

---

## 3. Demo sequence (the happy path)

Keep it to one clean end-to-end story. Don't click around aimlessly. Narrate what you're doing and *why it matters*.

1. **Login as Student.** "Students log in and land on their FYP dashboard showing their title, supervisor, and upcoming deadlines."
2. **Submit a deliverable / proposal.** Upload a sample file. "Submissions are timestamped and stored centrally, no more lost email attachments."
3. **Log a consultation / meeting.** "After each meeting the student logs it, and the supervisor confirms it. This creates a record of supervision."
4. **Switch to Supervisor login.** "Now from the supervisor side." Show the list of supervisees and one student's progress.
5. **Show progress / milestone tracking.** "The supervisor sees every milestone status at a glance and can give feedback on a submission." Add a quick comment.
6. **Show evaluation / marks entry.** "At the end, the supervisor and moderator enter marks against the rubric here, and the system computes the final result." Enter a sample mark.
7. **(If you have it) Notifications / reminders.** Show a deadline reminder. "Everyone gets automatic reminders, so deadlines don't slip."

Land the demo back on the dashboard. End: "That's the full loop, proposal to evaluation, in one system."

> **Rule:** rehearse this exact sequence until you can do it without thinking. Know which buttons are slow and talk over the loading.

---

## 4. Supervisor depth questions (they know your work)

Expect "why" and "what if" questions. Have crisp answers:

- **Why this stack / architecture?** Give a real reason (familiarity, REST separation of concerns, scalability), not "the lecturer suggested it."
- **How do you handle roles and permissions?** Explain your auth and access control.
- **What happens if [a supervisor leaves / a student changes title]?** Show you thought about edge cases.
- **How did you test it?** Name your approach and one bug you found and fixed.
- **What was the hardest part?** Pick one genuine technical challenge and how you solved it. This is your best chance to show depth.
- **What would you improve?** Have two honest answers ready.

---

## 5. Likely Q&A (all audiences)

- **"Who is this for?"** → Students, supervisors, moderators, and the FYP coordinator at a faculty.
- **"How is this different from just using email / Google Classroom / a spreadsheet?"** → Those are general tools with no FYP workflow, no role-specific views, no structured evaluation, and no central progress tracking. Mine is purpose-built for the supervision lifecycle.
- **"Is it deployed / live?"** → Be honest: running locally / on [host]. Say what's done vs prototype.
- **"How much is real vs mock-up?"** → State clearly which modules are fully functional.
- **"Can multiple students/supervisors use it at once?"** → Explain your data model supports many-to-one student-supervisor relationships.

---

## 6. If the demo breaks (recovery)

Stay calm, never apologise repeatedly. Say: *"Let me show you this part from my video demo instead,"* and switch tabs. Keep narrating. A confident recovery scores better than a panicked one. Reset the app between visitors if it gets into a weird state.

---

## 7. Fill these in before you rehearse

1. **Your tech stack** — backend, frontend, database (drop it into the Design script in Section 2).
2. **Your exact roles and modules** — confirm the feature names match what you actually built; rename steps in Section 3 accordingly.
3. **Your hardest technical challenge + your two "would improve" answers** — Sections 4 and 2. These are what separate a good viva from a great one.
