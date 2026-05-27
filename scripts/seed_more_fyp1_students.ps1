# Add 8 more students to the active FYP1 cycle. Each has a realistic, personalised profile
# (bio, skills, research interests, CGPA, LinkedIn / GitHub, expected graduation).
# Distributed across pairing states so the dashboard widgets and unpaired/paired
# views all render meaningful data:
#
#   3 paired (request sent, accepted, with a DRAFT proposal)
#   2 unpaired with a PENDING supervision request
#   3 unpaired with no requests yet
#
# Walks the full live REST API. Does not touch existing accounts (Sophia / Cheryl / Aisyah,
# Jason / Aliya / Kai, the V9 seed students, etc).

$ErrorActionPreference = 'Stop'
$BaseUrl = 'http://localhost:8080/api'
$AdminEmail = 'admin@mmu.edu.my'
$AdminPwd = 'Admin@123'
$Pwd = 'Test@123'

# ---- Cast --------------------------------------------------------------------

$Students = @(
    # ----- PAIRED — will end with a supervisor + DRAFT proposal --------------
    @{
        state='PAIRED'; mmuId='1241400001'; email='marcus.ong@student.mmu.edu.my';
        fullName='Marcus Ong Wei Jin'; phone='011-2700001';
        spec='Software Engineering'; intake=2024;
        bio='Final-year SE student, full-stack hobbyist. Spent the last semester migrating my year-2 PHP project to a NestJS + Next.js stack. Looking to ship something I can show employers at interviews — emphasis on production-grade observability and CI/CD rather than just feature count.';
        researchInterests=@('Full-Stack Development','DevOps','CI/CD','Observability','Containerisation');
        skills=@('TypeScript','Node.js','NestJS','Next.js','PostgreSQL','Docker','GitHub Actions','Tailwind CSS');
        cgpa='3.55'; expectedGraduation='2026-08';
        linkedin='https://www.linkedin.com/in/marcus-ong-demo'; github='https://github.com/marcus-ong-demo';
        supEmail='liew.cheehong@mmu.edu.my';
        proposalTitle='End-to-End Observability Pipeline for Student Lab Workloads';
    },
    @{
        state='PAIRED'; mmuId='1241400002'; email='nurul.aisyah@student.mmu.edu.my';
        fullName='Nurul Aisyah binti Hamzah'; phone='011-2700002';
        spec='Data Science'; intake=2024;
        bio='Top-of-class data science student. Final-year project supervised under Dr. Lim. Specific interest in time-series forecasting on retail demand — completed a Kaggle competition on the M5 dataset (top 22 percent). Reading Hyndman + Athanasopoulos cover-to-cover this trimester.';
        researchInterests=@('Time Series Forecasting','Predictive Analytics','Retail Analytics','Statistical Modelling');
        skills=@('R','Python','Pandas','Prophet','statsmodels','Tableau','SQL','Spark');
        cgpa='3.85'; expectedGraduation='2026-08';
        linkedin='https://www.linkedin.com/in/nurul-aisyah-demo'; github='https://github.com/nurul-aisyah-demo';
        supEmail='lim.sookyee@mmu.edu.my';
        proposalTitle='Probabilistic Demand Forecasting for Convenience-Store Inventory Replenishment';
    },
    @{
        state='PAIRED'; mmuId='1241400003'; email='vikram.singh@student.mmu.edu.my';
        fullName='Vikram Singh a/l Karam'; phone='011-2700003';
        spec='Cybersecurity'; intake=2024;
        bio='Active CTF player (HackTheBox, picoCTF). Reverse engineering hobbyist with a small write-up blog. Hoping the FYP gives me an excuse to study how detection rules degrade on novel attack patterns rather than just running off-the-shelf scans.';
        researchInterests=@('Network Security','Intrusion Detection','Threat Hunting','Adversarial ML','Reverse Engineering');
        skills=@('Wireshark','Snort','Suricata','Python','Burp Suite','Ghidra','Bash','Splunk');
        cgpa='3.40'; expectedGraduation='2026-08';
        linkedin=''; github='https://github.com/vikram-singh-demo';
        supEmail='rajan.subramaniam@mmu.edu.my';
        proposalTitle='Concept-Drift-Resistant Intrusion Detection Using Stream-Based Online Learning';
    },

    # ----- PENDING — request sent, NOT yet accepted by the supervisor --------
    @{
        state='PENDING'; mmuId='1241400004'; email='tan.meixin@student.mmu.edu.my';
        fullName='Tan Mei Xin'; phone='011-2700004';
        spec='Game Development'; intake=2024;
        bio='Indie game dev hobbyist since high school. Shipped two small Unity puzzle games on itch.io. Want to use FYP to explore procedural content generation properly — the side projects so far were all hand-authored levels and the workflow does not scale.';
        researchInterests=@('Procedural Content Generation','Game Design','Computer Graphics','Level Design');
        skills=@('Unity','C#','Blender','Aseprite','HLSL','Git','Photoshop');
        cgpa='3.20'; expectedGraduation='2026-08';
        linkedin=''; github='https://github.com/tan-meixin-demo';
        supEmail='sarah.lee@mmu.edu.my';
        proposalTitle='Difficulty-Adaptive Procedural Level Generator for 2D Puzzle Platformers';
    },
    @{
        state='PENDING'; mmuId='1241400005'; email='lucas.chong@student.mmu.edu.my';
        fullName='Lucas Chong Yi Heng'; phone='011-2700005';
        spec='Software Engineering'; intake=2024;
        bio='Mobile-first developer. Built a small Flutter side project that helps my mum manage her bakery orders — it''s in production and processes about 30 orders a week. FYP idea is to generalise the workflow into a small-business-friendly OSS template.';
        researchInterests=@('Mobile Development','Cross-Platform Apps','UX for Small Business','Offline-First Sync');
        skills=@('Flutter','Dart','Firebase','SQLite','Hive','Figma','Git','REST APIs');
        cgpa='3.30'; expectedGraduation='2026-08';
        linkedin='https://www.linkedin.com/in/lucas-chong-demo'; github='https://github.com/lucas-chong-demo';
        supEmail='tan.weiming@mmu.edu.my';
        proposalTitle='Offline-First Order-Management Template for Micro-Enterprise SMEs';
    },

    # ----- UNPAIRED — no requests yet ---------------------------------------
    @{
        state='UNPAIRED'; mmuId='1241400006'; email='mohd.ariffin@student.mmu.edu.my';
        fullName='Mohd Ariffin bin Yusof'; phone='011-2700006';
        spec='Information Systems'; intake=2024;
        bio='Coming in from a 12-month internship at a fintech in KL. Saw firsthand how much process pain a small CRM customisation can cause. Thinking about an FYP around no-code workflow automation, but I would value supervisor advice on whether to go research-leaning or build-leaning.';
        researchInterests=@('Business Process Automation','Enterprise Systems','No-Code Platforms','Workflow Engines','Process Mining');
        skills=@('Salesforce','PowerApps','SQL','UML','Visio','Jira','Confluence','SAP');
        cgpa='3.05'; expectedGraduation='2026-08';
        linkedin='https://www.linkedin.com/in/mohd-ariffin-demo'; github='';
        supEmail=$null; proposalTitle=$null;
    },
    @{
        state='UNPAIRED'; mmuId='1241400007'; email='priya.lakshmi@student.mmu.edu.my';
        fullName='Priya Lakshmi a/p Murugan'; phone='011-2700007';
        spec='Data Science'; intake=2024;
        bio='Data science student with a deep interest in healthcare informatics. Volunteered at a community clinic over the last semester and got curious about whether we can build something useful with the patient-flow data they already collect. Open to either ML modelling or a dashboard-style project.';
        researchInterests=@('Healthcare Informatics','Data Visualisation','Predictive Analytics','Clinical Decision Support','Anomaly Detection');
        skills=@('Python','Pandas','Plotly','Streamlit','SQL','Power BI','scikit-learn');
        cgpa='3.65'; expectedGraduation='2026-08';
        linkedin='https://www.linkedin.com/in/priya-lakshmi-demo'; github='https://github.com/priya-lakshmi-demo';
        supEmail=$null; proposalTitle=$null;
    },
    @{
        state='UNPAIRED'; mmuId='1241400008'; email='sherwin.lim@student.mmu.edu.my';
        fullName='Sherwin Lim Zheng Wei'; phone='011-2700008';
        spec='Cybersecurity'; intake=2024;
        bio='Cybersecurity track. Built a small smart-contract auditing toolkit as a year-2 elective project — caught one reentrancy bug in a friend''s testnet contract. Curious whether the same approach works on cross-chain bridges, which seem to be where the bigger exploits are happening this year.';
        researchInterests=@('Blockchain Security','Smart Contract Auditing','Cross-Chain Bridges','Formal Verification','Web3 Security');
        skills=@('Solidity','Foundry','Slither','Mythril','Python','Hardhat','Rust','Ethers.js');
        cgpa='3.45'; expectedGraduation='2026-08';
        linkedin=''; github='https://github.com/sherwin-lim-demo';
        supEmail=$null; proposalTitle=$null;
    }
)

