# Supervisor Modules

What a supervisor can do in the system. Pages live under
`/supervisor/*`; endpoints under `/api/supervisor/*` with the
`SUPERVISOR` authority.

**中文总览：** 这一份文件列出"导师"角色在系统里能用的所有功能。导师的主要工作是接收学生申请、审批提案、安排会议、签会议记录、给文档反馈。功能集中在 `/supervisor/*` 页面下。下面每一节都先用中文简单解释，再附上英文细节。

---

## 1. Authentication and Profile

**中文说明：** 登录和资料管理。导师可以编辑自己的研究方向、专长标签、最多带几个学生（容量）、个人简介、头像。把容量设为 0 后，自己就不会出现在学生那边的导师目录里。账号状态：激活、锁定（5 次错密码）、暂停。

Login, profile editing (specialisation, expertise tags, capacity, bio,
profile image).

| Page | Purpose |
|---|---|
| `/login` | Same as other roles |
| `/supervisor/profile` | Edit expertise, set max supervisee capacity, upload photo |

**Different cases**

- Account states: `ACTIVE`, `LOCKED` (5 wrong passwords), `SUSPENDED`.
- Setting capacity to 0 makes the supervisor disappear from the student-facing directory.

---

## 2. Dashboard

**中文说明：** 导师主页（仪表盘）。一进去就能看到：现在带几个学生、有几个学生的申请等着回复、有几份会议记录还没签、最近的会议、最新提交的提案要审、本周空闲时段有没有设。

Single page showing the supervisor's load and recent activity.

Shows: number of active supervisees, pending request count, unsigned
meeting log count, recent meetings, recent proposal submissions
awaiting review, weekly availability status.

---

## 3. Request Inbox

**中文说明：** 学生申请收件箱。学生发来的指导申请都在这里。导师可以"接受"（自动配对、剩余名额 -1、发邮件和通知给学生）或"拒绝"（可以写理由）。名额满了的话，接受按钮会变灰。

List of supervision requests sent by students.

| Action | Effect |
|---|---|
| Accept | Creates pairing, decrements remaining capacity, fires notification + email to student |
| Reject | Increments rejection counter, optionally records the reason shown to student |

**Different cases**

- **Capacity full** — accept button disabled with tooltip.
- **Multiple pending requests** — listed in submission order; only accepting one auto-cancels duplicates if the student opens another.

---

## 4. Supervisees List

**中文说明：** 我的学生列表，一行一个学生，方便一眼掌握所有学生的进度。表格里有：姓名、专业、当前阶段（FYP1/FYP2）、会议记录完成数、上次会议时间、提案状态、风险等级（绿/黄/红）。可以切到"历史学生"看以前带过的。

Roster of paired students with progress at a glance.

`?scope=active` (default) shows current-cycle pairings; `?scope=past`
shows historical pairings from previous cycles.

Columns: student name, programme, current phase, compliance count,
last meeting date, proposal status, risk badge.

---

## 5. Supervisee Detail

**中文说明：** 单个学生的详细资料页。点进某个学生后能看到他完整的时间线：会议记录、已签的会议日志、提案版本演变、上传过的文档、沟通历史。

Drill into one student. Shows full timeline: meetings, signed logs,
proposal versions, documents, communication history.

---

## 6. Proposal Review

**中文说明：** 提案审核。学生提交的提案列在一个队列里，导师可以：批准（提案变成 APPROVED，版本锁定）、要求修改（写评论，学生收到通知后可以提交新版本）、看 AI 分析（系统先给的智能打分参考）。评论是分章节挂上去的，学生能直接看到哪一段要改。学生提交 v2、v3 时，前后版本会高亮差异。

Queue of proposals submitted by my supervisees, plus a detail page.

| Action | Effect |
|---|---|
| Approve | Moves proposal status to `APPROVED`, locks the version |
| Request Changes | Adds reviewer comments; student receives notification and can submit a new version |
| View AI Analysis | Read-only view of the proposal analyzer scores |

Comments are threaded per section so the student can see exactly
which part needs changes.

**Different cases**

