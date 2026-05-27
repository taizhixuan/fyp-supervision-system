# Seed a fresh end-to-end registration demo: 3 students go all the way to
# status = REGISTERED, then the supervisor schedules a meeting per student
# and publishes one announcement scoped to the supervisees.
#
# Walks the real flow through the live REST API:
#   1. Admin login + roster upload (1 supervisor, 3 students)
#   2. Register supervisor + fill profile
#   3. Register students + fill profiles
#   4. Each student sends supervision request to Dr. Liew
#   5. Dr. Liew accepts each request (Project rows created)
#   6. Each student creates + submits proposal
#   7. Dr. Liew approves each proposal       -> status PROPOSAL APPROVED
#   8. Committee approves each proposal       -> belt-and-braces audit row
#   9. Dr. Liew schedules a kickoff meeting per supervisee
#  10. Dr. Liew publishes an announcement scoped to specific students
#
# All three students end at status REGISTERED.

$ErrorActionPreference = 'Stop'
$BaseUrl = 'http://localhost:8080/api'
$AdminEmail = 'admin@mmu.edu.my'
$AdminPwd = 'Admin@123'
$CommitteeEmail = 'ahmad.razak@mmu.edu.my'
$CommitteePwd = 'Test@123'
$Pwd = 'Test@123'

# ---- Cast (disjoint from the analyzer-demo accounts) ------------------------

$Supervisor = @{
    mmuId='2010002001'; email='liew.cheehong@mmu.edu.my';
    fullName='Dr. Liew Chee Hong'; phone='012-4001001';
    department='Software Engineering'; position='Senior Lecturer'; quota=8;
    researchAreas=@('Cloud Computing','Microservices','DevOps','Distributed Systems','API Design');
    expertise=@('Kubernetes','Docker','Terraform','Spring Boot','Node.js','Python','PostgreSQL');
    bio='Senior lecturer working on cloud-native architectures and platform engineering. Welcomes FYP projects that ship a production-grade system with observability built in.';
    office='FCI Block A, Room 3.24';
}

$Students = @(
    @{
        idx=1; mmuId='1241300001'; email='jason.chen@student.mmu.edu.my';
        fullName='Jason Chen Wei Jun'; phone='011-2600001';
        spec='Software Engineering'; intake=2024;
        bio='Backend engineer keen on observability and developer tooling. Built a small log-aggregator side project in Go.';
        researchInterests=@('Cloud Computing','Microservices','DevOps','Observability');
        skills=@('Java','Spring Boot','Docker','Kubernetes','PostgreSQL','Git','Linux');
        cgpa='3.62';
        proposalTitle='Self-Healing Microservice Mesh for Student Lab Workloads';
    },
    @{
        idx=2; mmuId='1241300002'; email='aliya.fatimah@student.mmu.edu.my';
        fullName='Aliya binti Fatimah'; phone='011-2600002';
        spec='Software Engineering'; intake=2024;
        bio='Full-stack developer with interest in API design and serverless deployments. Past internship at a fintech startup.';
        researchInterests=@('API Design','Serverless Computing','Cloud Computing','Web Development');
        skills=@('Python','FastAPI','Node.js','AWS Lambda','Docker','MySQL','React');
        cgpa='3.45';
        proposalTitle='Serverless API Gateway with Adaptive Rate Limiting for Public Sector Services';
    },
    @{
        idx=3; mmuId='1241300003'; email='kai.zhang@student.mmu.edu.my';
        fullName='Kai Zhang'; phone='011-2600003';
        spec='Software Engineering'; intake=2024;
        bio='Distributed systems enthusiast. Interested in Raft, CRDTs, and high-availability deployments.';
        researchInterests=@('Distributed Systems','Cloud Computing','Database Systems','High Availability');
        skills=@('Go','Rust','Kubernetes','etcd','PostgreSQL','Prometheus','Grafana');
        cgpa='3.70';
        proposalTitle='CRDT-Backed Multi-Region Storage Layer for Real-Time Collaborative Editing';
    }
)

# ---- Proposal content (concise but complete — all 8 sections present) -------