# ---- Helpers -----------------------------------------------------------------

function Invoke-Api {
    param([string] $Method, [string] $Path, $Body = $null, [string] $Token = $null)
    $h = @{}
    if ($Token) { $h['Authorization'] = "Bearer $Token" }
    $p = @{ Method=$Method; Uri="$BaseUrl$Path"; Headers=$h }
    if ($null -ne $Body) {
        $p['Body'] = ($Body | ConvertTo-Json -Depth 10)
        $p['ContentType'] = 'application/json'
    }
    return Invoke-RestMethod @p
}
function Login {
    param([string] $Email, [string] $Pwd)
    return (Invoke-Api -Method POST -Path '/auth/login' -Body @{ identifier=$Email; password=$Pwd }).accessToken
}
function Try-Register {
    param($Body)
    try { Invoke-Api -Method POST -Path '/auth/register' -Body $Body | Out-Null; return 'registered' }
    catch {
        $body = ''
        try { $stream = $_.Exception.Response.GetResponseStream()
              $reader = New-Object System.IO.StreamReader($stream)
              $body = $reader.ReadToEnd() } catch {}
        if ($body -match 'already' -or $body -match 'duplicate') { return 'existed' }
        throw "register failed: $($_.Exception.Message) $body"
    }
}

# Build proposal content with all 8 sections present so it scores reasonably on the analyser.
function New-DraftProposal {
    param([hashtable] $S)
    @{
        title = $S.proposalTitle
        problemStatement = "Industry observation in the $($S.spec.ToLower()) space shows that existing solutions in this area are either expensive proprietary offerings or research prototypes that have not been productionised. This project addresses that gap by building $($S.proposalTitle.ToLower()) and evaluating it on a realistic dataset."
        objectives = @(
            "To design and implement a working prototype of $($S.proposalTitle.ToLower()).",
            "To benchmark the prototype against an established baseline on at least three measurable dimensions.",
            "To produce a reusable artifact (code + documentation) that future FYP cohorts can extend."
        )
        methodology = "The project follows an iterative design-science methodology. A literature review of prior work in this area identifies the relevant strands and the state of the art. Implementation proceeds in three sprints of build + evaluate + refine, with the empirical evaluation taking place in trimester 2. Testing covers unit, integration, and an end-to-end empirical study."
        scope = "In scope: the core feature set described in the objectives, evaluated on one cohort / dataset / cluster (depending on domain). Out of scope: multi-tenant deployment, mobile-native UI (where the prototype is web-based), commercial licensing. Constraints: must run on the MMU FCI lab hardware (no GPU), must complete the empirical study within one trimester, and must be releasable as open-source."
        expectedOutcomes = @(
            "A working open-source prototype.",
            "An empirical results report comparing the prototype against the baseline.",
            "A short conference paper drafted from the results."
        )
        timeline = "Trimester 1 weeks 1-4: literature review and ethics. Weeks 5-12: implementation and baseline measurement. Weeks 13-14: FYP1 report. Trimester 2 weeks 1-10: empirical study. Weeks 11-14: FYP2 report and viva."
        specialisation = $S.spec
    }
}

