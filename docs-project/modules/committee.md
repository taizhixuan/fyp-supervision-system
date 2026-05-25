# FYP Committee Modules

What an FYP Committee member can do in the system. Pages live under
`/committee/*`; endpoints under `/api/committee/*` with the
`FYP_COMMITTEE` authority.

The committee role is broader than a single supervisor — it sees the
whole cohort, not just one supervisee group. This is the role that
runs end-of-trimester reporting and intervenes on at-risk students.

**中文总览：** 这一份文件列出"FYP 委员会"角色在系统里能用的所有功能。委员会看的不是单个学生，而是"整届学生"——监督进度、生成报告、找出落后的学生、保证导师工作量平衡。是学期末生成报表、判定学生是否合规的核心角色。功能集中在 `/committee/*` 页面下。

---

## 1. Authentication and Profile

**中文说明：** 登录和资料管理。流程跟其他角色一样。账号状态有：激活、锁定、暂停。

Same login flow as other roles. Profile editing through
`/committee/profile`.

**Different cases**

- Account states: `ACTIVE`, `LOCKED`, `SUSPENDED`.

---

## 2. Dashboard

**中文说明：** 全届概览仪表盘，跟学生／导师的不一样。能看到：全届学生人数、还没配到导师的学生数、风险等级分布（红/黄/绿）、所有导师手上待审的提案数、最近委员会的操作记录、即将到来的截止日期。

Cohort-level overview. Different shape from the student/supervisor
dashboard.

Shows: cohort size, unpaired student count, at-risk count (red /
amber / green colouring), pending proposal reviews across all
supervisors, recent committee actions, upcoming deadlines.

---

## 3. Announcements

**中文说明：** 全院公告发布。委员会和管理员是仅有的两个能发"全员公告"的角色。发的时候可以选范围：所有学生 / 仅 FYP1 / 仅 FYP2 / 某个专业的学生 / 指定的某几个学生。已发的公告可以改（保留旧版本作审计）也可以撤回（标记为"已撤回"留底）。

Committee members are one of the two roles allowed to broadcast
cohort-wide (the other being System Admin).

Compose page lets the author pick the audience layer:

| Audience | Recipients |
|---|---|
| `ALL` | Every active student in any cycle |
| `FYP1_ONLY` | Students whose current cycle type is FYP1 |
| `FYP2_ONLY` | Students whose current cycle type is FYP2 |
| `PROGRAMME` | Students in the selected programme codes |
| `SPECIFIC_STUDENTS` | A multi-select list of specific student IDs |

**Different cases**

- **Created** — appears in the committee's "Sent" tab and in target students' feeds.
- **Updated** — versioned; older revision retained for audit.
- **Withdrawn** — soft-deleted; flagged "withdrawn" in the committee history.

---

## 4. Proposal Review Queue

**中文说明：** 全院提案审核队列。跟导师不同，委员会能看到所有学生的提案，用于复核、防止跨组撞题、确保各项目的难度和范围都合理。可以「批准」（独立于导师批准）、「要求修改」（添加委员会层的评论给学生）、「打标记」（标记关注，但不阻挡学生流程）。

Cross-cohort proposal review — unlike a supervisor, the committee
sees proposals from every project, not just their own supervisees.

Used for: moderation, ensuring scope and feasibility across the
faculty, spotting duplicate ideas, flagging risk areas.

| Action | Effect |
|---|---|
| Approve | Marks the proposal as committee-approved (independent of supervisor approval) |
| Request Changes | Adds committee-level comments returned to the student |
| Flag | Marks for follow-up without blocking the student |

---

## 5. Documents Management

**中文说明：** 官方模板管理。整个学院用的模板和手册都由委员会维护。可以上传新模板、查看历史版本、回滚旧版本。上传新版本会自动取代旧版本但旧版会保留作记录。

The committee owns the official templates and handbook used by the
faculty.

| Page | Purpose |
|---|---|
| `/committee/documents` | Browse uploaded templates |
| `/committee/documents/upload` | Upload a new template version |
| `/committee/documents/:id/versions` | Version history with rollback |

**Different cases**

- **New version of an existing template** — supersedes the previous one but keeps history.
- **Brand-new template** — appears in the student Resources Hub immediately.

---

## 6. Project Overview

