# Student Modules

What a student can do in the FYP Supervision System, module by module.
Every page listed here is under `/student/*` on the frontend and
under `/api/student/*` on the backend (Spring Security `STUDENT`
authority).

**中文总览：** 这一份文件列出"学生"这个角色在系统里能用的所有功能。学生是整个系统使用最多的角色，从注册账号、找导师、写提案、约见面、记录会议、上传文档，到看公告、看截止日期、和聊天机器人对话，全部都在 `/student/*` 这些页面下完成。下面每一节都先用中文简单说明，再附上英文细节。

---

## 1. Authentication and Profile

**中文说明：** 登录、注册、忘记密码、编辑个人资料。学生用 MMU 学号或 Email 加密码登录；新生注册后状态是「待审批」，要等管理员通过才能用。资料页可以改电话、简介、研究方向、入学届数，也能上传头像。密码连续输错 5 次会锁 15 分钟。

Login, registration, password recovery, profile editing.

| Page / Endpoint | What it does |
|---|---|
| `/login` | MMU ID or email + password. JWT issued on success. |
| `/register` | New student registration; lands in `PENDING_APPROVAL`. |
| `/forgot-password`, `/reset-password` | Email-based reset flow. |
| `/student/profile` | Edit phone, bio, specialisation, intake year; upload profile image. |

**Different cases**

- Account status: `PENDING_APPROVAL`, `ACTIVE`, `LOCKED` (after 5 wrong passwords, 15-min cooldown), `SUSPENDED`.
- Reset token expires after the configured window (see Admin → System Parameters).

---

## 2. Dashboard

**中文说明：** 学生主页（仪表盘），一进系统就看到。一眼能看到：现在是 FYP1 还是 FYP2、第几周、有没有导师、下一个截止日期、6 次会议记录完成了几次、最近的会议、最新的通知。不同状态显示的内容不一样：还没配对到导师时只看到基本信息；配对后才会显示完整的进度面板。

Single page that summarises a student's current FYP state.

Shows: cycle phase (FYP1 / FYP2) + week number, pairing status, next
deadline, 6-log compliance counter, recent meetings, recent
notifications, registration progress strip.

**Different cases**

- **Awaiting supervisor** — pre-pairing widgets only; sidebar feature gates hide Meetings/Logs/Documents.
- **Paired** — full dashboard with compliance, last meeting, next deadline.
- **Registered** — dashboard switches to read-only summary; Find Supervisor and AI Recommendation are locked.
- **Cycle ended** — `LockedFeaturePage` with `reason=CYCLE_ENDED` on every write page; dashboard remains readable.

---

## 3. Find Supervisor

**中文说明：** 导师目录页，列出所有还有名额的导师。可以用名字、专长关键字搜索，也可以按专业方向筛选，或者只看「还有空位」的导师。每张卡片显示照片、姓名、职位、专长标签、当前带学生数、最大容量。点进去可以看详细介绍，然后发出「申请指导」请求。

Static directory of all `SUPERVISOR` accounts with capacity > 0.

| Filter | Effect |
|---|---|
| Search | Full-text on name, expertise, bio |
| Specialisation | Single-select from FCI specialisations |
| Capacity | Show only those with vacancies |

Card view shows photo, name, position, expertise tags, current load,
capacity. Click through to a detail page that lists the same plus a
"Request Supervision" CTA.

---

## 4. AI Recommendation

**中文说明：** AI 智能推荐导师。系统会根据学生的研究兴趣自动推荐最匹配的导师，并给出排名和打分。打分由五个部分组成（专长相似度 40% + 关键词重合 20% + 剩余名额 15% + 当前负载 15% + 历史配对成功率 10%），每一项都看得见，所以学生可以理解"为什么推荐这个老师"，不是黑箱。底层用 Sentence-BERT (BGE-base) 把学生和导师的简介都转成向量，再算余弦相似度。

Sentence-BERT recommender deployed on `ai-recommendation:5001`.
Returns ranked supervisors with a five-component score.

**Model and data**

- Base model: BGE-base (`BAAI/bge-base-en-v1.5`), pre-trained sentence
  embedder — used as-is, no fine-tuning needed because the score is a
  closed-form weighted sum, not a learned end-to-end model.
- Inputs at inference time: the student's profile string (research
  interests + keywords) and each supervisor's profile string
  (expertise tags + supervised topics). Both are embedded and
  compared with cosine similarity.
- Historical signals (current load, capacity, past pairing success
  rate) come from the live database, not the model.

Score breakdown shown per supervisor:

- Cosine similarity of profile embeddings (0.40 weight)
- Keyword overlap with declared topics (0.20)
- Available capacity normalised (0.15)
- Inverse current load (0.15)
- Historical pairing success rate (0.10)

