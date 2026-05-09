# Seed 8 students at varied stages of the FYP1 cycle, plus the meeting logs
# needed to populate the cycle-realism widgets (compliance, phase strip).
# All steps go through the live REST API.
#
# Distribution (intentionally varied so the dashboard widgets render meaningful state):
#   Student A — paired with Dr. Tan Wei Ming, 6 LOCKED logs   -> compliance MET (6/6)
#   Student B — paired with Dr. Lim Sook Yee,   3 LOCKED logs -> compliance NOT met (3/6)
#   Student C — paired with Dr. Wong Kar Wai,   1 DRAFT + 1 SUBMITTED log -> mid-flow
#   Student D — paired with Prof. Rajan,        0 logs        -> just paired
#   Student E — unpaired, has PENDING request to Dr. Chong Mei Ling
#   Student F — unpaired, has PENDING request to Dr. Nurul Izzati
#   Student G — unpaired, no requests
#   Student H — unpaired, no requests
#
# Idempotent-ish: roster import upserts; register skips if mmuId/email already
# exists (script just continues with the next step). Meeting log creation is NOT
# guarded — re-running will create duplicates. Drop the DB rows or run once.

$ErrorActionPreference = 'Stop'
$BaseUrl = 'http://localhost:8080/api'
$AdminEmail = 'admin@mmu.edu.my'
$AdminPassword = 'Admin@123'
$DefaultPwd = 'Test@123'

# 8 students with realistic intake + specialisation mix.
$Students = @(
    @{ tag='A'; mmuId='1201234001'; email='aisyah.roslan@student.mmu.edu.my';   fullName='Aisyah binti Roslan';     phone='011-2400001'; spec='Software Engineering'; intake=2022; bio='Backend engineer interested in distributed systems.';      },
    @{ tag='B'; mmuId='1201234002'; email='bryan.tay@student.mmu.edu.my';        fullName='Bryan Tay Jun Wei';       phone='011-2400002'; spec='Data Science';         intake=2022; bio='ML enthusiast keen on time-series forecasting.';            },
    @{ tag='C'; mmuId='1201234003'; email='cheryl.lim@student.mmu.edu.my';       fullName='Cheryl Lim Yi Xuan';      phone='011-2400003'; spec='Software Engineering'; intake=2022; bio='Full-stack developer with cloud-native focus.';            },
    @{ tag='D'; mmuId='1201234004'; email='danish.zaki@student.mmu.edu.my';      fullName='Danish Zaki bin Ariff';   phone='011-2400004'; spec='Cybersecurity';        intake=2022; bio='Aspiring security researcher (CTF player).';               },
    @{ tag='E'; mmuId='1201234005'; email='elaine.chong@student.mmu.edu.my';     fullName='Elaine Chong Hui Ling';   phone='011-2400005'; spec='Data Science';         intake=2023; bio='Visual analytics + healthcare data.';                       },
    @{ tag='F'; mmuId='1201234006'; email='farhan.iskandar@student.mmu.edu.my';  fullName='Farhan bin Iskandar';     phone='011-2400006'; spec='Information Systems';  intake=2023; bio='Enterprise systems and process automation.';                },
    @{ tag='G'; mmuId='1201234007'; email='grace.wong@student.mmu.edu.my';       fullName='Grace Wong Mei Yi';       phone='011-2400007'; spec='Game Development';     intake=2023; bio='Indie game designer learning Unity.';                      },
    @{ tag='H'; mmuId='1201234008'; email='hadi.amin@student.mmu.edu.my';        fullName='Hadi bin Amin';           phone='011-2400008'; spec='Software Engineering'; intake=2023; bio='Mobile dev hobbyist (Flutter, Kotlin).';                  }
)

# Pairing plan (state = paired) — student tag -> supervisor email
$PairWith = @{
    'A' = 'tan.weiming@mmu.edu.my'
    'B' = 'lim.sookyee@mmu.edu.my'
    'C' = 'wong.karwai@mmu.edu.my'
    'D' = 'rajan.subramaniam@mmu.edu.my'
}
# Pending requests (state = pending request, no acceptance)
$PendingRequestTo = @{
    'E' = 'chong.meiling@mmu.edu.my'
    'F' = 'nurul.izzati@mmu.edu.my'
}
# How many fully-LOCKED logs to seed per paired student
$LockedLogCount = @{
    'A' = 6
    'B' = 3
    'C' = 0   # C gets a special draft+submitted pair below
    'D' = 0
}

