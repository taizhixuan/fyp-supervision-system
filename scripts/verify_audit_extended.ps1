# Exercise the new audit hooks added in commit f9c98dd:
#   1. REQUEST_REJECTED (or REQUEST_ACCEPTED) — supervisor responds to a pending
#      supervision request from a seeded student.
#   2. USER_STATUS_CHANGED — admin bulk-status toggles a user (no-op, ACTIVE -> ACTIVE).
# Doesn't exercise USER_DELETED, CYCLE_DELETED, or PROPOSAL_REVIEWED_* because those
# need disposable fixtures we'd rather not destroy in a verification pass.

$ErrorActionPreference = 'Continue'
$base = 'http://localhost:8080/api'

function Login {
    param([string] $Email, [string] $Pwd = 'Test@123')
    return (Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
        -Body (@{identifier=$Email; password=$Pwd} | ConvertTo-Json)).accessToken
}

# --- 1. Supervisor rejects a pending request ---
Write-Host "[1] Nurul Izzati rejects Farhan's pending supervision request ..." -ForegroundColor Cyan
$supTok = Login -Email 'nurul.izzati@mmu.edu.my'
$reqs = Invoke-RestMethod -Method GET -Uri "$base/supervisor/requests?status=PENDING" `
    -Headers @{Authorization="Bearer $supTok"}
$farhanReq = $reqs.requests | Where-Object { $_.student.fullName -like 'Farhan*' } | Select-Object -First 1
if ($null -ne $farhanReq) {
    try {
        Invoke-RestMethod -Method POST -Uri "$base/supervisor/requests/$($farhanReq.requestId)/respond" `
            -Headers @{Authorization="Bearer $supTok"} -ContentType 'application/json' `
            -Body (@{action='REJECT'; rejectionReason='Out of capacity this trimester.'} | ConvertTo-Json) | Out-Null
        Write-Host "    request $($farhanReq.requestId) REJECTED" -ForegroundColor Green
    } catch {
        Write-Host "    failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "    no PENDING request from Farhan found (already responded?)" -ForegroundColor DarkGray
}

# --- 2. Admin bulk status no-op ---
Write-Host "[2] Admin bulk-toggles Hadi's status (ACTIVE -> ACTIVE, fires audit only) ..." -ForegroundColor Cyan
$adminTok = Login -Email 'admin@mmu.edu.my' -Pwd 'Admin@123'
$users = Invoke-RestMethod -Method GET -Uri "$base/admin/users?role=STUDENT&size=50" `
    -Headers @{Authorization="Bearer $adminTok"}
$hadi = $users.users | Where-Object { $_.email -eq 'hadi.amin@student.mmu.edu.my' } | Select-Object -First 1
if ($null -ne $hadi) {
    try {
        Invoke-RestMethod -Method PUT -Uri "$base/admin/users/bulk-status" `
            -Headers @{Authorization="Bearer $adminTok"} -ContentType 'application/json' `
            -Body (@{userIds=@([int]$hadi.userId); status='ACTIVE'} | ConvertTo-Json) | Out-Null
        Write-Host "    bulk-status applied for Hadi (id=$($hadi.userId))" -ForegroundColor Green
    } catch {
        Write-Host "    failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "    Hadi not found" -ForegroundColor Yellow
}

# --- 3. Read audit log, focus on new actions ---
Write-Host ''
Write-Host "[3] Latest audit_log entries (top 12) ..." -ForegroundColor Cyan
$logs = Invoke-RestMethod -Method GET -Uri "$base/admin/audit-logs?size=12" `
    -Headers @{Authorization="Bearer $adminTok"}
Write-Host ('-' * 110) -ForegroundColor DarkGray
foreach ($l in $logs.logs | Select-Object -First 12) {
    $performer = if ($l.performedByName) { $l.performedByName } else { '<anonymous>' }
    $details   = if ($l.details) { $l.details } else { '' }
    Write-Host ("  {0,-32} {1,-18} {2,-22} {3}" -f $l.action, $l.entityType, $performer, $details) -ForegroundColor Green
}
