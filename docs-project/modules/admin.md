# System Administrator Modules

What a System Administrator can do. Pages live under `/admin/*`;
endpoints under `/api/admin/*` with the `SYSTEM_ADMIN` authority.

This role configures the system and runs operational tasks
(onboarding, cycle transitions, backups, audit). It is not involved
in academic decisions about specific students or proposals.

**中文总览：** 这一份文件列出"系统管理员"角色在系统里能用的所有功能。管理员管的是系统层面的运维：账号开通、用户审批、学期切换、参数配置、备份恢复、审计日志。管理员不参与学术决定（不会去审某个学生的提案），那是导师和委员会的事。功能集中在 `/admin/*` 页面下。

---

## 1. Authentication and Profile

**中文说明：** 登录和个人资料。默认管理员账号 `admin@mmu.edu.my / Admin@123`。资料编辑在 `/admin/profile`。

Standard login. Default admin: `admin@mmu.edu.my / Admin@123`.

Profile editing through `/admin/profile`.

---

## 2. Dashboard

**中文说明：** 系统健康概览仪表盘。能看到：各角色用户总数、待审批注册数、被锁账号数、系统参数最后一次改的时间、最近一次备份时间、最近的审计日志、后台任务队列长度。

System health and recent admin activity.

Shows: total users by role, pending registrations count, locked
account count, system parameters last modified date, last backup
timestamp, recent audit log entries, queue depth for any background
jobs.

---

## 3. User Management

**中文说明：** 全员账号管理。可以按角色（学生／导师／委员会／管理员）、状态（激活／锁定／暂停／待审批）、专业、入学届筛选搜索。常见操作：编辑、锁定／解锁（锁定会立刻踢出登录中的会话）、暂停、重置密码。已在做 FYP 的学生，部分字段（专业、入学届）会变只读，避免学期中改坏数据。

Searchable list of every user in the system.

| Filter | Options |
|---|---|
| Role | STUDENT, SUPERVISOR, FYP_COMMITTEE, SYSTEM_ADMIN |
| Status | ACTIVE, LOCKED, SUSPENDED, PENDING_APPROVAL |
| Programme | FCI programme codes (students) |
| Intake | Academic year |

| Action | Effect |
|---|---|
| Edit | Opens the user detail page |
| Lock / Unlock | Toggles `LOCKED` state; lock kills active sessions |
| Suspend | Soft-disables; user sees "account suspended" on login |
| Reset password | Sends a fresh reset email |

**Different cases**

- **Active student** — full edit access.
- **Account in cycle** — some fields (programme, intake) are read-only until cycle ends.

---

## 4. Pending Registrations

**中文说明：** 新生注册待审收件箱。学生自助注册后状态是「待审批」，管理员在这里逐个或批量审核。批准后状态变激活，并自动发欢迎邮件；拒绝可以填理由。批量审核适合一整届新生入学时用。

Inbox of newly self-registered students awaiting admin approval.

| Action | Effect |
|---|---|
| Approve | Status moves to `ACTIVE`, student receives welcome email |
| Reject | Status moves to `REJECTED` with optional reason |
| Bulk approve | Multi-select for whole-cohort imports |

---

## 5. Approved Roster

**中文说明：** 已审批通过的学生花名册。按入学届和专业筛选。开学时用来核对一下：所有该入学的学生都成功开通账号了吗？

Cohort view of active students. Filter by intake / programme. Used
during onboarding to verify everyone made it through.

---

## 6. FYP1 Pass Tracking

**中文说明：** FYP1 通过状态登记。FYP1 通过了才能进 FYP2，这是硬性门槛。管理员在这里逐个标"通过"或"不通过"，也支持 CSV 批量上传。直到 FYP1 结果都登记完，新一届 FYP2 周期才能激活。

Specifically marks whether a student passed FYP1 (a prerequisite to
proceed to FYP2).

| Action | Effect |
|---|---|
| Mark Passed | Student becomes eligible for the next FYP2 cycle |
| Mark Failed | Student is held back |
| Bulk import | CSV upload of pass/fail decisions |

