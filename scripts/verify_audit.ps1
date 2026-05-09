# Live verification of audit logging.
# Triggers a mix of audited actions and then reads /admin/audit-logs to confirm
# rows landed.

$ErrorActionPreference = 'Continue'
$base = 'http://localhost:8080/api'

function Login {
    param([string] $Email, [string] $Pwd)
    return (Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
        -Body (@{identifier=$Email; password=$Pwd} | ConvertTo-Json)).accessToken
}

# --- 1. Trigger LOGIN_FAILURE_UNKNOWN_USER ---
Write-Host "[1] Bad login with non-existent identifier ..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
        -Body (@{identifier='nobody@mmu.edu.my'; password='whatever'} | ConvertTo-Json) | Out-Null
} catch { Write-Host "    rejected (expected)" -ForegroundColor DarkGray }

# --- 2. Trigger LOGIN_FAILURE on a real account (just one, to avoid lockout) ---
Write-Host "[2] One bad password on a real account (Bryan) ..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
        -Body (@{identifier='bryan.tay@student.mmu.edu.my'; password='wrong'} | ConvertTo-Json) | Out-Null
} catch { Write-Host "    rejected (expected)" -ForegroundColor DarkGray }

# --- 3. LOGIN_SUCCESS as admin ---
Write-Host "[3] Successful admin login ..." -ForegroundColor Cyan
$adminTok = Login -Email 'admin@mmu.edu.my' -Pwd 'Admin@123'
Write-Host "    token acquired" -ForegroundColor Green

# --- 4. CYCLE_ARCHIVED on cycle 1 (currently COMPLETED → ARCHIVED is a valid transition) ---
Write-Host "[4] Archive cycle 1 (historical FYP1) ..." -ForegroundColor Cyan
try {
    $r = Invoke-RestMethod -Method POST -Uri "$base/admin/cycles/1/archive" `
        -Headers @{Authorization="Bearer $adminTok"}
    Write-Host "    cycle 1 -> $($r.status)" -ForegroundColor Green
} catch { Write-Host "    failed: $($_.Exception.Message)" -ForegroundColor DarkGray }

# --- 5. FYP1_RESULT_SET — mark Bryan PASSED ---
Write-Host "[5] Mark Bryan FYP1 PASSED ..." -ForegroundColor Cyan
$projects = Invoke-RestMethod -Method GET -Uri "$base/admin/projects/fyp1-pass" `
    -Headers @{Authorization="Bearer $adminTok"}
$bryanRow = $projects.projects | Where-Object { $_.studentEmail -eq 'bryan.tay@student.mmu.edu.my' } | Select-Object -First 1
if ($null -ne $bryanRow) {
    try {
        Invoke-RestMethod -Method POST -Uri "$base/admin/projects/$($bryanRow.projectId)/fyp1-passed" `
            -Headers @{Authorization="Bearer $adminTok"} -ContentType 'application/json' `
            -Body (@{passed=$true} | ConvertTo-Json) | Out-Null
        Write-Host "    Bryan marked passed (project $($bryanRow.projectId))" -ForegroundColor Green
    } catch { Write-Host "    FYP1 mark failed: $($_.Exception.Message)" -ForegroundColor Red }
} else { Write-Host "    Bryan project not found" -ForegroundColor Yellow }

# --- 6. Read back /admin/audit-logs ---
Write-Host ''
Write-Host "[6] Reading /admin/audit-logs ..." -ForegroundColor Cyan
$logs = Invoke-RestMethod -Method GET -Uri "$base/admin/audit-logs?size=20" `
    -Headers @{Authorization="Bearer $adminTok"}
Write-Host ("    total entries returned: {0}" -f $logs.total) -ForegroundColor Cyan
Write-Host ('-' * 110) -ForegroundColor DarkGray
Write-Host ("  {0,-32} {1,-15} {2,-25} {3}" -f 'action','entityType','performedBy','details') -ForegroundColor DarkGray
Write-Host ('-' * 110) -ForegroundColor DarkGray
foreach ($l in $logs.logs | Select-Object -First 20) {
    $performer = if ($l.performedByName) { $l.performedByName } else { '<anonymous>' }
    $details   = if ($l.details) { $l.details } else { '' }
    Write-Host ("  {0,-32} {1,-15} {2,-25} {3}" -f $l.action, $l.entityType, $performer, $details) -ForegroundColor Green
}