function New-ProposalContent {
    param([hashtable] $S)
    @{
        title = $S.proposalTitle
        problemStatement = "Current $($S.spec.ToLower()) deployments in the MMU FCI sandbox suffer from manual failure handling and ad-hoc deployment workflows. Empirical observation over the previous trimester recorded an average of 42 minutes of unplanned downtime per week per service, of which 31 minutes was diagnostic delay. This project addresses the gap by building $($S.proposalTitle.ToLower())."
        objectives = @(
            "To design a working prototype of $($S.proposalTitle.ToLower()).",
            "To benchmark the prototype against the existing manual baseline on three measurable dimensions (recovery time, throughput, operator overhead).",
            "To produce a reusable reference architecture documented as an open-source artifact.",
            "To run an empirical study on the MMU FCI lab cluster with at least 20 simulated failure scenarios."
        )
        methodology = "The project follows a design-science methodology with three iterations of build / evaluate / refine. Prior work in this area includes the seminal contributions of Burns and Beda (2018) on container orchestration patterns, and the state of the art is the work of Verma et al. (2022) on programmable control planes. The previous research leaves a clear gap on adaptive policies under MMU lab constraints. The agent will be implemented as a sidecar deployed alongside the workload, with the control plane running on a single CPU-only node (FCI lab has no GPUs). Testing will include load tests with k6, fault injection with Chaos Mesh, and a final empirical study comparing the prototype against the manual baseline on the three dimensions stated in objective 2. A novel contribution over the related works is the explicit cost-of-downtime metric incorporated into the policy."
        scope = "In scope: one workload class (HTTP REST services running on Kubernetes 1.30+), one cluster (the MMU FCI sandbox configured to mirror production topology), simulated traffic from k6, and twenty fault-injection scenarios sampled from the Chaos Mesh catalog. Out of scope: multi-cluster federation, stateful workload migration, GPU-bound workloads. Constraints: must run on a single CPU-only node, the empirical study must complete within one trimester, and the artifact must be open-sourced under the MIT licence to be consumable by other FYP cohorts."
        expectedOutcomes = @(
            "A working open-source prototype published to GitHub under the MIT licence.",
            "An empirical results report with quantitative comparison against the manual baseline.",
            "A reusable architecture diagram + README that future FYP cohorts can extend.",
            "A short conference paper drafted from the results for submission to a regional venue."
        )
        timeline = "Trimester 1 weeks 1-4: literature review and ethical clearance. Trimester 1 weeks 5-8: prototype design and initial implementation. Trimester 1 weeks 9-12: integration with the MMU FCI sandbox and baseline measurement. Trimester 1 weeks 13-14: FYP1 report and proposal defence. Trimester 2 weeks 1-4: empirical study setup. Trimester 2 weeks 5-10: data collection. Trimester 2 weeks 11-12: statistical analysis. Trimester 2 weeks 13-14: FYP2 report and viva preparation."
        specialisation = $S.spec
    }
}

# ---- Helpers ----------------------------------------------------------------

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
# 1. Admin login + roster pre-approval
# ============================================================================
Write-Host "`n[1] Admin login + roster pre-approval ..." -ForegroundColor Cyan
$adminToken = Login -Email $AdminEmail -Pwd $AdminPwd
Write-Host "    admin OK" -ForegroundColor Green

$supLines = @('mmuId,email,fullName,department,faculty,position')
$supLines += "$($Supervisor.mmuId),$($Supervisor.email),$($Supervisor.fullName),$($Supervisor.department),Faculty of Computing & Informatics,$($Supervisor.position)"
Upload-Roster -RoleKind 'supervisors' -Lines $supLines -Token $adminToken

$stuLines = @('mmuId,email,fullName,programme,specialisation,faculty,intakeYear')
foreach ($s in $Students) {
    $stuLines += "$($s.mmuId),$($s.email),$($s.fullName),,$($s.spec),,$($s.intake)"
}
Upload-Roster -RoleKind 'students' -Lines $stuLines -Token $adminToken