function Invoke-Api {
    param([string] $Method, [string] $Path, $Body = $null, [string] $Token = $null)
    $h = @{}
    if ($Token) { $h['Authorization'] = "Bearer $Token" }
    $params = @{ Method = $Method; Uri = "$BaseUrl$Path"; Headers = $h }
    if ($null -ne $Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
        $params['ContentType'] = 'application/json'
    }
    return Invoke-RestMethod @params
}

function Login {
    param([string] $Email, [string] $Pwd)
    $r = Invoke-Api -Method POST -Path '/auth/login' -Body @{ identifier = $Email; password = $Pwd }
    return $r.accessToken
}

function Try-RegisterStudent {
    param($s)
    try {
        Invoke-Api -Method POST -Path '/auth/register' -Body @{
            role          = 'STUDENT'
            fullName      = $s.fullName
            mmuId         = $s.mmuId
            email         = $s.email
            phone         = $s.phone
            password      = $DefaultPwd
            specialisation= $s.spec
            intakeYear    = $s.intake
        } | Out-Null
        return 'registered'
    } catch {
        $body = ''
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
        } catch {}
        if ($body -match 'already' -or $body -match 'duplicate') { return 'existed' }
        throw "register failed for $($s.email): $($_.Exception.Message) $body"
    }
}

function Get-SupervisorUserIdByEmail {
    param([string] $Email, [string] $AdminToken)
    $list = Invoke-Api -Method GET -Path "/admin/users?role=SUPERVISOR&size=50" -Token $AdminToken
    $u = $list.users | Where-Object { $_.email -eq $Email } | Select-Object -First 1
    if (-not $u) { throw "Supervisor not found by email: $Email" }
    return [int64]$u.userId
}

function Send-Request {
    param([string] $StudentToken, [int64] $SupervisorUserId, [string] $Title, [string] $Topic)
    return Invoke-Api -Method POST -Path '/student/supervision-requests' -Token $StudentToken -Body @{
        supervisorId      = $SupervisorUserId
        proposedTitle     = $Title
        topicDescription  = $Topic
        message           = 'Hi, I would like to be supervised by you for my FYP1.'
    }
}

function Accept-Request {
    param([string] $SupervisorToken, [int64] $RequestId)
    return Invoke-Api -Method POST -Path "/supervisor/requests/$RequestId/respond" -Token $SupervisorToken -Body @{
        action          = 'ACCEPT'
        responseMessage = 'Glad to supervise you. Look forward to our first meeting.'
    }
}

function Find-PendingRequestId {
    # Query the student's outgoing requests, return the first PENDING one.
    param([string] $StudentToken, [int64] $SupervisorUserId)
    $r = Invoke-Api -Method GET -Path '/student/supervision-requests' -Token $StudentToken
    $match = $r.requests | Where-Object { $_.status -eq 'PENDING' -and ([int64]$_.supervisor.userId -eq $SupervisorUserId) } | Select-Object -First 1
    if (-not $match) { return $null }
    return [int64]$match.requestId
}

function New-FullyLockedLog {
    param(
        [string] $StudentToken,
        [string] $SupervisorToken,
        [int]    $MeetingNumber,
        [string] $MeetingDateIso
    )
    # 1. Student creates the log (DRAFT)
    $log = Invoke-Api -Method POST -Path '/student/meeting-logs' -Token $StudentToken -Body @{
        meetingDate           = $MeetingDateIso
        meetingNumber         = $MeetingNumber
        meetingMode           = if ($MeetingNumber % 2 -eq 0) { 'PHYSICAL' } else { 'ONLINE' }
        fypPhase              = 'FYP1'
        tasks                 = @(
            @{ description = "Reviewed last week's deliverables"; done = $true },
            @{ description = "Aligned on next milestone"; done = $true }
        )
        workDoneDetails       = "Meeting #${MeetingNumber}: walked through implementation progress, demoed prototype, agreed on next steps. Discussed obstacles and prioritised tasks for the coming week."
        workToBeDone          = "Continue building feature; draft the next chapter section; prepare materials for next supervision."
        problemsAndSolutions  = "Encountered scoping ambiguity; resolved by narrowing the use case to the primary user persona."
    }
    $logId = [int64]$log.logId

    # 2. Student submits (DRAFT -> SUBMITTED)
    Invoke-Api -Method POST -Path "/student/meeting-logs/$logId/submit" -Token $StudentToken | Out-Null
    # 3. Supervisor signs (SUBMITTED -> SUPERVISOR_SIGNED)
    Invoke-Api -Method POST -Path "/supervisor/meeting-logs/$logId/sign" -Token $SupervisorToken -Body @{
        signatureImageDataUrl = ''
        signatureSha256       = ''
    } | Out-Null
    # 4. Student counter-signs (SUPERVISOR_SIGNED -> LOCKED)
    Invoke-Api -Method POST -Path "/student/meeting-logs/$logId/sign" -Token $StudentToken -Body @{
        signatureImageDataUrl = ''
        signatureSha256       = ''
    } | Out-Null
    return $logId
}