**中文说明：** 全届项目总览表，每个学生一行，配自动算出来的风险等级。表格列包括：学生名字＋学号、导师、阶段（FYP1/FYP2）、会议记录合规情况（X/6）、上次会议距今几天、提案状态、风险颜色（绿/黄/红）。风险等级由 `ProjectProgressService` 算出来，基于会议合规、近期活跃度、配对后过去的时间。

Full cohort table with risk scoring per student.

| Column | Source |
|---|---|
| Student | name + ID |
| Supervisor | from pairing |
| Phase | FYP1 / FYP2 |
| Compliance | n / 6 logs |
| Last meeting | days since |
| Proposal status | DRAFT / SUBMITTED / APPROVED |
| Risk | green / amber / red (computed) |

Risk computation is in `ProjectProgressService` — colour comes from
log compliance, recency of last meeting, time elapsed since pairing.

---

## 7. Project Detail

**中文说明：** 单个项目的详细页。能看到导师视角下的完整时间线，如果这个学生之前已经做过几个学期 FYP，还能看到跨学期的历史记录。

Drill into one project. Shows the same timeline a supervisor would
see but with cross-cycle history if the student has been through
previous trimesters.

---

## 8. Unpaired Students

**中文说明：** 还没有导师的学生筛选页。分三类：还没发任何申请的、有待回复申请的、被拒绝过 N 次的（次数管理员可以配）。委员会用这个页面主动介入：如果某个学生一直被拒、长期没人收，可以人工帮忙撮合。

Filtered view of students who do not yet have a supervisor.

| Sub-view | What it shows |
|---|---|
| Unpaired | Students with no `PROJECT` row yet |
| Pending requests | Students with at least one open `PENDING` supervision request |
| Rejected | Students who have been rejected ≥ N times (configurable) |

Used for active outreach: the committee can intervene if a student
is stuck.

---

## 9. Supervisor Load

**中文说明：** 所有导师的工作量统计。表格列出每个导师的最大容量、当前带几个学生、邮箱里还有几个待回复申请、利用率百分比。用来发现哪些导师太忙、哪些导师还有空，方便调配学生让大家分工平衡。

Capacity utilisation report across all supervisors in the active
cycle.

| Column | Source |
|---|---|
| Supervisor | name |
| Capacity | configured max |
| Current load | active supervisees this cycle |
| Pending requests | open requests in inbox |
| Utilisation % | load / capacity |

Highlights over- and under-utilised supervisors for cohort balancing.

---

## 10. Reports Module

**中文说明：** 报表生成模块——委员会期末用得最多的工具。可以一键生成全届进度报告、合规报告、导师负载报告、配对延迟报告、自定义时间段报告。导出格式有 CSV（贴回 Excel 表）、DOCX（开会传阅打印）、JSON（喂给其他工具）。所有生成过的报表都会留底，方便随时下载。

The most-used committee tool at end-of-trimester. Generates structured
cohort reports.

| Report type | Output |
|---|---|
| Cohort progress | Per-student progress with risk colouring |
| Compliance | Per-student 6-log compliance status |
| Supervisor load | Capacity utilisation snapshot |
| Pairing latency | Time from intake to confirmed pairing |
| Custom (date range) | Filterable cross-section |

| Format | When to use |
|---|---|
| CSV | Paste into the faculty office's existing spreadsheet |
| DOCX | Print and circulate at the committee meeting |
| JSON | Pipe into other internal tools |

History page (`/committee/reports/history`) keeps every generated
report with download links.

---

## 11. Export Overview

**中文说明：** 批量导出快捷方式。把常用的报表组合打包成一键导出，例如：「FYP1 结业打包」= 进度报告 + 合规报告 + 导师负载，一个 ZIP 一起下载；「评审包」= 每个项目一份 DOCX，把签过字的会议记录连在一起。

Bulk export shortcuts that wrap the Reports Module for common
combinations. Examples:

- "End of FYP1": cohort progress + compliance + supervisor load in one ZIP.
- "Moderation pack": one DOCX per project with signed meeting logs concatenated.

---

## 12. Notifications

**中文说明：** 通知中心。委员会会收到的提醒包括：有学生进入风险区、有提案被标记需要关注、某个导师负载过高的预警、学期切换通知等等。

Standard inbox; receives notifications for at-risk thresholds,
proposal flagged, supervisor-load alerts, cycle transitions.