# ============================================================================
# 2. Register supervisor + fill profile
# ============================================================================
Write-Host "`n[2] Register supervisor + fill profile ..." -ForegroundColor Cyan
$r = Try-Register @{
    role='SUPERVISOR'; fullName=$Supervisor.fullName; mmuId=$Supervisor.mmuId;
    email=$Supervisor.email; phone=$Supervisor.phone; password=$Pwd;
    acceptedPrivacyNotice=$true; privacyNoticeVersion='1.0'
}
Write-Host "    sup $($Supervisor.email) -> $r" -ForegroundColor DarkCyan
$supToken = Login -Email $Supervisor.email -Pwd $Pwd
Invoke-Api -Method PUT -Path '/supervisor/profile' -Token $supToken -Body @{
    department=$Supervisor.department; faculty='Faculty of Computing & Informatics';
    position=$Supervisor.position; researchAreas=$Supervisor.researchAreas;
    expertise=$Supervisor.expertise; bio=$Supervisor.bio;
    officeLocation=$Supervisor.office; officeHours='Mon-Fri 14:00-16:00 (by appointment)';
    maxSupervisionQuota=$Supervisor.quota; isAcceptingStudents=$true;
    preferredProjectTypes=@('Application-Based','Research-Based')
} | Out-Null
Write-Host "    supervisor profile filled (areas=$($Supervisor.researchAreas.Count), expertise=$($Supervisor.expertise.Count))" -ForegroundColor Green

# Look up Dr. Liew's userId once
$supList = Invoke-Api -Method GET -Path '/admin/users?role=SUPERVISOR&size=50' -Token $adminToken
$supUser = $supList.users | Where-Object { $_.email -eq $Supervisor.email } | Select-Object -First 1
if (-not $supUser) { throw "Supervisor $($Supervisor.email) not found after registration." }
$supUserId = [int64]$supUser.userId

# ============================================================================
# 3. Register students + fill profiles
# ============================================================================
Write-Host "`n[3] Register students + fill profiles ..." -ForegroundColor Cyan
$stuTokens = @{}
foreach ($s in $Students) {
    $r = Try-Register @{
        role='STUDENT'; fullName=$s.fullName; mmuId=$s.mmuId; email=$s.email;
        phone=$s.phone; password=$Pwd; specialisation=$s.spec; intakeYear=$s.intake;
        acceptedPrivacyNotice=$true; privacyNoticeVersion='1.0'
    }
    Write-Host "    stu $($s.email) -> $r" -ForegroundColor DarkCyan
    $tok = Login -Email $s.email -Pwd $Pwd
    $stuTokens[$s.email] = $tok
    Invoke-Api -Method PUT -Path '/student/profile' -Token $tok -Body @{
        bio=$s.bio; skills=$s.skills; researchInterests=$s.researchInterests;
        cgpa=$s.cgpa; expectedGraduation='2026-08';
        specialisation=$s.spec; intakeYear=$s.intake; phone=$s.phone
    } | Out-Null
    Write-Host "        profile filled (interests=$($s.researchInterests.Count), skills=$($s.skills.Count), cgpa=$($s.cgpa))" -ForegroundColor Green
}

# ============================================================================
# 4. Supervision request -> Dr. Liew accepts
# ============================================================================
Write-Host "`n[4] Supervision request -> Dr. Liew accepts ..." -ForegroundColor Cyan
foreach ($s in $Students) {
    $stuTok = $stuTokens[$s.email]
    try {
        Invoke-Api -Method POST -Path '/student/supervision-requests' -Token $stuTok -Body @{
            supervisorId=$supUserId; proposedTitle=$s.proposalTitle;
            topicDescription="Topic alignment with $($Supervisor.fullName)'s research in cloud / microservices / distributed systems.";
            message="Hello $($Supervisor.fullName), I would like to be supervised by you for my FYP1."
        } | Out-Null
        Write-Host "    [#$($s.idx)] request sent" -ForegroundColor DarkCyan
    } catch {
        if (-not ($_.Exception.Message -match 'already')) { throw }
        Write-Host "    [#$($s.idx)] request already exists" -ForegroundColor DarkGray
    }
    $list = Invoke-Api -Method GET -Path '/student/supervision-requests' -Token $stuTok
    $match = $list.requests | Where-Object { $_.status -eq 'PENDING' -and ([int64]$_.supervisor.userId -eq $supUserId) } | Select-Object -First 1
    if (-not $match) {
        Write-Host "    [#$($s.idx)] no PENDING request -> skip accept" -ForegroundColor DarkGray
        continue
    }
    $rid = [int64]$match.requestId
    Invoke-Api -Method POST -Path "/supervisor/requests/$rid/respond" -Token $supToken -Body @{
        action='ACCEPT'; responseMessage='Welcome. Looking forward to our first meeting next week.'
    } | Out-Null
    Write-Host "    [#$($s.idx)] request #$rid ACCEPTED" -ForegroundColor Green
}