# ----- 1. Admin login + roster pre-approval ---------------------------------------------
Write-Host "[1/5] Admin login + student roster pre-approval ..." -ForegroundColor Cyan
$adminToken = Login -Email $AdminEmail -Pwd $AdminPassword

$csvLines = @('mmuId,email,fullName,programme,specialisation,faculty,intakeYear')
foreach ($s in $Students) {
    # programme/faculty left blank — backend derives from specialisation (AuthService helpers).
    $csvLines += "$($s.mmuId),$($s.email),$($s.fullName),,$($s.spec),,$($s.intake)"
}
$tmp = Join-Path $env:TEMP "student_roster_$(Get-Random).csv"
Set-Content -Path $tmp -Value ($csvLines -join "`n") -Encoding UTF8
try {
    $resp = & curl.exe --silent --show-error `
        -X POST "$BaseUrl/admin/roster/students/import" `
        -H "Authorization: Bearer $adminToken" `
        -F "file=@$tmp;type=text/csv"
    if ($LASTEXITCODE -ne 0) { throw "curl import failed: $resp" }
    $r = $resp | ConvertFrom-Json
    Write-Host "    imported=$($r.imported) updated=$($r.updated) autoApproved=$($r.autoApproved) errors=$($r.errorCount)" -ForegroundColor Green
} finally {
    Remove-Item $tmp -ErrorAction SilentlyContinue
}

# ----- 2. Self-registration -------------------------------------------------------------
Write-Host "`n[2/5] Self-registering 8 students ..." -ForegroundColor Cyan
foreach ($s in $Students) {
    $outcome = Try-RegisterStudent -s $s
    Write-Host "    [$($s.tag)] $($s.fullName) -> $outcome" -ForegroundColor Green
}

# Cache tokens for everyone we'll act as below.
$studentTokens = @{}
foreach ($s in $Students) { $studentTokens[$s.tag] = Login -Email $s.email -Pwd $DefaultPwd }
$supervisorTokens = @{}
foreach ($e in ($PairWith.Values + $PendingRequestTo.Values | Sort-Object -Unique)) {
    $supervisorTokens[$e] = Login -Email $e -Pwd $DefaultPwd
}

# ----- 3. Send + accept supervision requests --------------------------------------------
Write-Host "`n[3/5] Pairing supervisors (request + accept) ..." -ForegroundColor Cyan
foreach ($tag in $PairWith.Keys) {
    $stu = $Students | Where-Object { $_.tag -eq $tag } | Select-Object -First 1
    $supEmail = $PairWith[$tag]
    $supId = Get-SupervisorUserIdByEmail -Email $supEmail -AdminToken $adminToken
    $title = switch ($stu.spec) {
        'Software Engineering' { 'A Modern Web Platform for Final-Year Project Supervision' }
        'Data Science'         { 'Predictive Analytics Dashboard for Student Performance' }
        'Cybersecurity'        { 'Lightweight Intrusion Detection for Edge Devices' }
        'Information Systems'  { 'Workflow Digitisation for Faculty Administration' }
        'Game Development'     { 'Procedural Level Generator for 2D Platformers' }
        default                { 'Final Year Project' }
    }
    try {
        Send-Request -StudentToken $studentTokens[$tag] -SupervisorUserId $supId `
            -Title $title -Topic "Initial topic exploration aligned with $supEmail's research interests." | Out-Null
    } catch {
        if (-not ($_.Exception.Message -match 'already')) { throw }
    }
    $reqId = Find-PendingRequestId -StudentToken $studentTokens[$tag] -SupervisorUserId $supId
    if ($null -eq $reqId) {
        Write-Host "    [$tag] no PENDING request found (maybe already accepted on a prior run); skipping accept." -ForegroundColor DarkGray
        continue
    }
    Accept-Request -SupervisorToken $supervisorTokens[$supEmail] -RequestId $reqId | Out-Null
    Write-Host "    [$tag] $($stu.fullName) <-> $supEmail (request #$reqId ACCEPTED)" -ForegroundColor Green
}

# ----- 4. Pending-only requests ---------------------------------------------------------
Write-Host "`n[4/5] Sending PENDING (un-accepted) requests for E + F ..." -ForegroundColor Cyan
foreach ($tag in $PendingRequestTo.Keys) {
    $stu = $Students | Where-Object { $_.tag -eq $tag } | Select-Object -First 1
    $supEmail = $PendingRequestTo[$tag]
    $supId = Get-SupervisorUserIdByEmail -Email $supEmail -AdminToken $adminToken
    try {
        Send-Request -StudentToken $studentTokens[$tag] -SupervisorUserId $supId `
            -Title 'Tentative FYP topic — open to direction' -Topic 'Looking for guidance on a topic in your area.' | Out-Null
        Write-Host "    [$tag] $($stu.fullName) -> $supEmail (PENDING)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -match 'already') {
            Write-Host "    [$tag] PENDING request already exists; skipping." -ForegroundColor DarkGray
        } else { throw }
    }
}

# ----- 5. Meeting logs ------------------------------------------------------------------
Write-Host "`n[5/5] Seeding meeting logs ..." -ForegroundColor Cyan
foreach ($tag in $LockedLogCount.Keys) {
    $count = $LockedLogCount[$tag]
    if ($count -le 0) { continue }
    $stu = $Students | Where-Object { $_.tag -eq $tag } | Select-Object -First 1
    $supEmail = $PairWith[$tag]
    $stuTok = $studentTokens[$tag]
    $supTok = $supervisorTokens[$supEmail]
    $base = (Get-Date).AddDays(-7 * $count)
    for ($i = 1; $i -le $count; $i++) {
        $when = $base.AddDays(7 * ($i - 1)).ToString('yyyy-MM-dd')
        $logId = New-FullyLockedLog -StudentToken $stuTok -SupervisorToken $supTok -MeetingNumber $i -MeetingDateIso $when
        Write-Host "    [$tag] LOCKED log #$i (id=$logId, date=$when)" -ForegroundColor Green
    }
}

# Student C — special: 1 DRAFT + 1 SUBMITTED (mid-flow)
$cStu = $Students | Where-Object { $_.tag -eq 'C' } | Select-Object -First 1
$cTok = $studentTokens['C']
Write-Host "    [C] mid-flow logs (DRAFT + SUBMITTED) ..." -ForegroundColor Cyan
try {
    Invoke-Api -Method POST -Path '/student/meeting-logs' -Token $cTok -Body @{
        meetingDate          = (Get-Date).AddDays(-3).ToString('yyyy-MM-dd')
        meetingNumber        = 1
        meetingMode          = 'ONLINE'
        fypPhase             = 'FYP1'
        tasks                = @(@{ description='Drafting initial scope'; done=$true })
        workDoneDetails      = 'Discussed problem framing and dataset availability.'
        workToBeDone         = 'Sketch architecture diagram and shortlist tooling.'
        problemsAndSolutions = ''
    } | Out-Null
    Write-Host "      [C] DRAFT log created" -ForegroundColor Green
} catch { Write-Host "      [C] DRAFT failed: $($_.Exception.Message)" -ForegroundColor Red }
try {
    $log2 = Invoke-Api -Method POST -Path '/student/meeting-logs' -Token $cTok -Body @{
        meetingDate          = (Get-Date).AddDays(-10).ToString('yyyy-MM-dd')
        meetingNumber        = 2
        meetingMode          = 'PHYSICAL'
        fypPhase             = 'FYP1'
        tasks                = @(@{ description='Refined scope'; done=$true })
        workDoneDetails      = 'Reviewed prototype. Identified next steps for backend integration.'
        workToBeDone         = 'Wire up authentication; write Chapter 2 outline.'
        problemsAndSolutions = ''
    }
    Invoke-Api -Method POST -Path "/student/meeting-logs/$($log2.logId)/submit" -Token $cTok | Out-Null
    Write-Host "      [C] SUBMITTED log created (id=$($log2.logId))" -ForegroundColor Green
} catch { Write-Host "      [C] SUBMITTED failed: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`nDone. Login credentials: any seeded email / password '$DefaultPwd'." -ForegroundColor Cyan