This is a deliberate workflow: a FYP2 cycle cannot be activated
until the FYP1 results are in.

---

## 7. Create User

**中文说明：** 手动创建用户。这个表单专门给职员（导师、委员会、管理员）开账号——学生一般自己注册，不走这里。

Manual user creation form for non-students (supervisor, committee,
admin). Students typically register themselves; this is for staff.

---

## 8. User Detail

**中文说明：** 单个用户详细页。能改资料、重置密码、查这个人的登录历史、查所有对这个账号做过的更改记录（审计轨迹）。

Per-user edit page with reset password, view login history, view
audit trail of changes to this user.

---

## 9. System Parameters

**中文说明：** 系统参数中心。一个键值对的配置表，用来控制系统行为。常见的例子：每阶段会议记录最少几份（默认 6）、FYP1 会议日志模板路径、AI 推荐器的五个权重、提案上传文件大小上限、密码错误几次锁账号（默认 5）、锁定多少分钟（默认 15）、截止日期前几天发提醒。改任何参数都会进审计日志。参数分公开（登录前的前端就能读）和私有（只有后端能读）两种。

Editable key-value store that drives system behaviour. Examples:

| Key | Purpose |
|---|---|
| `meeting.log.minimum` | Required logs per phase (default 6) |
| `meeting.log.template.fyp1` | Path to the FYP1 DOCX template |
| `recommendation.score.weights` | The five weights for the AI recommender |
| `proposal.upload.max_mb` | File size cap on proposal uploads |
| `password.lockout.threshold` | Failed attempts before lockout (default 5) |
| `password.lockout.duration_min` | Lockout cooldown in minutes (default 15) |
| `cycle.notification.days_before` | Days before deadline to fire reminder |

Each parameter has type, description, default, and last-modified
metadata. Changes are recorded in the audit log.

**Different cases**

- **Public parameter** — exposed via `/api/system/parameters/public` (no auth required), used by the frontend before login.
- **Private parameter** — only readable by admin and consumed by backend services.

---

## 10. Cycle Management

**中文说明：** 学期周期管理（FYP 一届一届的）。每个周期有四个状态：规划中（PLANNING，还没向学生开放）、激活（ACTIVE，当前学期）、已完结（COMPLETED，学生只能看不能改）、已归档（ARCHIVED，默认看不到）。「激活」会自动把上一届同类型的周期关掉；「完结」会群发通知给所有该届学生，并开启只读保护；「归档」是把旧周期收起来。每个周期可以配类型（FYP1 / FYP2）、起止日期、周数、覆盖的专业代码。

Manage trimester cycles (`fyp_cycle` table). Cycles are first-class
entities with a four-state lifecycle.

| State | Meaning |
|---|---|
| `PLANNING` | Created but not yet open to students |
| `ACTIVE` | Current cycle; students can do work |
| `COMPLETED` | Closed; student writes return 403, reads still work |
| `ARCHIVED` | Hidden from default queries, kept for audit |

| Action | Effect |
|---|---|
| Activate | Moves `PLANNING → ACTIVE`; auto-demotes any other active cycle of the same type |
| Complete | `ACTIVE → COMPLETED`; fans out a notification to every enrolled student; flips the read-only gate |
| Archive | `COMPLETED → ARCHIVED`; removes from default dashboard queries |

Cycle parameters: type (FYP1 / FYP2), start date, end date, week
length, attached programme codes.

---

## 11. Deadline Management

**中文说明：** 截止日期管理。新建或修改学期内的关键截止日期（提案截止、中期审查、最终提交、答辩等等），改完会自动同步到所有学生的日历和仪表盘。删除是软删除，日历上看不到但留底审计。提醒会在截止日 N 天前自动发，N 在系统参数里调。

Create and edit cycle deadlines that show on every student's calendar.