# ============================================================================
# 1. Admin login + roster pre-approval
# ============================================================================
Write-Host "`n[1] Admin login + student roster pre-approval ..." -ForegroundColor Cyan
$adminToken = Login -Email $AdminEmail -Pwd $AdminPwd
$csvLines = @('mmuId,email,fullName,programme,specialisation,faculty,intakeYear')
foreach ($s in $Students) {
    $csvLines += "$($s.mmuId),$($s.email),$($s.fullName),,$($s.spec),,$($s.intake)"
}
$tmp = Join-Path $env:TEMP "roster_$(Get-Random).csv"
Set-Content -Path $tmp -Value ($csvLines -join "`n") -Encoding UTF8
try {
    $resp = & curl.exe --silent --show-error `
        -X POST "$BaseUrl/admin/roster/students/import" `
        -H "Authorization: Bearer $adminToken" `
        -F "file=@$tmp;type=text/csv"
    $j = $resp | ConvertFrom-Json
    Write-Host "    roster: imported=$($j.imported) updated=$($j.updated) errors=$($j.errorCount)" -ForegroundColor Green
} finally { Remove-Item $tmp -ErrorAction SilentlyContinue }

# ============================================================================
# 2. Register + fill profiles
# ============================================================================
Write-Host "`n[2] Registering students + filling profiles ..." -ForegroundColor Cyan
$tokens = @{}
foreach ($s in $Students) {
    $r = Try-Register @{
        role='STUDENT'; fullName=$s.fullName; mmuId=$s.mmuId; email=$s.email;
        phone=$s.phone; password=$Pwd; specialisation=$s.spec; intakeYear=$s.intake;
        acceptedPrivacyNotice=$true; privacyNoticeVersion='1.0'
    }
    Write-Host "    [$($s.state)] $($s.email) -> $r" -ForegroundColor DarkCyan
    $tok = Login -Email $s.email -Pwd $Pwd
    $tokens[$s.email] = $tok
    $upd = @{
        bio=$s.bio; skills=$s.skills; researchInterests=$s.researchInterests;
        cgpa=$s.cgpa; expectedGraduation=$s.expectedGraduation;
        specialisation=$s.spec; intakeYear=$s.intake; phone=$s.phone
    }
    if ($s.linkedin) { $upd['linkedinUrl'] = $s.linkedin }
    if ($s.github)   { $upd['githubUrl']   = $s.github }
    Invoke-Api -Method PUT -Path '/student/profile' -Token $tok -Body $upd | Out-Null
    Write-Host "        profile filled (interests=$($s.researchInterests.Count), skills=$($s.skills.Count), cgpa=$($s.cgpa))" -ForegroundColor Green
}

# ============================================================================
# 3. Pair the PAIRED set: send request, supervisor accepts, draft proposal
# ============================================================================
Write-Host "`n[3] Pair PAIRED students + send requests for PENDING ..." -ForegroundColor Cyan
$supTokens = @{}
foreach ($s in ($Students | Where-Object { $_.supEmail })) {
    if (-not $supTokens.ContainsKey($s.supEmail)) {
        $supTokens[$s.supEmail] = Login -Email $s.supEmail -Pwd $Pwd
    }
    $supList = Invoke-Api -Method GET -Path '/admin/users?role=SUPERVISOR&size=20' -Token $adminToken
    $supUser = $supList.users | Where-Object { $_.email -eq $s.supEmail } | Select-Object -First 1
    $supUserId = [int64]$supUser.userId
    $stuTok = $tokens[$s.email]
    try {
        Invoke-Api -Method POST -Path '/student/supervision-requests' -Token $stuTok -Body @{
            supervisorId=$supUserId; proposedTitle=$s.proposalTitle;
            topicDescription="Topic alignment with $($supUser.fullName)'s research areas.";
            message="Hi $($supUser.fullName), I would like to be supervised by you for my FYP1."
        } | Out-Null
        Write-Host "    [$($s.state)] $($s.email) -> request to $($s.supEmail)" -ForegroundColor DarkCyan
    } catch {
        if (-not ($_.Exception.Message -match 'already')) { throw }
    }
    if ($s.state -eq 'PAIRED') {
        $list = Invoke-Api -Method GET -Path '/student/supervision-requests' -Token $stuTok
        $match = $list.requests | Where-Object { $_.status -eq 'PENDING' -and ([int64]$_.supervisor.userId -eq $supUserId) } | Select-Object -First 1
        if ($match) {
            $rid = [int64]$match.requestId
            Invoke-Api -Method POST -Path "/supervisor/requests/$rid/respond" -Token $supTokens[$s.supEmail] -Body @{
                action='ACCEPT'; responseMessage='Happy to supervise this. Let''s schedule a first meeting next week.'
            } | Out-Null
            Write-Host "        request #$rid ACCEPTED by $($s.supEmail)" -ForegroundColor Green
        }
    }
}

# ============================================================================
# 4. Draft proposals for PAIRED students (stays in DRAFT — supervisor must review later)
# ============================================================================
Write-Host "`n[4] Draft proposals for the 3 paired students ..." -ForegroundColor Cyan
foreach ($s in ($Students | Where-Object { $_.state -eq 'PAIRED' })) {
    $tok = $tokens[$s.email]
    $p = New-DraftProposal -S $s
    try {
        Invoke-Api -Method POST -Path '/student/proposal' -Token $tok -Body $p | Out-Null
        Write-Host "    [PAIRED] $($s.email) — DRAFT proposal: $($p.title)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -match 'already') {
            Invoke-Api -Method PUT -Path '/student/proposal' -Token $tok -Body $p | Out-Null
            Write-Host "    [PAIRED] $($s.email) — proposal updated (already existed)" -ForegroundColor DarkGray
        } else { throw }
    }
}

# ============================================================================
# 5. Final summary
# ============================================================================
Write-Host "`n[5] Final state ..." -ForegroundColor Cyan
foreach ($s in $Students) {
    $tok = $tokens[$s.email]
    $dash = Invoke-Api -Method GET -Path '/student/dashboard' -Token $tok
    $reg = $dash.registrationStatus
    $supName = if ($reg.supervisor) { $reg.supervisor.fullName } else { '—' }
    Write-Host ("    [{0,-8}] {1,-38} status={2,-20} supervisor={3}" -f `
        $s.state, $s.email, $reg.status, $supName) -ForegroundColor White
}

Write-Host "`nDone. Password for all 8 new accounts: $Pwd" -ForegroundColor Cyan