- **First version** — straightforward review.
- **Resubmission (v2, v3, …)** — the diff between versions is highlighted; reviewer can see the original comments and whether each was addressed.

---

## 7. Meeting Management

**中文说明：** 会议管理。所有学生约的会议都在这里。导师可以：确认会议（提议 → 确认）、改约（提一个新时间，等学生回复）、拒绝（写理由）、补上线上会议链接（线上模式可以会后加 Zoom／Teams URL）。导师也能主动发起一场会议。

View, confirm, reschedule and link-set meetings.

| Page | Purpose |
|---|---|
| `/supervisor/meetings` | Upcoming + Past tabs with PROPOSED / CONFIRMED counters |
| `/supervisor/meetings/:id` | Detail with respond actions |
| `/supervisor/meetings/create` | Supervisor-initiated meeting |

**Respond actions**

- Confirm — proposed time accepted, status moves `PROPOSED → CONFIRMED`.
- Reschedule — counter-propose a new time; flips to `RESCHEDULED` until student accepts.
- Decline — kills the proposal with a reason.
- Set Link — PATCH `/link` to attach a Zoom/Teams URL after the fact (Online mode only).

---

## 8. Weekly Availability

**中文说明：** 每周空闲时段设置。一个 7 天 × 时间段的格子，导师勾选自己有空的时段。学生约会议时只能从这些勾选过的时段里挑。如果一整周都没设，学生会看到"没有可用时段"。

Grid editor for the seven days of the week × time slots.

Saved as `supervisor_availability` rows keyed by `DayOfWeek` enum.
Students consume this through the slot picker in their Meeting
Request page.

**Different cases**

- **Empty week** — student sees "no slots" on the picker.
- **Partial week** — only selected days show in the picker.

---

## 9. Meeting Logs Review

**中文说明：** 会议记录审批和签名。学生先填好记录、签好字、提交上来；导师在这里复核，签名（系统会把两个人签名的字节拼起来算 SHA-256 哈希值，存入文档底部防伪造），日志状态变成"已签+锁定"。如果不满意，可以"打回"让学生改。导出 DOCX 时哈希值会跟着印在脚注里。

Counter-sign meeting logs the student has signed and submitted.

| Action | Effect |
|---|---|
| Sign | Captures supervisor signature image, computes SHA-256 of concatenated signature bytes, moves log to `SIGNED + LOCKED` |
| Request Changes | Returns log to `DRAFT` with a comment, student can re-edit |

**Different cases**

- **Both signed** — log is locked; DOCX export includes the hash footer.
- **Only student signed** — supervisor's signature panel is highlighted; until they sign, the log shows `SUBMITTED`.

---

## 10. Documents Review

**中文说明：** 文档审阅。可以浏览学生上传的所有文档，也能上传导师反馈文件到同一个学生的文件流里，让学生在文档页一并看到。

Browse documents uploaded by supervisees and upload supervisor
feedback files into the same per-student stream.

---

## 11. Announcements

**中文说明：** 公告页分两块：① 收件箱：看委员会、管理员和自己发过的公告 ② 写公告：只能发给自己带的学生（可以发给所有，也可以选特定几个）。导师没有权限发给全院学生——那是委员会和管理员的权限。

Two-mode page:

| Mode | What it does |
|---|---|
| Inbox | View incoming announcements (committee broadcasts, admin broadcasts, my own previously sent) |
| Compose | Send to my own supervisees only — audience is fixed |

The Send page lets the supervisor pick: all my supervisees / specific
supervisees (multi-select). Supervisor cannot broadcast cohort-wide
(that is committee or admin only).

**Different cases**

- **Composed** — appears in my Inbox as "Sent".
- **Received from committee/admin** — shows as "Received" with source badge.

---

## 12. Notifications

**中文说明：** 通知中心，跟学生那边类似。导师会收到的提醒包括：有新申请进来、学生签了会议记录、会议被取消、新的提案版本提交等等。

Same inbox style as the other roles; sees notifications for request
in, log signed, meeting cancelled, proposal submitted, etc.
