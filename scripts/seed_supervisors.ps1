# Seed 10 supervisor accounts through the live REST API. No direct DB inserts:
#   1. Login as the seed admin (admin@mmu.edu.my / Admin@123).
#   2. Upload an in-memory supervisor roster CSV through /admin/roster/supervisors/import
#      so the roster reflects the seeded staff.
#   3. POST /admin/users for each supervisor — creates the account ACTIVE straight away.
#   4. Login as each supervisor and PUT /supervisor/profile to fill department,
#      research areas, expertise, bio, quota — the same fields a supervisor would set
#      themselves on their first login.
#
# Step 3 used to POST /auth/register. That stopped working when V48 introduced
# email-OTP-before-account-creation: /auth/register now only writes a row to
# pending_registration and the account does not exist until /auth/register/verify
# is called with the code, which is delivered by email (or the backend log when
# APP_EMAIL_ENABLED=false). A seeding script cannot read either, so it uses the
# admin create-user endpoint instead. The human registration + OTP path is still
# exercised by the app itself; this script is only about getting demo data in.
#
# Idempotent-ish: roster import upserts; user create skips if the email/mmuId already
# exists; profile updates idempotent. Re-running won't duplicate accounts.
#
# Usage:
#   .\seed_supervisors.ps1                                          # local backend
#   .\seed_supervisors.ps1 -BaseUrl https://api.supervisi.me/api    # remote server
#   .\seed_supervisors.ps1 -BaseUrl <url> -AdminPassword '<rotated>'

param(
    [string] $BaseUrl = 'http://localhost:8080/api',
    [string] $AdminEmail = 'admin@mmu.edu.my',
    [string] $AdminPassword = 'Admin@123',
    [string] $SupervisorPassword = 'Test@123'
)

$ErrorActionPreference = 'Stop'

