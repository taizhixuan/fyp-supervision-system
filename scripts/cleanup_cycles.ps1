# Tidy up cycle data after a session of testing.
# 1. Cycle 6 (active FYP1, 1-day duration): extend to a realistic 14-week window.
# 2. Cycle 2 (empty FYP2 from seed): archive then delete.
# 3. Cycle 5 (FYP1 with 1 stale placeholder): re-attach the placeholder to the
#    currently-active FYP1 cycle (cycle 6) by re-activating cycle 6, which runs
#    `backfillFyp1Placeholders` — it picks up placeholders sitting on COMPLETED
#    cycles and re-points them. Then archive + delete cycle 5 if it ends up empty.

$ErrorActionPreference = 'Stop'
$BaseUrl = 'http://localhost:8080/api'

function Login {
    param([string] $Email, [string] $Pwd = 'Admin@123')
    (Invoke-RestMethod -Method POST -Uri "$BaseUrl/auth/login" `
        -ContentType 'application/json' `
        -Body (@{ identifier = $Email; password = $Pwd } | ConvertTo-Json)).accessToken
}

function Invoke-Api {
    param([string] $Method, [string] $Path, $Body = $null, [string] $Token)
    $params = @{
        Method  = $Method
        Uri     = "$BaseUrl$Path"
        Headers = @{ Authorization = "Bearer $Token" }
    }
    if ($null -ne $Body) {
        $params['Body'] = ($Body | ConvertTo-Json)
        $params['ContentType'] = 'application/json'
    }
    return Invoke-RestMethod @params
}

function Show-Cycles {
    param([string] $Token)
    $r = Invoke-Api -Method GET -Path '/admin/cycles' -Token $Token
    Write-Host ('-' * 100) -ForegroundColor DarkGray
    foreach ($c in $r.cycles | Sort-Object cycleId) {
        $days = ((Get-Date $c.endDate) - (Get-Date $c.startDate)).Days
        Write-Host (("  id={0,-3} {1,-5} {2,-10} {3} -> {4} ({5,3}d) total={6} paired={7}") -f `
            $c.cycleId, $c.type, $c.status, $c.startDate, $c.endDate, $days, $c.totalStudents, $c.pairedStudents)
    }
    Write-Host ''
}

$adminToken = Login -Email 'admin@mmu.edu.my'

Write-Host "Before:" -ForegroundColor Cyan
Show-Cycles -Token $adminToken

# --- 1. Stretch cycle 6 to a real 14-week trimester ---
Write-Host "[1] Stretching cycle 6 to a real 14-week window ..." -ForegroundColor Cyan
try {
    $resp = Invoke-Api -Method PUT -Path '/admin/cycles/6' -Token $adminToken -Body @{
        startDate    = '2026-05-01'
        endDate      = '2026-08-08'
        academicYear = '2026/2027'
        semester     = 1
    }
    Write-Host "    cycle 6 updated: status=$($resp.status)" -ForegroundColor Green
} catch {
    Write-Host "    cycle 6 update failed: $($_.Exception.Message)" -ForegroundColor Red
}

# --- 2. Re-attach the cycle-5 placeholder to cycle 6 ---
# Re-activating cycle 6 triggers backfill; backfill re-points placeholders sitting on
# COMPLETED FYP1 cycles to the newly-activated one.
Write-Host "[2] Re-activating cycle 6 to pull stale placeholders off cycle 5 ..." -ForegroundColor Cyan
try {
    $r = Invoke-Api -Method POST -Path '/admin/cycles/6/activate' -Token $adminToken
    Write-Host "    activate response: studentsAttached=$($r.studentsAttached)" -ForegroundColor Green
} catch {
    Write-Host "    activate failed: $($_.Exception.Message)" -ForegroundColor Red
}

# --- 3. Archive + delete cycle 2 (empty FYP2) ---
Write-Host "[3] Archiving + deleting cycle 2 (empty FYP2) ..." -ForegroundColor Cyan
try {
    Invoke-Api -Method POST -Path '/admin/cycles/2/archive' -Token $adminToken | Out-Null
    Invoke-Api -Method DELETE -Path '/admin/cycles/2' -Token $adminToken | Out-Null
    Write-Host "    cycle 2 archived + deleted." -ForegroundColor Green
} catch {
    Write-Host "    cycle 2 cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
}

# --- 4. Try to archive + delete cycle 5 if its placeholder moved ---
Write-Host "[4] Trying cycle 5 (was holding a stale placeholder) ..." -ForegroundColor Cyan
try {
    Invoke-Api -Method POST -Path '/admin/cycles/5/archive' -Token $adminToken | Out-Null
    Invoke-Api -Method DELETE -Path '/admin/cycles/5' -Token $adminToken | Out-Null
    Write-Host "    cycle 5 archived + deleted." -ForegroundColor Green
} catch {
    Write-Host "    cycle 5 cleanup skipped: $($_.Exception.Message)" -ForegroundColor DarkGray
    Write-Host "    (still has a project attached — can be removed manually if needed)" -ForegroundColor DarkGray
}

Write-Host ''
Write-Host "After:" -ForegroundColor Cyan
Show-Cycles -Token $adminToken
