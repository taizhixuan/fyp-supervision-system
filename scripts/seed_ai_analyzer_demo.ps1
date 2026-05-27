# Seed the AI Analyzer demo end-to-end through the live REST API:
#   1. Admin login + roster upload (3 supervisors, 3 students)
#   2. Register supervisors + fill profiles (research areas, expertise, bio)
#   3. Register students + fill profiles (skills, research interests, bio, cgpa)
#   4. Each student sends a supervision request to Dr. Tan Wei Ming
#   5. Dr. Tan accepts each request (creates Project rows -> unlocks proposal)
#   6. Each student creates a proposal with STRONG / MEDIUM / WEAK content
#   7. Each student calls /student/proposal/analyze
#   8. Dump the recommendation top-3 and analyser scores per student into JSON
#
# Backend must be live on http://localhost:8080, AI on :5001 + :5002.
# Idempotent on the register/profile path (skips existing rows). NOT idempotent
# on proposals — re-running will throw "You already have a proposal." Drop the
# proposal rows first or delete the test users.

$ErrorActionPreference = 'Stop'
$BaseUrl = 'http://localhost:8080/api'
$AdminEmail = 'admin@mmu.edu.my'
$AdminPwd = 'Admin@123'
$StuPwd = 'Test@123'
$SupPwd = 'Test@123'

# -------------------- Cast -----------------------------------------------------

$Supervisors = @(
    @{
        mmuId='2010001001'; email='tan.weiming@mmu.edu.my';
        fullName='Dr. Tan Wei Ming'; phone='012-3001001';
        department='Software Engineering'; position='Senior Lecturer'; quota=8;
        researchAreas=@('Machine Learning','Natural Language Processing','Software Architecture','Reinforcement Learning','Adaptive Systems');
        expertise=@('Python','TensorFlow','PyTorch','Java','REST APIs');
        bio='Applied machine learning researcher with a focus on text and code understanding. Welcomes FYP projects on practical NLP applications and adaptive learning systems.';
        office='FCI Block A, Room 3.21';
    },
    @{
        mmuId='2010001002'; email='lim.sookyee@mmu.edu.my';
        fullName='Dr. Lim Sook Yee'; phone='012-3001002';
        department='Data Science'; position='Lecturer'; quota=6;
        researchAreas=@('Data Mining','Big Data Analytics','Time Series Forecasting');
        expertise=@('R','Spark','Hadoop','SQL');
        bio='Scalable analytics pipelines and predictive modelling. Past supervisees have built fraud-detection and demand-forecasting systems.';
        office='FCI Block A, Room 3.07';
    },
    @{
        mmuId='2010001003'; email='rajan.subramaniam@mmu.edu.my';
        fullName='Prof. Rajan Subramaniam'; phone='012-3001003';
        department='Cybersecurity'; position='Professor'; quota=10;
        researchAreas=@('Network Security','Cryptography','Threat Intelligence');
        expertise=@('Penetration Testing','Wireshark','Snort','Burp Suite');
        bio='Heads the Cybersecurity cluster. Supervises projects in offensive security tooling, intrusion detection, and applied cryptography.';
        office='FCI Block B, Room 4.02';
    }
)