# 10 supervisors with realistic FCI fields. mmuIds are 10 digits in the staff range.
$Supervisors = @(
    @{ mmuId='2010001001'; email='tan.weiming@mmu.edu.my';        fullName='Dr. Tan Wei Ming';                 phone='012-3001001'; department='Software Engineering';   position='Senior Lecturer'; quota=8;  researchAreas=@('Machine Learning','Natural Language Processing','Software Architecture');     expertise=@('Python','TensorFlow','PyTorch','Java');                 bio='Researcher in applied machine learning with a focus on text and code understanding. Welcomes FYP projects on practical NLP applications.';                                  office='FCI Block A, Room 3.21'; },
    @{ mmuId='2010001002'; email='lim.sookyee@mmu.edu.my';        fullName='Dr. Lim Sook Yee';                 phone='012-3001002'; department='Data Science';            position='Lecturer';        quota=6;  researchAreas=@('Data Mining','Big Data Analytics','Time Series');                            expertise=@('R','Spark','Hadoop','SQL');                              bio='Interested in scalable analytics pipelines and predictive modelling. Past supervisees have built fraud-detection and demand-forecasting systems.';                          office='FCI Block A, Room 3.07'; },
    @{ mmuId='2010001003'; email='rajan.subramaniam@mmu.edu.my';  fullName='Prof. Rajan Subramaniam';          phone='012-3001003'; department='Cybersecurity';            position='Professor';       quota=10; researchAreas=@('Network Security','Cryptography','Threat Intelligence');                     expertise=@('Penetration Testing','Wireshark','Snort','Burp Suite');  bio='Heads the Cybersecurity research cluster. Supervises projects in offensive security tooling, intrusion detection, and applied cryptography.';                                office='FCI Block B, Room 4.02'; },
    @{ mmuId='2010001004'; email='wong.karwai@mmu.edu.my';        fullName='Dr. Wong Kar Wai';                 phone='012-3001004'; department='Software Engineering';   position='Senior Lecturer'; quota=8;  researchAreas=@('Cloud Computing','DevOps','Microservices');                                  expertise=@('AWS','Kubernetes','Docker','Terraform');                bio='Builds CI/CD platforms and works on cloud-native architectures. Looking for FYP students keen on production-grade systems and observability.';                              office='FCI Block A, Room 3.18'; },
    @{ mmuId='2010001005'; email='nurul.izzati@mmu.edu.my';       fullName='Dr. Nurul Izzati binti Mohd';      phone='012-3001005'; department='Information Systems';      position='Lecturer';        quota=6;  researchAreas=@('Human-Computer Interaction','UX Research','Accessibility');                  expertise=@('Figma','Lookback','Usability Testing','Design Systems'); bio='HCI researcher focused on inclusive design. Supervises mixed-method projects combining user studies with prototype development.';                                            office='FCI Block C, Room 2.11'; },
    @{ mmuId='2010001006'; email='chong.meiling@mmu.edu.my';      fullName='Dr. Chong Mei Ling';               phone='012-3001006'; department='Data Science';            position='Senior Lecturer'; quota=7;  researchAreas=@('Data Visualisation','Predictive Analytics','Healthcare Informatics');        expertise=@('Tableau','Power BI','Python','Plotly');                  bio='Builds interactive analytics dashboards for clinical and supply-chain data. Open to FYPs that pair real datasets with strong storytelling.';                                office='FCI Block A, Room 3.09'; },
    @{ mmuId='2010001007'; email='faizal.hassan@mmu.edu.my';      fullName='Dr. Faizal bin Hassan';            phone='012-3001007'; department='Software Engineering';   position='Lecturer';        quota=8;  researchAreas=@('Mobile Computing','Cross-Platform Development','Edge AI');                   expertise=@('React Native','Flutter','Kotlin','Swift');               bio='Mobile engineering and on-device ML. Past projects include accessibility-first banking apps and offline-first field tools.';                                                office='FCI Block A, Room 3.22'; },
    @{ mmuId='2010001008'; email='yap.chenghan@mmu.edu.my';       fullName='Dr. Yap Cheng Han';                phone='012-3001008'; department='Computer Networks';        position='Senior Lecturer'; quota=7;  researchAreas=@('Internet of Things','Edge Computing','Wireless Sensor Networks');            expertise=@('MQTT','ESP32','Raspberry Pi','LoRa');                    bio='Hands-on IoT prototyping with low-power sensor meshes. Supervises FYPs that ship a working physical artefact alongside the software.';                                      office='FCI Block B, Room 3.15'; },
    @{ mmuId='2010001009'; email='priya.devi@mmu.edu.my';         fullName='Dr. Priya Devi a/p Kumaran';       phone='012-3001009'; department='Information Systems';      position='Senior Lecturer'; quota=6;  researchAreas=@('Enterprise Systems','Business Intelligence','Process Mining');               expertise=@('SAP','Salesforce','PowerApps','ERP');                    bio='Bridges business process analysis and information systems implementation. Looking for FYPs with industry-partner case studies.';                                            office='FCI Block C, Room 2.18'; },
    @{ mmuId='2010001010'; email='hafiz.rahman@mmu.edu.my';       fullName='Dr. Hafiz bin Rahman';             phone='012-3001010'; department='Game Development';        position='Lecturer';        quota=6;  researchAreas=@('Game Design','Computer Graphics','Procedural Generation');                   expertise=@('Unity','Unreal Engine','C#','HLSL');                     bio='Game systems and real-time graphics. Welcomes proposals on serious games, procedural content, and shader-driven art tools.';                                                office='FCI Block A, Room 3.30'; }
)

function Invoke-Api {
    param(
        [Parameter(Mandatory)] [string] $Method,
        [Parameter(Mandatory)] [string] $Path,
        $Body = $null,
        [string] $Token = $null,
        [hashtable] $Headers = @{}
    )
    $h = @{} + $Headers
    if ($Token) { $h['Authorization'] = "Bearer $Token" }
    $url = "$BaseUrl$Path"
    $params = @{
        Method  = $Method
        Uri     = $url
        Headers = $h
    }
    if ($null -ne $Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
        $params['ContentType'] = 'application/json'
    }
    return Invoke-RestMethod @params
}

Write-Host "[1/4] Logging in as admin ($AdminEmail)..." -ForegroundColor Cyan
$adminLogin = Invoke-Api -Method POST -Path '/auth/login' -Body @{ identifier = $AdminEmail; password = $AdminPassword }
$adminToken = $adminLogin.accessToken
if (-not $adminToken) { throw "Admin login failed: no token returned." }
Write-Host "    Admin token acquired." -ForegroundColor Green

