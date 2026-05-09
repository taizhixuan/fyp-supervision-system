$ErrorActionPreference = 'Stop'
$BaseUrl = 'http://localhost:8080/api'

function Login {
    param([string] $Email, [string] $Pwd = 'Test@123')
    (Invoke-RestMethod -Method POST -Uri "$BaseUrl/auth/login" `
        -ContentType 'application/json' `
        -Body (@{ identifier = $Email; password = $Pwd } | ConvertTo-Json)).accessToken
}

function Dashboard {
    param([string] $Token)
    Invoke-RestMethod -Method GET -Uri "$BaseUrl/student/dashboard" `
        -Headers @{ Authorization = "Bearer $Token" }
}

$cases = @(
    @{ tag='A'; email='aisyah.roslan@student.mmu.edu.my';  expected='6/6 logs (compliance MET)' },
    @{ tag='B'; email='bryan.tay@student.mmu.edu.my';      expected='3/6 logs (compliance NOT met)' },
    @{ tag='C'; email='cheryl.lim@student.mmu.edu.my';     expected='0 LOCKED + mid-flow logs' },
    @{ tag='D'; email='danish.zaki@student.mmu.edu.my';    expected='paired, 0 logs' },
    @{ tag='E'; email='elaine.chong@student.mmu.edu.my';   expected='unpaired, PENDING request' },
    @{ tag='G'; email='grace.wong@student.mmu.edu.my';     expected='unpaired, no requests' }
)

Write-Host "Student dashboard checks:" -ForegroundColor Cyan
Write-Host ('-' * 110) -ForegroundColor DarkGray
Write-Host ("  {0,-3} {1,-30} {2,-22} {3,-14} {4,-10} {5}" -f 'Tag','Name','Status','Logs','CycleAct','Notes') -ForegroundColor DarkGray
Write-Host ('-' * 110) -ForegroundColor DarkGray

foreach ($c in $cases) {
    try {
        $tok = Login -Email $c.email
        $d = Dashboard -Token $tok
        $r = $d.registrationStatus
        $logs = "$($r.meetingLogsCompleted)/$($r.meetingLogsRequired)"
        $name = $d.profile.fullName
        Write-Host ("  {0,-3} {1,-30} {2,-22} {3,-14} {4,-10} {5}" -f `
            $c.tag, $name, $r.status, $logs, $r.cycleActive, $c.expected) -ForegroundColor Green
    } catch {
        Write-Host ("  {0,-3} FAIL: {1}" -f $c.tag, $_.Exception.Message) -ForegroundColor Red
    }
}
