# Live verification of the login throttle.
# 6 wrong attempts on a seeded supervisor, then a CORRECT-password attempt — the
# throttle must reject the 6th wrong attempt with "locked" AND the correct attempt
# must also be rejected (lockout in effect).

$ErrorActionPreference = 'Continue'
$base = 'http://localhost:8080/api'
$target = 'hafiz.rahman@mmu.edu.my'

function Get-ApiMessage {
    param($Exception)
    try {
        $stream = $Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        return ($reader.ReadToEnd() | ConvertFrom-Json).message
    } catch {
        return $Exception.Message
    }
}

Write-Host "Hammering $target with 6 wrong passwords ..." -ForegroundColor Cyan
for ($i = 1; $i -le 6; $i++) {
    try {
        Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
            -Body (@{identifier=$target; password="wrong_$i"} | ConvertTo-Json) | Out-Null
        Write-Host "  [$i] (unexpected success)" -ForegroundColor Yellow
    } catch {
        $msg = Get-ApiMessage $_.Exception
        $color = if ($msg -match 'locked') { 'Red' } else { 'DarkGray' }
        Write-Host "  [$i] $msg" -ForegroundColor $color
    }
}

Write-Host ''
Write-Host "Now trying CORRECT password to confirm the lockout still rejects ..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
        -Body (@{identifier=$target; password='Test@123'} | ConvertTo-Json) | Out-Null
    Write-Host "  ! login SUCCEEDED — throttle did NOT engage" -ForegroundColor Red
} catch {
    $msg = Get-ApiMessage $_.Exception
    if ($msg -match 'locked') {
        Write-Host "  PASS: throttle holds against correct password — '$msg'" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: rejected but not by the throttle — '$msg'" -ForegroundColor Red
    }
}

# Quickly confirm the persisted state via the admin user-detail endpoint (the DTO
# placeholder I noted earlier can be wired to the real columns later).
Write-Host ''
Write-Host "Inspecting persisted state on $target ..." -ForegroundColor Cyan
try {
    $admin = (Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType 'application/json' `
        -Body (@{identifier='admin@mmu.edu.my'; password='Admin@123'} | ConvertTo-Json)).accessToken
    $list = Invoke-RestMethod -Method GET -Uri "$base/admin/users?role=SUPERVISOR&size=50" `
        -Headers @{Authorization="Bearer $admin"}
    $row = $list.users | Where-Object { $_.email -eq $target } | Select-Object -First 1
    if ($null -eq $row) { Write-Host "  not found" -ForegroundColor Red; return }
    Write-Host ("  user-detail row keys: " + (($row.PSObject.Properties.Name) -join ', ')) -ForegroundColor DarkGray
} catch {
    Write-Host "  admin lookup failed: $($_.Exception.Message)" -ForegroundColor Red
}
