# Smoke-test the seeded supervisor + student flow against the live API.
# Hits the same endpoints the UI fetches on each page so any DTO/contract
# regressions surface here before they bite the browser.
#
# Pass criteria per call: HTTP 200 AND non-empty body AND no exception.
# Anything else prints in red and increments the failure counter.

$ErrorActionPreference = 'Continue'
$BaseUrl = 'http://localhost:8080/api'
$SupervisorPwd = 'Test@123'
$StudentPwd = 'Test@123'

$pass = 0; $fail = 0; $failures = @()

function Test-Get {
    param(
        [string] $Label,
        [string] $Path,
        [string] $Token,
        [scriptblock] $Assert = $null
    )
    try {
        $resp = Invoke-RestMethod -Method GET -Uri "$BaseUrl$Path" `
            -Headers @{ Authorization = "Bearer $Token" }
        $detail = ''
        if ($Assert) {
            $msg = & $Assert $resp
            if ($msg) { throw "assertion: $msg" }
            $detail = "  ($msg)"
        }
        Write-Host "  PASS $Label" -ForegroundColor Green
        $script:pass++
        return $resp
    } catch {
        $err = $_.Exception.Message
        $body = ''
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = ' ' + $reader.ReadToEnd().Substring(0, [Math]::Min(200, $reader.ReadToEnd().Length))
        } catch { }
        Write-Host "  FAIL $Label -> $err$body" -ForegroundColor Red
        $script:fail++
        $script:failures += "${Label}: $err"
        return $null
    }
}

function Login {
    param([string] $Email, [string] $Pwd)
    $resp = Invoke-RestMethod -Method POST -Uri "$BaseUrl/auth/login" `
        -ContentType 'application/json' `
        -Body (@{ identifier = $Email; password = $Pwd } | ConvertTo-Json)
    return $resp.accessToken
}

# ===== Supervisor side =====
Write-Host "`n=== Supervisor smoke (Dr. Tan Wei Ming) ===" -ForegroundColor Cyan
$supTok = Login -Email 'tan.weiming@mmu.edu.my' -Pwd $SupervisorPwd
if (-not $supTok) { Write-Host '  FAIL login' -ForegroundColor Red; exit 1 }

Test-Get '/auth/me'                       '/auth/me'                       $supTok { param($r) if ($r.role -ne 'SUPERVISOR') { return "role=$($r.role) expected SUPERVISOR" } }
$prof = Test-Get '/supervisor/profile'    '/supervisor/profile'            $supTok { param($r) if (-not $r.department) { return 'empty department' }; if (-not $r.researchAreas -or $r.researchAreas.Count -lt 1) { return 'empty researchAreas' }; if (-not $r.expertise -or $r.expertise.Count -lt 1) { return 'empty expertise' } }
Test-Get '/supervisor/dashboard'          '/supervisor/dashboard'          $supTok { param($r) if ($null -eq $r.totalSupervisees) { return 'no totalSupervisees field' } }
Test-Get '/supervisor/supervisees'        '/supervisor/supervisees'        $supTok { param($r) if ($null -eq $r.total) { return 'no total field' } }
Test-Get '/supervisor/supervisees?scope=past' '/supervisor/supervisees?scope=past' $supTok { param($r) if ($null -eq $r.total) { return 'no total field' } }
Test-Get '/supervisor/requests'           '/supervisor/requests'           $supTok
Test-Get '/supervisor/proposals'          '/supervisor/proposals'          $supTok
Test-Get '/supervisor/meetings'           '/supervisor/meetings'           $supTok
Test-Get '/supervisor/meeting-logs'       '/supervisor/meeting-logs'       $supTok
Test-Get '/supervisor/documents'          '/supervisor/documents'          $supTok
Test-Get '/supervisor/announcements'      '/supervisor/announcements'      $supTok
Test-Get '/notifications'                 '/notifications'                 $supTok
Test-Get '/announcements (filtered)'      '/announcements'                 $supTok

# ===== Student side =====
Write-Host "`n=== Student smoke (Ahmad — sees the directory) ===" -ForegroundColor Cyan
$stuTok = Login -Email 'student@student.mmu.edu.my' -Pwd $StudentPwd
if (-not $stuTok) { Write-Host '  FAIL student login' -ForegroundColor Red; exit 1 }

Test-Get '/student/dashboard'             '/student/dashboard'             $stuTok { param($r) if (-not $r.registrationStatus) { return 'missing registrationStatus' } }
$dir = Test-Get '/supervisors (directory)' '/supervisors?size=20'           $stuTok { param($r) if ($r.total -lt 10) { return "only $($r.total) supervisors visible (expected >= 10)" } }
if ($dir -and $dir.supervisors -and $dir.supervisors.Count -gt 0) {
    $first = $dir.supervisors[0]
    Test-Get "/supervisors/$($first.userId)" "/supervisors/$($first.userId)" $stuTok { param($r) if (-not $r.fullName) { return 'no fullName' } }
}
Test-Get '/student/recommendations'       '/student/recommendations'       $stuTok
Test-Get '/student/supervision-requests'  '/student/supervision-requests'  $stuTok
Test-Get '/announcements (student-filtered)' '/announcements'              $stuTok

# ===== Spot-check seeded data integrity =====
Write-Host "`n=== Per-supervisor profile spot-check ===" -ForegroundColor Cyan
$seeded = @(
    'tan.weiming@mmu.edu.my', 'lim.sookyee@mmu.edu.my', 'rajan.subramaniam@mmu.edu.my',
    'wong.karwai@mmu.edu.my', 'nurul.izzati@mmu.edu.my', 'chong.meiling@mmu.edu.my',
    'faizal.hassan@mmu.edu.my', 'yap.chenghan@mmu.edu.my', 'priya.devi@mmu.edu.my',
    'hafiz.rahman@mmu.edu.my'
)
foreach ($e in $seeded) {
    try {
        $t = Login -Email $e -Pwd $SupervisorPwd
        $p = Invoke-RestMethod -Method GET -Uri "$BaseUrl/supervisor/profile" -Headers @{ Authorization = "Bearer $t" }
        $bits = @()
        if (-not $p.department)                      { $bits += 'no dept' }
        if (-not $p.researchAreas -or $p.researchAreas.Count -lt 1) { $bits += 'no researchAreas' }
        if (-not $p.expertise -or $p.expertise.Count -lt 1)         { $bits += 'no expertise' }
        if (-not $p.bio)                             { $bits += 'no bio' }
        if (-not $p.officeLocation)                  { $bits += 'no office' }
        if ($bits.Count -eq 0) {
            Write-Host "  PASS $($p.fullName.PadRight(34)) | $($p.department.PadRight(22)) | quota=$($p.maxSupervisionQuota) | accepting=$($p.isAcceptingStudents)" -ForegroundColor Green
            $script:pass++
        } else {
            Write-Host "  FAIL $($p.fullName) -> $($bits -join ', ')" -ForegroundColor Red
            $script:fail++; $script:failures += "${e}: $($bits -join ', ')"
        }
    } catch {
        Write-Host "  FAIL $e -> $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++; $script:failures += "${e}: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "PASS: $pass" -ForegroundColor Green
$failColor = if ($fail -eq 0) { 'Green' } else { 'Red' }
Write-Host "FAIL: $fail" -ForegroundColor $failColor
if ($fail -gt 0) {
    Write-Host "`nFailures:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}