$Students = @(
    @{
        case='STRONG'; mmuId='1241200001'; email='sophia@student.mmu.edu.my';
        fullName='Sophia Tan Hui Min'; phone='011-2500001';
        spec='Software Engineering'; intake=2024;
        bio='Software engineering student keen on applied machine learning. Built two side projects: a Bayesian study-pace tracker and a Markov-chain text generator. Interested in personalised learning systems and the empirical evaluation of educational technology.';
        researchInterests=@('Reinforcement Learning','Adaptive Learning Systems','Educational Technology','Natural Language Processing','Software Architecture');
        skills=@('Python','TensorFlow','PyTorch','Java','Spring Boot','React','SQL','Git','Linux','Statistical Analysis');
        cgpa='3.78'; expectedGraduation='2026-08'; linkedin='https://www.linkedin.com/in/sophia-tan-demo'; github='https://github.com/sophia-tan-demo';
    },
    @{
        case='MEDIUM'; mmuId='1241200002'; email='cheryl.lim@student.mmu.edu.my';
        fullName='Cheryl Lim Yi Xuan'; phone='011-2500002';
        spec='Software Engineering'; intake=2024;
        bio='Full-stack developer with a cloud-native focus. Has built a small inventory app in Flutter + Flask. Interested in shipping a working mobile system for the FYP.';
        researchInterests=@('Mobile Development','Cloud Computing','Web Development','API Design');
        skills=@('Flutter','Python','Flask','JavaScript','HTML','CSS','MySQL','Git');
        cgpa='3.35'; expectedGraduation='2026-08'; linkedin=''; github='https://github.com/cheryl-lim-demo';
    },
    @{
        case='WEAK'; mmuId='1241200003'; email='aisyah.roslan@student.mmu.edu.my';
        fullName='Aisyah binti Roslan'; phone='011-2500003';
        spec='Software Engineering'; intake=2024;
        bio='Final year student, exploring web development for FYP.';
        researchInterests=@('Web Development');
        skills=@('HTML','CSS','JavaScript');
        cgpa='2.85'; expectedGraduation='2026-08'; linkedin=''; github='';
    }
)

# -------------------- Proposal content (STRONG / MEDIUM / WEAK) ----------------