# Build the CSV in memory and POST as multipart so /admin/roster/supervisors/import sees it.
Write-Host "`n[2/4] Uploading supervisor roster (10 entries) ..." -ForegroundColor Cyan
$csvLines = @('mmuId,email,fullName,department,faculty,position')
foreach ($s in $Supervisors) {
    $csvLines += "$($s.mmuId),$($s.email),$($s.fullName),$($s.department),Faculty of Computing & Informatics,$($s.position)"
}
$csvBody = ($csvLines -join "`n")
$tmp = Join-Path $env:TEMP "supervisor_roster_$(Get-Random).csv"
Set-Content -Path $tmp -Value $csvBody -Encoding UTF8
try {
    # Use curl.exe for the multipart upload — Windows PowerShell 5.1's Invoke-RestMethod
    # has no -Form parameter (that landed in PowerShell 7).
    $rawJson = & curl.exe --silent --show-error `
        -X POST "$BaseUrl/admin/roster/supervisors/import" `
        -H "Authorization: Bearer $adminToken" `
        -F "file=@$tmp;type=text/csv"
    if ($LASTEXITCODE -ne 0) { throw "curl roster import failed (exit $LASTEXITCODE): $rawJson" }
    $importResp = $rawJson | ConvertFrom-Json
    Write-Host "    imported=$($importResp.imported) updated=$($importResp.updated) autoApproved=$($importResp.autoApproved) errors=$($importResp.errorCount)" -ForegroundColor Green
    if ($importResp.errors -and $importResp.errors.Count -gt 0) {
        Write-Host "    !! errors:" -ForegroundColor Yellow
        $importResp.errors | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
    }
} finally {
    Remove-Item $tmp -ErrorAction SilentlyContinue
}

Write-Host "`n[3/4] Creating each supervisor account (POST /admin/users, ACTIVE on create) ..." -ForegroundColor Cyan
$registered = 0; $existed = 0; $failed = 0
foreach ($s in $Supervisors) {
    try {
        $resp = Invoke-Api -Method POST -Path '/admin/users' -Token $adminToken -Body @{
            role     = 'SUPERVISOR'
            fullName = $s.fullName
            mmuId    = $s.mmuId
            email    = $s.email
            phone    = $s.phone
            password = $SupervisorPassword
        }
        Write-Host "    + $($s.fullName) <$($s.email)> -> userId=$($resp.userId)" -ForegroundColor Green
        $registered++
    } catch {
        $msg = $_.Exception.Message
        $body = $null
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
        } catch { }
        if ($body -and $body -match 'already') {
            Write-Host "    = $($s.fullName) already exists, skipping registration" -ForegroundColor DarkGray
            $existed++
        } else {
            Write-Host "    ! $($s.fullName) failed: $msg $body" -ForegroundColor Red
            $failed++
        }
    }
}
Write-Host "    registered=$registered existed=$existed failed=$failed" -ForegroundColor Green

Write-Host "`n[4/4] Filling supervisor profiles (login as each, PUT /supervisor/profile) ..." -ForegroundColor Cyan
$profilesUpdated = 0; $profilesFailed = 0
foreach ($s in $Supervisors) {
    try {
        $login = Invoke-Api -Method POST -Path '/auth/login' -Body @{ identifier = $s.email; password = $SupervisorPassword }
        $token = $login.accessToken
        if (-not $token) { throw "no token returned" }
        $update = @{
            department          = $s.department
            faculty             = 'Faculty of Computing & Informatics'
            position            = $s.position
            researchAreas       = $s.researchAreas
            expertise           = $s.expertise
            bio                 = $s.bio
            officeLocation      = $s.office
            officeHours         = 'Mon-Fri 14:00-16:00 (by appointment)'
            maxSupervisionQuota = $s.quota
            isAcceptingStudents = $true
            preferredProjectTypes = @('Application-Based','Research-Based')
        }
        $resp = Invoke-Api -Method PUT -Path '/supervisor/profile' -Body $update -Token $token
        Write-Host "    + $($s.fullName) profile updated (quota=$($resp.maxSupervisionQuota), accepting=$($resp.isAcceptingStudents))" -ForegroundColor Green
        $profilesUpdated++
    } catch {
        Write-Host "    ! $($s.fullName) profile update failed: $($_.Exception.Message)" -ForegroundColor Red
        $profilesFailed++
    }
}
Write-Host "    profiles updated=$profilesUpdated failed=$profilesFailed" -ForegroundColor Green

Write-Host "`nDone. Login credentials: any of the seeded emails / password '$SupervisorPassword'." -ForegroundColor Cyan
