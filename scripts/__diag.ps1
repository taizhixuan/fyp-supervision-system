$emails = @('committee@mmu.edu.my','admin@mmu.edu.my','committee1@mmu.edu.my','committee@fyp.mmu.edu.my')
foreach ($e in $emails) {
  $body = @{ email = $e; password = 'Pass1234' } | ConvertTo-Json -Compress
  try {
    $r = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
    Write-Host "OK $e -> token=$($r.token.Substring(0,20))... role=$($r.user.role)"
  } catch {
    if ($_.ErrorDetails) { Write-Host "FAIL $e -> $($_.ErrorDetails.Message)" }
    else { Write-Host "FAIL $e -> $($_.Exception.Message)" }
  }
}