| Action | Effect |
|---|---|
| Create | New deadline (proposal due, midterm review, final submission, viva, …) |
| Edit | Date / description changes propagate to the calendar and the dashboard widget |
| Delete | Soft-deleted; removed from the calendar but retained for audit |

Reminder notifications fire `N` days before each deadline (`N` is in
System Parameters).

---

## 12. Integration Settings

**中文说明：** 第三方对接配置：邮件服务器（SMTP 主机、端口、账号）、三个 AI 服务的地址（推荐器、提案分析器、聊天机器人）、上传文件的根目录和容量上限、未来 SSO 单点登录占位。

Configuration for outbound integrations.

| Setting | Purpose |
|---|---|
| Email (SMTP) | Hostname, port, credentials for outbound mail |
| AI service URLs | `AI_RECOMMENDATION_URL`, `AI_ANALYZER_URL`, `AI_CHATBOT_URL` |
| Storage | Upload root path and quota |
| Identity provider | (Placeholder for future SSO; not in use today) |

---

## 13. Export Configuration

**中文说明：** 报表导出的默认设置。委员会点导出时用的默认格式、默认输出路径都在这里配。

Configure default formats and output paths for the bulk exports
triggered by the committee.

---

## 14. Maintenance Centre

**中文说明：** 运维工具箱。常用操作：① 数据库备份（生成带时间戳的 ZIP 文件，存到 `uploads/backups/`，几秒就好，随时能做）② 清旧日志（按保留天数清审计日志）③ 重建聊天机器人索引（重新跑 `build_knowledge_base.py`，过程中聊天机器人会暂停约 1 分钟）④ 轮换 JWT 签名密钥（破坏性操作！会让所有人当场被踢出登录，要先发公告再做）。

Operational toolbox.

| Action | What it does |
|---|---|
| Backup database | Produces a timestamped ZIP under `uploads/backups/` |
| Clear old logs | Deletes audit log entries older than the configured retention |
| Reindex chatbot | Re-runs `build_knowledge_base.py` on the chatbot container |
| Rotate signing keys | Rotates the JWT signing secret (forces re-login for all users) |

**Different cases**

- **Backup** — always safe to run; takes seconds for the typical database size.
- **Reindex** — pauses chatbot for ~1 minute while the FAISS index rebuilds.
- **Rotate keys** — destructive: every active session is invalidated; use only after announcement.

---

## 15. Job History

**中文说明：** 后台任务历史。系统在后台做的事（学期切换、备份、通知群发、报表导出）都会记一笔在这里，可以按类型、状态、耗时筛选。出问题时方便排查。

Log of every background job run (cycle transitions, backups,
notifications fan-out, exports). Filter by job type, status,
duration.

---

## 16. Audit Logs

**中文说明：** 审计日志。系统里凡是会改数据的操作都写一笔进来，只能追加不能改也不能删。每条记录包括：什么时候、谁（用户 ID + 角色）、做了什么操作、影响哪一行哪个表、改之前和之后的内容（JSON 对比）、来源 IP。可以按操作人、操作类型、目标、时间范围筛选。出事故复盘和教务办公室追查问题都靠它。

Append-only record of every state-changing action in the system.

| Field | Source |
|---|---|
| Timestamp | Server time at action |
| Actor | User ID + role |
| Action | Enum (USER_CREATED, USER_LOCKED, CYCLE_ACTIVATED, REPORT_GENERATED, …) |
| Target | Affected row's id and table |
| Diff | Before / after JSON for changes |
| IP | Source IP of the request |

Filter by actor, action, target, date range. Used during incident
review and faculty-office moderation.

---

## 17. Admin Notification Centre

**中文说明：** 管理员通知中心。除了其他角色都收到的常规通知外，管理员还会收到：① 新注册申请提醒 ② 后台任务失败警报 ③ 其他管理员改了系统参数的提醒 ④ 备份成功／失败的通知。

Same inbox style as other roles, but the admin also receives:

- New registration alerts
- Failed background job alerts
- System parameter changes by other admins
- Backup success / failure notifications