$ProposalStrong = @{
    title = 'Adaptive Tutoring System Using Reinforcement Learning for Personalised Learning Paths'
    problemStatement = @'
Undergraduate students in computing programmes consistently report that the pace and ordering of topics in introductory courses do not match their individual prior knowledge. Empirical study at MMU FCI on the foundational Programming Fundamentals module showed that approximately 38 percent of students struggled with pointer arithmetic by week 4, while another 22 percent had already mastered the topic and reported boredom on the same week. A fixed curriculum cannot serve both populations.

Existing learning management systems such as Moodle and Google Classroom deliver the same content in the same order to every student, with no mechanism to adapt the next exercise based on observed performance. Commercial adaptive systems exist (Knewton, ALEKS) but are closed-source and cost prohibitively for a typical Malaysian public university. There is no open, locally-deployable adaptive tutoring system that can be integrated with the institutional Moodle through the LTI standard.

The problem is therefore twofold: first, the absence of a personalisation layer in the prevailing MMU learning stack; second, the absence of a research-grade evaluation that demonstrates whether reinforcement learning, in the published context of personalised tutoring, actually delivers a measurable learning gain over a fixed curriculum on a real undergraduate cohort.
'@
    objectives = @(
        'To design and implement a reinforcement learning agent that selects the next exercise for an individual learner based on observed response history.',
        'To integrate the agent with the MMU Moodle instance through the LTI 1.3 standard so that the system can be deployed without disrupting the existing courseware.',
        'To run an empirical study comparing learning gain (pre-test to post-test delta) of students using the adaptive system against a control group on a fixed curriculum.',
        'To produce an open-source reference implementation that other institutions can adopt and extend.'
    )
    methodology = @'
The project follows a design science methodology with three iterations of build, evaluate, refine.

Literature review. Prior work in adaptive tutoring spans three distinct strands. Knowledge-tracing models, beginning with the seminal Bayesian Knowledge Tracing of Corbett and Anderson (1995), estimate per-skill mastery from response sequences. The state of the art in this strand is Deep Knowledge Tracing (Piech et al., 2015) and its attention-based successor SAKT (Pandey and Karypis, 2019), which improved test accuracy by 9 percent on the ASSISTments benchmark. Reinforcement learning for curriculum sequencing is the more recent strand: Doroudi et al. (2019) proposed a contextual bandit formulation, while Bassen et al. (2020) presented a full Markov decision process treatment with offline policy evaluation. The third strand, related works on classroom deployment, is dominated by ALEKS and Knewton; these are commercial and their internal mechanics are not publicly documented. The previous research therefore leaves a clear gap: an open, MDP-based adaptive tutor that has been evaluated in a real undergraduate classroom rather than on a public benchmark dataset.

Agent design. The agent operates over a state vector composed of the learner''s estimated mastery on each of the twelve concepts in the Programming Fundamentals syllabus, the time of day, and the count of consecutive failures on the previous attempt. The action space is the set of exercises in the bank (approximately 240 items at full scale). The reward function is the post-attempt mastery gain on the targeted concept, computed from the BKT model running in parallel as the ground truth. Training uses Proximal Policy Optimisation on simulated learner trajectories generated from the previous cohort''s response log.

Integration. The agent runs as a Flask microservice. The Moodle integration is through an LTI 1.3 tool: when a student launches the adaptive exercise activity, Moodle posts a signed JWT to the tool, the tool consults the agent for the next exercise identifier, and the agent''s choice is rendered in the iframe. Student responses are written back to Moodle through the grade-passback service so the existing gradebook continues to work.

Empirical study. The novel contribution over the prior work is the empirical study: a within-subjects A-B comparison across two sections of TIT2123 Programming Fundamentals in trimester 2 of academic year 2025-2026, with random assignment, pre-test and post-test on identical items, and a Mann-Whitney U test for the learning-gain difference. Ethical clearance from the MMU Research Ethics Committee is the first deliverable.
'@
    scope = @'
In scope:
- Twelve concepts of the Programming Fundamentals syllabus (variables, conditionals, loops, functions, arrays, pointers, structs, recursion, dynamic memory, file IO, string manipulation, debugging).
- One exercise bank of 240 calibrated items contributed by the course coordinator.
- One Moodle instance (the MMU FCI sandbox, configured to mirror production).
- Two student cohorts of approximately 80 students each (control vs adaptive).

Out of scope:
- Other modules (TIT2143 Object-Oriented Programming, TDS2101 Data Structures). Future work, not this project.
- Other LMSes (Canvas, Blackboard). The LTI 1.3 standard makes them reachable but they are not part of this evaluation.
- Mobile-native delivery. The exercises run in the iframe on the laptop browser; mobile is left as future work.
- Privacy of response data beyond the existing MMU data-protection policy. Pseudonymous IDs only; no demographic data leaves the agent service.

Constraints:
- The empirical study must complete within one trimester, which limits the maximum number of policy refinement iterations to three.
- The agent service must run on a single CPU-only node (the FCI server has no GPUs) which constrains the policy network depth to two hidden layers of 64 units.
'@
    expectedOutcomes = @(
        'A working open-source adaptive tutoring agent (Python + Flask + Stable-Baselines3) released on GitHub under the MIT licence.',
        'A working LTI 1.3 integration with Moodle, deployed at https://moodle-sandbox.mmu.edu.my for the trial cohort.',
        'A trial dataset of approximately 160 student interaction logs collected over one trimester, anonymised and released alongside the code.',
        'An empirical results report comparing learning gain in the adaptive vs control cohorts, with statistical significance testing and effect-size calculation.',
        'A short conference paper drafted from the results for submission to ICCE 2026 (International Conference on Computers in Education).'
    )
    timeline = @'
Trimester 1 (weeks 1-4): Literature review and ethical clearance.
Trimester 1 (weeks 5-8): Agent design, simulated training, integration prototype.
Trimester 1 (weeks 9-12): LTI 1.3 integration, Moodle sandbox deployment.
Trimester 1 (weeks 13-14): FYP1 report and proposal defence.
Trimester 2 (weeks 1-4): Trial setup, ethics approval finalised, pre-test administered.
Trimester 2 (weeks 5-10): Live trial running, weekly policy refinement, mid-trial check-in.
Trimester 2 (weeks 11-12): Post-test administered, data collected, statistical analysis.
Trimester 2 (weeks 13-14): FYP2 report, viva preparation, paper draft.
'@
    specialisation = 'Software Engineering'
}