The five weights are tuned against a small set of known-good pairings
from the previous FYP cohort. The advantage of the closed-form score
is that the ranking is reproducible and a student who wants to know
"why was this supervisor suggested?" can be shown the component
breakdown directly.

**Different cases**

- **Profile complete** — full ranking with explainable score.
- **Profile empty** — falls back to keyword-only scoring (lower confidence).
- **AI service down** — backend returns 503 and the page shows a clear error banner with retry.

---

## 5. Supervision Request

**中文说明：** 申请导师指导。学生选好导师后发送申请，状态有：待回复（PENDING）、已接受（ACCEPTED，配对成功）、被拒绝（REJECTED）、自己撤回（CANCELLED）。规则：同一时间只能有一个待回复的申请——发新的会自动取消旧的，防止学生群发骚扰导师。

Send, view and cancel supervision requests.

| State | Meaning |
|---|---|
| `PENDING` | Sent, awaiting supervisor decision |
| `ACCEPTED` | Pairing created, student moves to `PROPOSAL_PENDING` |
| `REJECTED` | Supervisor declined (optional reason shown) |
| `CANCELLED` | Withdrawn by student before decision |

A student may have at most one `PENDING` request at a time; sending a
new one cancels the previous.

---

## 6. Proposal Workspace

**中文说明：** 写 FYP 提案的工作区。整个流程分成五步：① 项目身份（标题、类型、方向）② 内容描述（问题、目标、范围、方法、预期成果）③ 团队（导师、副导师、单人还是双人组）④ 时间安排和下载 MMU 官方表格 ⑤ 检查后提交。每点一次「保存草稿」或「下一步」都会自动存档；正式提交后版本号 +1，并锁定不能再改，等导师反馈。

Five-step wizard for building the FYP proposal. Auto-saves a `DRAFT`
version each time the student clicks Save Draft or Next; bumps the
version number on submission.

| Step | Content |
|---|---|
| 1 — Project Identity | Title, project status, type, specialisation, category, focus, industry collaboration toggle |
| 2 — Description | Problem statement, objectives (1..N), scope, methodology, expected outcomes (1..N) |
| 3 — Team | Pre-filled supervisor block + co-supervisor; Number of Students (One / Two) |
| 4 — Timeline & Files | Optional timeline narrative + download generated MMU FYP form |
| 5 — Review | Read-only confirmation; Submit Proposal button locks the version |

**Different cases**

- **Single student** vs **Two students** (paired project): step 2 adds subtitle/work-distribution fields.
- **DRAFT** vs **SUBMITTED** — DRAFT is editable, SUBMITTED is read-only until supervisor returns feedback.
- **Version history** under `/student/proposal/history` keeps every supersedence.

---

## 7. AI Proposal Analyzer

**中文说明：** AI 提案质量分析。学生把草稿丢进去，系统会评分并给出修改建议。一共给五个分数：综合、可行性、创新性、清晰度、范围；还会按 8 个章节（问题、目标、范围、方法、文献综述、预期成果、时间表、标题）逐段检查，列出优点、缺点和改进建议。底层用 DistilBERT 在 ASAP 作文打分数据集（约 1.3 万篇文章）上微调过，准确度 QWK = 0.82。长文档会切成 480 字一段重叠扫描，所以不是只看开头。

Sends the current draft to `ai-proposal-analyzer:5002` and stores a
`ProposalCheckResult` row.

Returns five dimensional scores (Overall, Feasibility, Innovation,
Clarity, Scope), section-by-section breakdown (8 sections detected by
keyword), strengths, weaknesses, suggestions.

**Model and trained data**

- Base model: `distilbert-base-uncased` (small, fast variant of BERT).
- Fine-tuned on the **ASAP AES dataset** (Automated Student Assessment
  Prize, Hewlett Foundation Kaggle release). 12,958 essays after
  cleaning, normalised per essay-set so scores are comparable across
  prompts. Stored in `ai-proposal-analyzer/data/training_set.tsv`.
- Splits: train 9,361 / val 1,653 / test 1,944.
- Training run: 3 epochs, AdamW optimiser, learning rate 2e-5, batch
  size 8, max sequence length 512 tokens. Trained on CPU, took about
  2 hours 55 minutes wall-clock. Trained on 2026-05-10.
- Test metrics on held-out essays: **RMSE 0.1286, MAE 0.0951, QWK
  0.8195**. The Quadratic Weighted Kappa of 0.8195 is in line with
  published DistilBERT-on-ASAP literature (0.7–0.85 range).
- Long proposals are processed by **chunk-and-average** over
  overlapping 480-token windows, so a 2,000-word proposal is scored
  on the full text, not just the first paragraph.
- Final artefact lives at `ai-proposal-analyzer/models/essay_scorer/`
  and is roughly 268 MB.

**Pipeline composition**

