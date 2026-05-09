$ErrorActionPreference = 'Stop'
$BaseUrl = 'http://localhost:8080/api'

# Use the seeded student account so we can hit /supervisors (STUDENT-only directory).
$login = Invoke-RestMethod -Method POST -Uri "$BaseUrl/auth/login" `
    -ContentType 'application/json' `
    -Body (@{ identifier = 'student@student.mmu.edu.my'; password = 'Test@123' } | ConvertTo-Json)
$token = $login.accessToken

$resp = Invoke-RestMethod -Method GET -Uri "$BaseUrl/supervisors?size=20" `
    -Headers @{ Authorization = "Bearer $token" }

Write-Host "Total supervisors visible to student directory: $($resp.total)" -ForegroundColor Cyan
$resp.supervisors |
    Sort-Object fullName |
    Select-Object fullName, department, maxSupervisionQuota, isAcceptingStudents |
    Format-Table -AutoSize