$ProposalMedium = @{
    title = 'QR-Based Attendance Tracking System for University Classrooms'
    problemStatement = @'
Lecturers in MMU FCI currently take attendance by passing a paper sheet around the lecture hall. The sheet is later typed into the eBwise portal manually by the lecturer or a teaching assistant. The process takes 10 to 15 minutes of class time per session and is prone to proxy attendance, where one student signs for an absent friend.

This project will replace the paper sheet with a QR code that is displayed on the projector at the start of class. Students scan the code with a mobile app to mark their attendance. The system will reduce administrative overhead and make proxy attendance harder.
'@
    objectives = @(
        'To build a mobile app (Flutter) that scans a QR code and submits attendance to a backend service.',
        'To build a web dashboard for lecturers to generate the per-session QR code and view the attendance list.',
        'To integrate with the MMU eBwise portal through a CSV export so the existing reporting workflow continues to work.',
        'To pilot the system in one section of TIT2143 Object-Oriented Programming over one trimester.'
    )
    methodology = @'
I will use Flutter to build the mobile app and Flask for the backend. The QR codes will be generated using the qrcode Python library, with a per-session secret rotated every five minutes so a screenshot of the code cannot be reused at the end of class.

I will use agile methodology with weekly sprints. Each sprint will produce a working increment: sprint 1 is the QR generator, sprint 2 is the scan-and-submit flow, sprint 3 is the lecturer dashboard, sprint 4 is the CSV export, sprint 5 is the pilot in one classroom.

The architecture is three-tier: a Flutter mobile app for students, a Flask REST API on the backend, and a MySQL database for storage. The system uses a REST API for the data exchange between mobile and server. A JWT issued at sign-in identifies the student on each scan request.

Testing will include unit tests on the backend API (target 70 percent line coverage) and manual testing on the mobile app on Android and iOS. The pilot will collect user feedback from both the lecturer and the students via a short questionnaire at the end of the trimester.
'@
    scope = @'
In scope: one classroom of approximately 40 students, one lecturer, one trimester, one course module (TIT2143). Android and iOS mobile app. Backend deployed on the FCI lab server. CSV export to eBwise.

Out of scope: face recognition, beacon or bluetooth-based attendance, real-time class size analytics, multi-campus deployment, geofencing.

Constraints: students must have a smartphone with a camera (assumed; all 40 students in the pilot section reported one in the pre-survey). The classroom must have a projector (all FCI lecture halls do).
'@
    expectedOutcomes = @(
        'A working Android and iOS mobile app for students to scan the QR code.',
        'A working web dashboard for lecturers to generate codes and view live attendance.',
        'A CSV export compatible with the eBwise upload format.',
        'A pilot report from the one-trimester deployment with lecturer and student feedback.'
    )
    timeline = @'
Trimester 1 weeks 1-4: backend API and database schema.
Trimester 1 weeks 5-8: mobile app sprint 1 and 2.
Trimester 1 weeks 9-12: lecturer dashboard and CSV export.
Trimester 1 weeks 13-14: FYP1 report.
Trimester 2 weeks 1-4: pilot deployment and bug fixes.
Trimester 2 weeks 5-10: pilot data collection.
Trimester 2 weeks 11-14: post-pilot survey, final report, viva.
'@
    specialisation = 'Software Engineering'
}

$ProposalWeak = @{
    title = 'A Simple Website for College'
    problemStatement = 'Many colleges in Malaysia do not have a good website. Students cannot find information easily. This project will build a website for the college.'
    objectives = @(
        'Build a website.',
        'Make it easy to use.',
        'Add login.'
    )
    methodology = 'I will use HTML and CSS and JavaScript to build the website. I will use Bootstrap. I will host it on free hosting. I will test it on Chrome.'
    scope = 'The website will have a home page and an about page and a contact page. It is for college students.'
    expectedOutcomes = @(
        'A working website.',
        'Students can find information.'
    )
    timeline = ''
    specialisation = 'Software Engineering'
}

$ProposalByCase = @{ 'STRONG'=$ProposalStrong; 'MEDIUM'=$ProposalMedium; 'WEAK'=$ProposalWeak }

# -------------------- Helpers --------------------------------------------------

