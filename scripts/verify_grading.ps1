# End-to-end verification of the grading workflow.
#   1. Dr. Tan Wei Ming submits an FYP1 grade for Aisyah.
#   2. Admin finalises it.
#   3. Aisyah reads her grades and confirms it appears.
# Confirms the audit log gets the GRADE_SUBMITTED + GRADE_FINALISED rows too.

$ErrorActionPreference = 'Continue'
$base = 'http://localhost:8080/api'

function Login {
    param([string] $Email, [string] $Pwd = 'Test@123')
    return (Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
        -Body (@{identifier=$Email; password=$Pwd} | ConvertTo-Json)).accessToken
}

# ---- Setup tokens + locate Aisyah's project ----
$adminTok = Login -Email 'admin@mmu.edu.my' -Pwd 'Admin@123'
$tanTok = Login -Email 'tan.weiming@mmu.edu.my'
$aisyahTok = Login -Email 'aisyah.roslan@student.mmu.edu.my'

$supervisees = Invoke-RestMethod -Method GET -Uri "$base/supervisor/supervisees" `
    -Headers @{Authorization="Bearer $tanTok"}
$aisyah = $supervisees.supervisees | Where-Object { $_.email -eq 'aisyah.roslan@student.mmu.edu.my' } | Select-Object -First 1
if ($null -eq $aisyah) { Write-Host 'Aisyah not in Tan supervisees' -ForegroundColor Red; exit 1 }
$projectId = [int]$aisyah.superviseeId
Write-Host "Aisyah project id: $projectId" -ForegroundColor Cyan

# ---- 1. Supervisor submits a grade ----
Write-Host ''
Write-Host '[1] Dr. Tan submits FYP1 grade for Aisyah ...' -ForegroundColor Cyan
$body = @{
    projectId = $projectId
    phase     = 'FYP1'
    rubric    = @{
        implementation = 22
        documentation  = 18
        finalReport    = 23
        presentation   = 13
        innovation     = 12
    }
    remarks = 'Strong methodology and clean implementation; presentation could be tighter.'
    status  = 'SUBMITTED'
} | ConvertTo-Json
$created = Invoke-RestMethod -Method POST -Uri "$base/supervisor/grades" `
    -Headers @{Authorization="Bearer $tanTok"} -ContentType 'application/json' -Body $body
$gradeId = $created.gradeId
Write-Host ("    grade {0}: status={1} score={2} letter={3}" -f $gradeId, $created.status, $created.totalScore, $created.letterGrade) -ForegroundColor Green

# ---- 2. Verify student CANNOT see SUBMITTED grade ----
Write-Host ''
Write-Host '[2] Aisyah checks her grades (should be empty — not finalised yet) ...' -ForegroundColor Cyan
$beforeFinalise = Invoke-RestMethod -Method GET -Uri "$base/student/grades" `
    -Headers @{Authorization="Bearer $aisyahTok"}
Write-Host ("    student sees {0} grade(s) before finalisation" -f $beforeFinalise.total) -ForegroundColor (if ($beforeFinalise.total -eq 0) { 'Green' } else { 'Red' })

# ---- 3. Admin finalises ----
Write-Host ''
Write-Host '[3] Admin finalises the grade ...' -ForegroundColor Cyan
$finalised = Invoke-RestMethod -Method POST -Uri "$base/admin/grades/$gradeId/finalise" `
    -Headers @{Authorization="Bearer $adminTok"}
Write-Host ("    grade {0}: status={1} finalisedBy={2}" -f $finalised.gradeId, $finalised.status, $finalised.finalisedBy) -ForegroundColor Green

# ---- 4. Verify student CAN now see it ----
Write-Host ''
Write-Host '[4] Aisyah re-checks her grades (should appear now) ...' -ForegroundColor Cyan
$afterFinalise = Invoke-RestMethod -Method GET -Uri "$base/student/grades" `
    -Headers @{Authorization="Bearer $aisyahTok"}
Write-Host ("    student sees {0} grade(s) after finalisation" -f $afterFinalise.total) -ForegroundColor (if ($afterFinalise.total -ge 1) { 'Green' } else { 'Red' })
foreach ($g in $afterFinalise.grades) {
    Write-Host ("      {0} | score={1} {2} | by {3}" -f $g.phase, $g.totalScore, $g.letterGrade, $g.graderName) -ForegroundColor Green
}

# ---- 5. Audit trail ----
Write-Host ''
Write-Host '[5] Audit trail for FYP_GRADE entity ...' -ForegroundColor Cyan
$audit = Invoke-RestMethod -Method GET -Uri "$base/admin/audit-logs?entityType=FYP_GRADE&size=5" `
    -Headers @{Authorization="Bearer $adminTok"}
foreach ($a in $audit.logs) {
    Write-Host ("    {0,-20} | {1} | {2}" -f $a.action, $a.performedByName, $a.details) -ForegroundColor Green
}