# ============================================================================
# 5. Create + submit proposals
# ============================================================================
Write-Host "`n[5] Create + submit proposals ..." -ForegroundColor Cyan
foreach ($s in $Students) {
    $tok = $stuTokens[$s.email]
    $p = New-ProposalContent -S $s
    try {
        Invoke-Api -Method POST -Path '/student/proposal' -Token $tok -Body $p | Out-Null
        Write-Host "    [#$($s.idx)] proposal created" -ForegroundColor DarkCyan
    } catch {
        # POST returns 400 for "You already have a proposal" — fall back to PUT.
        try {
            Invoke-Api -Method PUT -Path '/student/proposal' -Token $tok -Body $p | Out-Null
            Write-Host "    [#$($s.idx)] proposal updated (already existed)" -ForegroundColor DarkGray
        } catch {
            throw "proposal write failed for #$($s.idx): $($_.Exception.Message)"
        }
    }
    try {
        Invoke-Api -Method POST -Path '/student/proposal/submit' -Token $tok | Out-Null
        Write-Host "    [#$($s.idx)] proposal SUBMITTED" -ForegroundColor Green
    } catch {
        Write-Host "    [#$($s.idx)] submit skipped (already submitted or non-DRAFT)" -ForegroundColor DarkGray
    }
}

# ============================================================================
# 6. Supervisor approves each proposal
# ============================================================================
Write-Host "`n[6] Supervisor approves each proposal ..." -ForegroundColor Cyan
$proposalsResp = Invoke-Api -Method GET -Path '/supervisor/proposals' -Token $supToken
$studentNames = $Students | ForEach-Object { $_.fullName }
foreach ($p in $proposalsResp.proposals) {
    $stuName = $p.studentName
    if ($studentNames -notcontains $stuName) { continue }
    $propId = [int64]$p.proposalId
    Invoke-Api -Method POST -Path "/supervisor/proposals/$propId/feedback" -Token $supToken -Body @{
        feedbackType='APPROVED'
        content='Proposal is well-scoped with a clear empirical study plan. Approved. Please start the kickoff meeting preparation.'
    } | Out-Null
    Write-Host "    proposal #$propId ($stuName) APPROVED by supervisor" -ForegroundColor Green
}