function Invoke-Api {
    param([string] $Method, [string] $Path, $Body = $null, [string] $Token = $null)
    $h = @{}
    if ($Token) { $h['Authorization'] = "Bearer $Token" }
    $p = @{ Method=$Method; Uri="$BaseUrl$Path"; Headers=$h }
    if ($null -ne $Body) {
        $p['Body'] = ($Body | ConvertTo-Json -Depth 10)
        $p['ContentType'] = 'application/json'
    }
    return Invoke-RestMethod @p
}

function Login {
    param([string] $Email, [string] $Pwd)
    $r = Invoke-Api -Method POST -Path '/auth/login' -Body @{ identifier=$Email; password=$Pwd }
    return $r.accessToken
}

function Upload-Roster {
    param([string] $RoleKind, [string[]] $Lines, [string] $Token)
    $tmp = Join-Path $env:TEMP "roster_$(Get-Random).csv"
    Set-Content -Path $tmp -Value ($Lines -join "`n") -Encoding UTF8
    try {
        $resp = & curl.exe --silent --show-error `
            -X POST "$BaseUrl/admin/roster/$RoleKind/import" `
            -H "Authorization: Bearer $Token" `
            -F "file=@$tmp;type=text/csv"
        if ($LASTEXITCODE -ne 0) { throw "curl roster import failed: $resp" }
        $j = $resp | ConvertFrom-Json
        Write-Host "    $RoleKind roster: imported=$($j.imported) updated=$($j.updated) autoApproved=$($j.autoApproved) errors=$($j.errorCount)" -ForegroundColor Green
    } finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
}

function Try-Register {
    param($Body)
    try { Invoke-Api -Method POST -Path '/auth/register' -Body $Body | Out-Null; return 'registered' }
    catch {
        $body = ''
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
        } catch {}
        if ($body -match 'already' -or $body -match 'duplicate') { return 'existed' }
        throw "register failed: $($_.Exception.Message) $body"
    }
}

# ============================================================================
# 1. Admin login
# ============================================================================
Write-Host "`n[1] Admin login ..." -ForegroundColor Cyan
$adminToken = Login -Email $AdminEmail -Pwd $AdminPwd
Write-Host "    OK" -ForegroundColor Green

# ============================================================================
# 2. Roster upload (supervisors + students), so register auto-activates
# ============================================================================
Write-Host "`n[2] Roster upload ..." -ForegroundColor Cyan

$supRosterLines = @('mmuId,email,fullName,department,faculty,position')
foreach ($s in $Supervisors) {
    $supRosterLines += "$($s.mmuId),$($s.email),$($s.fullName),$($s.department),Faculty of Computing & Informatics,$($s.position)"
}
Upload-Roster -RoleKind 'supervisors' -Lines $supRosterLines -Token $adminToken

$stuRosterLines = @('mmuId,email,fullName,programme,specialisation,faculty,intakeYear')
foreach ($s in $Students) {
    $stuRosterLines += "$($s.mmuId),$($s.email),$($s.fullName),,$($s.spec),,$($s.intake)"
}
Upload-Roster -RoleKind 'students' -Lines $stuRosterLines -Token $adminToken

# ============================================================================
# 3. Register supervisors + fill profiles
# ============================================================================
Write-Host "`n[3] Registering supervisors + filling profiles ..." -ForegroundColor Cyan
foreach ($s in $Supervisors) {
    $r = Try-Register @{
        role='SUPERVISOR'; fullName=$s.fullName; mmuId=$s.mmuId;
        email=$s.email; phone=$s.phone; password=$SupPwd;
        acceptedPrivacyNotice=$true; privacyNoticeVersion='1.0'
    }
    Write-Host "    sup $($s.email) -> $r" -ForegroundColor DarkCyan
    $tok = Login -Email $s.email -Pwd $SupPwd
    Invoke-Api -Method PUT -Path '/supervisor/profile' -Token $tok -Body @{
        department=$s.department; faculty='Faculty of Computing & Informatics';
        position=$s.position; researchAreas=$s.researchAreas; expertise=$s.expertise;
        bio=$s.bio; officeLocation=$s.office; officeHours='Mon-Fri 14:00-16:00 (by appointment)';
        maxSupervisionQuota=$s.quota; isAcceptingStudents=$true;
        preferredProjectTypes=@('Application-Based','Research-Based')
    } | Out-Null
    Write-Host "        profile filled (areas=$($s.researchAreas.Count), expertise=$($s.expertise.Count))" -ForegroundColor Green
}

# ============================================================================
# 4. Register students + fill profiles
# ============================================================================
Write-Host "`n[4] Registering students + filling profiles ..." -ForegroundColor Cyan
foreach ($s in $Students) {
    $r = Try-Register @{
        role='STUDENT'; fullName=$s.fullName; mmuId=$s.mmuId; email=$s.email;
        phone=$s.phone; password=$StuPwd; specialisation=$s.spec; intakeYear=$s.intake;
        acceptedPrivacyNotice=$true; privacyNoticeVersion='1.0'
    }
    Write-Host "    stu $($s.email) [$($s.case)] -> $r" -ForegroundColor DarkCyan
    $tok = Login -Email $s.email -Pwd $StuPwd
    $update = @{
        bio=$s.bio; skills=$s.skills; researchInterests=$s.researchInterests;
        cgpa=$s.cgpa; expectedGraduation=$s.expectedGraduation;
        specialisation=$s.spec; intakeYear=$s.intake; phone=$s.phone
    }
    if ($s.linkedin) { $update['linkedinUrl'] = $s.linkedin }
    if ($s.github)   { $update['githubUrl']   = $s.github }
    Invoke-Api -Method PUT -Path '/student/profile' -Token $tok -Body $update | Out-Null
    Write-Host "        profile filled (interests=$($s.researchInterests.Count), skills=$($s.skills.Count), cgpa=$($s.cgpa))" -ForegroundColor Green
}

# ============================================================================
# 5. Capture top-3 supervisor recommendations per student
# ============================================================================
Write-Host "`n[5] Capturing AI recommendations per student ..." -ForegroundColor Cyan
$recCapture = @{}
foreach ($s in $Students) {
    $tok = Login -Email $s.email -Pwd $StuPwd
    try {
        $resp = Invoke-Api -Method GET -Path '/student/recommendations' -Token $tok
        $top3 = @($resp.recommendations | Select-Object -First 3)
        $recCapture[$s.case] = $top3
        Write-Host "    $($s.email): top match -> $($top3[0].supervisorName) score=$([math]::Round($top3[0].overallScore, 3))" -ForegroundColor Green
    } catch {
        Write-Host "    $($s.email): recommendation call failed: $($_.Exception.Message)" -ForegroundColor Yellow
        $recCapture[$s.case] = @()
    }
}

# ============================================================================
# 6. Each student sends a supervision request to Dr. Tan; Dr. Tan accepts
# ============================================================================
Write-Host "`n[6] Supervisor requests -> all 3 students pair with Dr. Tan Wei Ming ..." -ForegroundColor Cyan
$tanList = Invoke-Api -Method GET -Path '/admin/users?role=SUPERVISOR&size=50' -Token $adminToken
$tanUser = $tanList.users | Where-Object { $_.email -eq 'tan.weiming@mmu.edu.my' } | Select-Object -First 1
if (-not $tanUser) { throw "Dr. Tan Wei Ming not found in admin user list." }
$tanUserId = [int64]$tanUser.userId
$tanToken = Login -Email 'tan.weiming@mmu.edu.my' -Pwd $SupPwd

foreach ($s in $Students) {
    $stuTok = Login -Email $s.email -Pwd $StuPwd
    $proposalTitle = $ProposalByCase[$s.case].title
    try {
        Invoke-Api -Method POST -Path '/student/supervision-requests' -Token $stuTok -Body @{
            supervisorId=$tanUserId; proposedTitle=$proposalTitle;
            topicDescription='Initial topic exploration aligned with Dr. Tan''s research interests.';
            message='Hello Dr. Tan, I would like to be supervised by you for my FYP1.'
        } | Out-Null
        Write-Host "    [$($s.case)] request sent" -ForegroundColor DarkCyan
    } catch {
        if (-not ($_.Exception.Message -match 'already')) { throw }
        Write-Host "    [$($s.case)] request already exists" -ForegroundColor DarkGray
    }
    # Find pending request id from student's outbox, then accept as Dr. Tan
    $list = Invoke-Api -Method GET -Path '/student/supervision-requests' -Token $stuTok
    $match = $list.requests | Where-Object { $_.status -eq 'PENDING' -and ([int64]$_.supervisor.userId -eq $tanUserId) } | Select-Object -First 1
    if (-not $match) {
        Write-Host "    [$($s.case)] no PENDING request found -> skip accept" -ForegroundColor DarkGray
        continue
    }
    $rid = [int64]$match.requestId
    Invoke-Api -Method POST -Path "/supervisor/requests/$rid/respond" -Token $tanToken -Body @{
        action='ACCEPT'; responseMessage='Welcome aboard. Looking forward to our first meeting.'
    } | Out-Null
    Write-Host "    [$($s.case)] request #$rid ACCEPTED" -ForegroundColor Green
}

# ============================================================================
# 7. Each student creates their proposal at the configured quality level
# ============================================================================
Write-Host "`n[7] Creating proposals (STRONG / MEDIUM / WEAK) ..." -ForegroundColor Cyan
foreach ($s in $Students) {
    $tok = Login -Email $s.email -Pwd $StuPwd
    $p = $ProposalByCase[$s.case]
    try {
        Invoke-Api -Method POST -Path '/student/proposal' -Token $tok -Body $p | Out-Null
        Write-Host "    [$($s.case)] proposal created: $($p.title)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -match 'already') {
            Write-Host "    [$($s.case)] proposal exists, updating instead" -ForegroundColor DarkGray
            Invoke-Api -Method PUT -Path '/student/proposal' -Token $tok -Body $p | Out-Null
        } else { throw }
    }
}

# ============================================================================
# 8. Run analyser, capture results
# ============================================================================
Write-Host "`n[8] Running /student/proposal/analyze for each student ..." -ForegroundColor Cyan
$analysisCapture = @{}
foreach ($s in $Students) {
    $tok = Login -Email $s.email -Pwd $StuPwd
    Write-Host "    [$($s.case)] analysing ... " -NoNewline -ForegroundColor DarkCyan
    $start = Get-Date
    $resp = Invoke-Api -Method POST -Path '/student/proposal/analyze' -Token $tok
    $elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 2)
    Write-Host "OK in ${elapsed}s -> overall=$($resp.overallScore)" -ForegroundColor Green
    $analysisCapture[$s.case] = $resp
}