1. Rule-based NLP layer (`nlp_utils.py`): Flesch-Kincaid grade,
   Gunning Fog, keyword detection for 8 sections (problem, objectives,
   scope, methodology, literature review, expected outcomes, timeline,
   title), paragraph structure. Always runs.
2. Fine-tuned DistilBERT regression: returns a 0..100 quality score
   on the proposal text.
3. Optional remote LLM (Groq Llama 3.3 70B Versatile, or OpenAI):
   produces richer strengths/weaknesses/suggestions prose. Falls back
   to NLP-only feedback if unconfigured or unreachable.
4. Composite scoring (transparent weighted sum):
   `overall = 0.30·model + 0.20·clarity + 0.20·structure + 0.15·scope + 0.15·innovation`.
   `feasibility = 0.40·model + 0.30·scope + 0.30·structure`.

**Different cases**

- **Strong proposal** — covers all 8 sections, 500–3000 words, scores 75+ overall (verified live: a fully-structured proposal scored 82/100).
- **Weak proposal** — short or generic content, < 100 words, scores under 40 (verified: a single-paragraph proposal scored 52 then 30s after content shortening).
- **No proposal yet** — empty-state card with link to Proposal Workspace.
- **Re-analyze** — keeps history; the latest analysis is shown on the page.
- **AI service down** — backend returns 503; UI shows a clear retry banner. No all-zero rows are saved.

---

## 8. Meetings

**中文说明：** 预约和导师的会议。学生看导师每周的空闲时段（类似 Calendly），选一个时间点提交会议申请。状态：已提议（PROPOSED）、已确认（CONFIRMED）、改约（RESCHEDULED）、已完成（COMPLETED）、已取消（CANCELLED）。可以选「线下」或「线上」，线上要附 Zoom／Teams 链接。学生和导师都可以发起会议。

Book meetings against the supervisor's weekly availability.

| Page | Purpose |
|---|---|
| `/student/meetings` | Upcoming + Past tabs |
| `/student/meetings/request` | Calendly-style slot picker |
| `/student/meetings/:id` | Detail + respond actions |

States: `PROPOSED`, `CONFIRMED`, `RESCHEDULED`, `COMPLETED`,
`CANCELLED`.

**Different cases**

- **In person** vs **Online** mode (online requires a meeting link).
- **Student-initiated** vs **Supervisor-initiated** — bidirectional flow; the responder can accept, decline or counter-reschedule.
- **Meeting link added later** — supervisor can PATCH `/link` after confirmation.

---

## 9. Meeting Logs

**中文说明：** 会议记录簿。这是 FCI 学院的硬性规定：FYP1 和 FYP2 每个阶段都要至少 6 份签字会议记录，不够 6 份就算不达标。学生开完会后填一份记录，先自己电子签名，再交给导师签。状态：草稿（DRAFT，能改）、已提交（SUBMITTED，等导师签）、双方都签了（SIGNED，锁定）。可以导出官方格式的 DOCX，FYP1 和 FYP2 用不同模板。仪表盘会显示「已签 X/6」进度。

FCI 6-log compliance feature. Logs are created per meeting and
digitally signed by both parties.

| Page | Purpose |
|---|---|
| `/student/meeting-logs` | List with phase filter (FYP1 / FYP2) and compliance counter |
| `/student/meeting-logs/create` | Create new log linked to a meeting |
| `/student/meeting-logs/:id` | Detail with student/supervisor signature pads |
| `/student/meeting-logs/:id/edit` | Edit draft only |
| `/student/meeting-logs/:id/export.docx` | DOCX download (signed if both parties signed) |

**Different cases**

- Phase: **FYP1** (uses `meeting-log-fyp1.docx` template) vs **FYP2** (`meeting-log-fyp2.docx`).
- States: `DRAFT` (editable), `SUBMITTED` (awaiting supervisor sign), `SIGNED` (both signed, locked), `LOCKED`.
- Compliance: dashboard widget shows `<n>/6`; minimum met when n ≥ 6.
- Bulk export: download all logs as a ZIP via the list page.

---

## 10. Documents

**中文说明：** 文件上传中心。按 FYP1 / FYP2 阶段分开管理，支持的类型：提案、中期报告、最终报告、答辩 PPT、源代码、其他。文件大小上限和允许的格式由管理员在「系统参数」里设。导师也会上传反馈文件，会和学生上传的混在同一个列表里，但有导师标签区分。

Per-phase document submission with type taxonomy.

Types: Proposal, Interim Report, Final Report, Presentation Slides,
Source Code, Other.

| Page | Purpose |
|---|---|
| `/student/documents` | List with phase filter |
| `/student/documents/upload` | Upload form with type + phase selector |
| `/student/documents/:id` | Detail with download |

**Different cases**

- File size cap and allowed MIME types come from System Parameters.
- Supervisor uploads feedback files that appear in the same list (badged as supervisor source).