# ============================================================================
# 7. Committee adds a second-level review (audit / oversight)
# ============================================================================
Write-Host "`n[7] Committee adds oversight review ..." -ForegroundColor Cyan
try {
    $commToken = Login -Email $CommitteeEmail -Pwd $CommitteePwd
    $commProposals = Invoke-Api -Method GET -Path '/committee/proposals' -Token $commToken
    foreach ($p in $commProposals.proposals) {
        $stuName = $p.studentName
        if ($studentNames -notcontains $stuName) { continue }
        $propId = [int64]$p.proposalId
        Invoke-Api -Method POST -Path "/committee/proposals/$propId/review" -Token $commToken -Body @{
            decision='APPROVED'
            feedback='Committee oversight review: scope, methodology, and timeline are appropriate. Approved.'
            internalNotes='Cohort 2024 — cloud-native cluster (Dr. Liew supervision pool).'
        } | Out-Null
        Write-Host "    proposal #$propId ($stuName) APPROVED by committee" -ForegroundColor Green
    }
} catch {
    Write-Host "    !! committee step skipped: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================================================
# 8. Supervisor schedules a kickoff meeting per student
# ============================================================================
Write-Host "`n[8] Supervisor schedules kickoff meetings ..." -ForegroundColor Cyan
$superviseesResp = Invoke-Api -Method GET -Path '/supervisor/supervisees' -Token $supToken
$base = (Get-Date).Date.AddDays(7).AddHours(14)  # next week, 2pm
$studentEmails = $Students | ForEach-Object { $_.email }
$studentUserIds = @()
foreach ($svee in $superviseesResp.supervisees) {
    $stuEmail = $svee.email
    if ($studentEmails -notcontains $stuEmail) { continue }
    $matched = $Students | Where-Object { $_.email -eq $stuEmail } | Select-Object -First 1
    $idx = $matched.idx
    $superviseeId = [int64]$svee.superviseeId
    $studentUserIds += [int64]$svee.userId
    $when = $base.AddDays($idx - 1).ToString('yyyy-MM-ddTHH:mm:00')
    $meeting = Invoke-Api -Method POST -Path '/supervisor/meetings' -Token $supToken -Body @{
        studentId = $superviseeId
        title = "Kickoff: $($svee.projectTitle)"
        proposedDateTime = $when
        duration = 60
        type = 'IN_PERSON'
        location = "$($Supervisor.office)"
        agenda = "1. Walk through the approved proposal.`n2. Agree on weekly cadence and communication channel.`n3. Identify week 1-4 deliverables.`n4. Risks and dependencies."
    }
    Write-Host "    meeting #$($meeting.meetingId) scheduled for $stuEmail at $when ($($meeting.status))" -ForegroundColor Green
}

# ============================================================================
# 9. Supervisor publishes one announcement scoped to the 3 students
# ============================================================================
Write-Host "`n[9] Supervisor publishes announcement (SPECIFIC_STUDENTS scope) ..." -ForegroundColor Cyan
$annPayload = @{
    title = 'Welcome — Kickoff Week Agenda + Reading List'
    content = "Hello all,`n`nCongratulations on getting your proposals approved. Below is the agenda and reading list for our kickoff meetings next week.`n`n1. Read the project README under the GitHub starter repo (link below).`n2. Prepare a 5-minute walkthrough of your problem statement.`n3. Bring laptop with Docker installed — we will run a dry-run of the dev container together.`n4. Pre-read: Kelsey Hightower's `"Kubernetes the Hard Way`" Sections 1-3.`n`nLooking forward to seeing all three of you in person.`n`nRegards,`n$($Supervisor.fullName)"
    scope = 'SPECIFIC_STUDENTS'
    priority = 'HIGH'
    targetStudentIds = @($studentUserIds)
}
$annData = $annPayload | ConvertTo-Json -Depth 10 -Compress
$tmpJson = Join-Path $env:TEMP "ann_$(Get-Random).json"
Set-Content -Path $tmpJson -Value $annData -Encoding UTF8
try {
    # curl --form on Windows PowerShell sometimes hangs the multipart upload; use python requests.
    # Encode the payload + token via env so quoting doesn't bite.
    $env:ANN_TOKEN = $supToken
    $env:ANN_DATA  = $annData
    $env:ANN_URL   = "$BaseUrl/supervisor/announcements"
    $pyOut = python -c @"
import os, requests
r = requests.post(
    os.environ['ANN_URL'],
    headers={'Authorization': 'Bearer ' + os.environ['ANN_TOKEN']},
    files={'data': ('data.json', os.environ['ANN_DATA'], 'application/json')},
    timeout=30)
print(r.status_code)
print(r.text)
"@
    $lines = $pyOut -split "`n"
    $status = $lines[0].Trim()
    $body = ($lines | Select-Object -Skip 1) -join "`n"
    Remove-Item Env:\ANN_TOKEN, Env:\ANN_DATA, Env:\ANN_URL -ErrorAction SilentlyContinue
    if ($status -ne '200') {
        Write-Host "    !! announcement HTTP $status -- body: $body" -ForegroundColor Red
    } else {
        $annResp = $body | ConvertFrom-Json
        $annId = if ($annResp.announcementId) { $annResp.announcementId } else { $annResp.id }
        Write-Host "    announcement #$annId PUBLISHED (scope=$($annResp.scope), priority=$($annResp.priority), targets=$($studentUserIds.Count))" -ForegroundColor Green
    }
} finally { Remove-Item $tmpJson -ErrorAction SilentlyContinue }

# ============================================================================
# 10. Final status check
# ============================================================================
Write-Host "`n[10] Final registration status per student ..." -ForegroundColor Cyan
foreach ($s in $Students) {
    $tok = $stuTokens[$s.email]
    $dash = Invoke-Api -Method GET -Path '/student/dashboard' -Token $tok
    $reg = $dash.registrationStatus
    Write-Host ("    [#{0}] {1,-32} status={2,-18} supervisor={3}" -f `
        $s.idx, $s.email, $reg.status, $reg.supervisor.fullName) -ForegroundColor White
}

Write-Host "`nDone." -ForegroundColor Cyan
Write-Host "Credentials: $Pwd for all 4 new accounts." -ForegroundColor Cyan
Write-Host "Supervisor: $($Supervisor.email)" -ForegroundColor Cyan
foreach ($s in $Students) { Write-Host "Student:    $($s.email)" -ForegroundColor Cyan }