# ============================================================================
# 9. Dump combined results to JSON for the doc step
# ============================================================================
$out = @{
    runAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssK')
    supervisor = @{
        email = 'tan.weiming@mmu.edu.my'
        fullName = 'Dr. Tan Wei Ming'
        researchAreas = $Supervisors[0].researchAreas
        expertise = $Supervisors[0].expertise
    }
    students = @{}
    recommendations = $recCapture
    analyses = $analysisCapture
}
foreach ($s in $Students) {
    $out.students[$s.case] = @{
        email = $s.email; fullName = $s.fullName; cgpa = $s.cgpa;
        researchInterests = $s.researchInterests; skills = $s.skills;
        proposalTitle = $ProposalByCase[$s.case].title
    }
}
$outPath = Join-Path $PSScriptRoot '..\docs-project\demo\ai-analyzer-demo-results.json'
$out | ConvertTo-Json -Depth 12 | Set-Content -Path $outPath -Encoding UTF8
Write-Host "`nResults dumped to: $outPath" -ForegroundColor Cyan
Write-Host "`nSummary:" -ForegroundColor Cyan
foreach ($s in $Students) {
    $a = $analysisCapture[$s.case]
    Write-Host ("    [{0,-6}] {1,-30} overall={2,3}  feas={3,3}  inno={4,3}  clar={5,3}  scope={6,3}" -f `
        $s.case, $s.email, $a.overallScore, $a.feasibilityScore, $a.innovationScore, $a.clarityScore, $a.scopeScore) -ForegroundColor White
}
Write-Host "`nDone." -ForegroundColor Cyan