---

## 11. Announcements

**中文说明：** 公告列表（只能看，不能发）。后台会根据学生现在所处的阶段（FYP1／FYP2）、所读专业、是不是特定学生名单，自动过滤出该看到的公告。公告来源分三种：来自导师、来自委员会、来自管理员，每张卡片右上角有标签区分。

Read-only list of announcements scoped to the current student.

Audience filter (in `AnnouncementService.listForStudent`) layers:
- Cycle type (FYP1 vs FYP2)
- Programme code
- `SPECIFIC_STUDENTS` recipient list

**Different cases**

- **ALL audience** — every active student sees it.
- **Programme** — only students in the matching programme.
- **SPECIFIC_STUDENTS** — only listed recipient IDs.
- **From supervisor** vs **From committee** vs **From admin** — source badge on each card.

---

## 12. Deadline Calendar

**中文说明：** 截止日期日历，把所有跟这位学生有关的截止日期（提案截止、中期审查、最终提交、答辩等）都列出来。只能看，不能改。

Read-only calendar of all deadlines that apply to this student
(cycle-wide and programme-scoped).

---

## 13. Resources Hub

**中文说明：** 资源中心，相当于一个常用资料的快捷入口：FCI 学生手册、常见问题、官方模板、下载链接。内容是从系统参数表读出来的，管理员能改。

Static page with handbook links, FAQ, templates and download
shortcuts. Content driven by `system_parameter` rows.

---

## 14. AI Chatbot

**中文说明：** AI 智能问答机器人。学生可以问"什么时候交提案？""怎么换导师？""会议记录少了怎么办？"之类的问题。它不是瞎答——后台用 FAISS 把 FCI 手册和精选 FAQ 切成片段做了向量索引，先检索相关段落，再交给大模型（Groq Llama 3.3 70B 或 OpenAI）生成回答，所以答案有出处。问到范围外的问题会礼貌地说不知道，不会乱编。

Retrieval-augmented chatbot on `ai-chatbot:5003`. FAISS index over the
FCI handbook + curated FAQ; remote LLM (Groq or OpenAI) for
generation.

**Model and indexed data**

- Retrieval embedder: BGE-base (same family as the recommender).
- Generation model: remote LLM, provider-resolved in the order
  `LLM_API_KEY → GROQ_API_KEY → OPENAI_API_KEY`. Defaults are
  Groq's Llama 3.3 70B Versatile or OpenAI's GPT-3.5-Turbo. A local
  Flan-T5 generator is available as an opt-in fallback.
- Indexed corpus (knowledge base): the FCI FYP handbook (broken into
  chunks of ~500 tokens with overlap), plus a curated list of
  frequently asked questions covering deadlines, supervisor pairing,
  meeting log compliance, and submission rules. The index is rebuilt
  with `python build_knowledge_base.py` whenever the handbook changes.
- FAISS index file persists in the `chatbot_vector_store` Docker
  named volume, so retraining or restarting the container does not
  lose the index.

**Different cases**

- **Question grounded in handbook** — returns answer with cited chunk.
- **Out-of-scope question** — returns a polite fallback rather than guessing.
- **AI service down** — UI shows graceful offline message.

---

## 15. Notification Centre

**中文说明：** 通知中心，类似邮箱收件箱。系统里发生的事情都会推到这里：会议被确认、记录被签字、截止日期快到了、学期结束、导师回复申请等等。顶部导航栏会有未读数量的红点。

Inbox of system notifications (meeting confirmed, log signed,
deadline soon, cycle completed, supervisor reply, …) with unread
count badge in the top bar.

---

## 16. Feature Gates (Cross-Cutting)

**中文说明：** 功能锁（跨页面机制）。系统会根据学生当前的状态自动锁住某些功能，避免乱操作。一共有三种锁：① 还没配对到导师时，会议、记录、文档都灰掉 ② 已经注册成功（REGISTERED）或学期结束后，找导师和 AI 推荐功能锁掉 ③ 学期完结后（COMPLETED/ARCHIVED），所有写操作（开会议、写记录、上传）锁住，但读取还能用。被锁住时不会偷偷跳转，而是显示一个明确的"功能锁定"页面，告诉学生为什么被锁。

Three orthogonal gates sit on top of `<ProtectedRoute>`:

| Gate | Locks when |
|---|---|
| `StudentFeatureGate` | Student is not yet paired |
| `RegisteredOnlyLockGate` | Student is `REGISTERED` or cycle has ended |
| `CycleActiveGate` | Cycle is `COMPLETED` or `ARCHIVED` |

All three render `LockedFeaturePage` parameterised by reason
(`AWAITING_SUPERVISOR`, `ALREADY_REGISTERED`, `CYCLE_ENDED`) — never
a silent redirect.
