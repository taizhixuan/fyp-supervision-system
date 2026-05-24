# Committee Projects & Reports Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/committee/projects` and `/committee/reports` so every value is real (no hardcoded cycle/progress/risk), filters apply server-side, exports work as one-click downloads in CSV/XLSX/PDF, and reports trim to 5 types that actually produce useful output.

**Architecture:** Backend introduces `ProjectProgressService` (proposal + meeting-log + conducted-meeting + time signals) and split renderers (`Csv/Xlsx/PdfReportRenderer`) reused by both project export and reports module. Cycle filter dropdown sourced from new `GET /committee/cycles`. Frontend replaces the `cycle: "FYP1"` string with structured cycle fields, switches to server-side pagination via existing `<Pagination>` component, and deletes the standalone export page in favour of a header dropdown.

**Tech Stack:** Spring Boot 3.2 (Java 17, Lombok, JPA Specifications), Apache POI 5.2.5 (XLSX), OpenPDF 1.3.30 (PDF), React 18 + TypeScript + TanStack Query, Tailwind. MySQL 8 owned by Flyway.

**Spec:** `docs/superpowers/specs/2026-05-25-committee-projects-and-reports-rebuild-design.md`

**Working conventions for every task below:**
- Project commit policy is in root `CLAUDE.md`: short lowercase imperative messages, no Conventional-Commit prefixes, no Co-Authored-By, no AI marketing words. Stage files by name.
- Frontend lint must stay clean: `cd frontend && npm run lint` returns 0 warnings.
- Backend compile sanity: `cd backend && mvn -q -DskipTests compile` must succeed.
- After modifying `pom.xml` run `mvn -q -DskipTests compile` so dependency resolution happens before tests.
- Never edit V1-V36 migrations. Only V37 below is new.
- Add `@Builder.Default` on any new entity field with a default initializer.

---

## File structure

### Backend — new
- `backend/src/main/resources/db/migration/V37__generated_report_status_and_size.sql`
- `backend/src/main/java/com/fyp/supervision/service/ProjectProgressService.java`
- `backend/src/main/java/com/fyp/supervision/service/report/CsvReportRenderer.java`
- `backend/src/main/java/com/fyp/supervision/service/report/XlsxReportRenderer.java`
- `backend/src/main/java/com/fyp/supervision/service/report/PdfReportRenderer.java`
- `backend/src/main/java/com/fyp/supervision/service/report/ReportFormat.java`  (enum)
- `backend/src/main/java/com/fyp/supervision/service/ProjectExportService.java`
- `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeCycleController.java`
- `backend/src/test/java/com/fyp/supervision/service/ProjectProgressServiceTest.java`

### Backend — modified
- `backend/pom.xml` (add poi-ooxml, openpdf)
- `backend/src/main/java/com/fyp/supervision/entity/GeneratedReport.java` (+ `status`, `fileSize`)
- `backend/src/main/java/com/fyp/supervision/repository/ProjectRepository.java` (extend `JpaSpecificationExecutor`)
- `backend/src/main/java/com/fyp/supervision/repository/FypCycleRepository.java` (status-ordered list)
- `backend/src/main/java/com/fyp/supervision/repository/MeetingRepository.java` (`countByProjectAndStatus`, `findMaxConfirmedStartAt`)
- `backend/src/main/java/com/fyp/supervision/repository/SupervisorRequestRepository.java` (`findMaxSubmittedAt` for student)
- `backend/src/main/java/com/fyp/supervision/service/CommitteeService.java`
- `backend/src/main/java/com/fyp/supervision/service/CommitteeReportService.java`
- `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeProjectController.java`
- `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeReportController.java`

### Frontend — new
- (no new files — reuses `components/ui/Pagination.tsx`)

### Frontend — modified
- `frontend/src/types/committee.ts`
- `frontend/src/types/index.ts`
- `frontend/src/lib/hooks/useCommittee.ts`
- `frontend/src/lib/constants/routes.ts`
- `frontend/src/app/router.tsx`
- `frontend/src/pages/committee/ProjectOverview.tsx`
- `frontend/src/pages/committee/ProjectDetail.tsx`
- `frontend/src/pages/committee/UnpairedStudents.tsx`
- `frontend/src/pages/committee/SupervisorLoad.tsx`
- `frontend/src/pages/committee/SupervisorLoadDetail.tsx`
- `frontend/src/pages/committee/ReportsModule.tsx`
- `frontend/src/pages/committee/ReportsHistory.tsx`
- `frontend/src/pages/committee/index.ts`
- `frontend/src/components/layout/SideNav.tsx` (only if a link references EXPORT_OVERVIEW)

### Frontend — deleted
- `frontend/src/pages/committee/ExportOverview.tsx`

---

# Phase 1 — Backend foundations

## Task 1: Add V37 migration for `generated_report.status` and `file_size`

**Files:**
- Create: `backend/src/main/resources/db/migration/V37__generated_report_status_and_size.sql`

- [ ] **Step 1: Verify V37 is the next free number**

Run: `ls backend/src/main/resources/db/migration/ | sort -V | tail -5`
Expected: ends at `V36__announcement_read.sql`. If a V37 already exists, stop and use the next free number; update all references below.

- [ ] **Step 2: Write the migration**

Create `backend/src/main/resources/db/migration/V37__generated_report_status_and_size.sql`:

```sql
-- V37: generated_report adds status (sync default COMPLETED) and file_size (bytes)
ALTER TABLE generated_report
  ADD COLUMN file_size BIGINT NULL AFTER file_path,
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' AFTER format;

CREATE INDEX idx_report_status ON generated_report(status);
```

- [ ] **Step 3: Run backend to apply migration**

Run: `cd backend && mvn -q -DskipTests spring-boot:run` (Ctrl+C once you see `Started SupervisionApplication`).
Expected: Flyway log line `Migrating schema ... to version 37 - generated report status and size`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/resources/db/migration/V37__generated_report_status_and_size.sql
git commit -m "V37 add status + file_size to generated_report"
```

---

## Task 2: Extend `GeneratedReport` entity with `status` and `fileSize`

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/entity/GeneratedReport.java`

- [ ] **Step 1: Add the fields**

Edit the entity to add the two columns after `filePath`:

```java
    @Column(name = "file_size")
    private Long fileSize;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "COMPLETED";
```

(Place after the existing `filePath` field and before `filtersJson`. Keep the file otherwise unchanged.)

- [ ] **Step 2: Verify compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/entity/GeneratedReport.java
git commit -m "add status + fileSize to GeneratedReport entity"
```

---

## Task 3: Add POI + OpenPDF dependencies

**Files:**
- Modify: `backend/pom.xml`

- [ ] **Step 1: Find the closing `</dependencies>` block**

Run: `grep -n "</dependencies>" backend/pom.xml`
Expected: one line number, e.g. `145`.

- [ ] **Step 2: Insert the two dependencies just before `</dependencies>`**

Add (immediately above the closing tag, indented with 8 spaces to match siblings):

```xml
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>5.2.5</version>
        </dependency>
        <dependency>
            <groupId>com.github.librepdf</groupId>
            <artifactId>openpdf</artifactId>
            <version>1.3.30</version>
        </dependency>
```

- [ ] **Step 3: Resolve dependencies**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS. POI/OpenPDF jars download on first run.

- [ ] **Step 4: Commit**

```bash
git add backend/pom.xml
git commit -m "add poi + openpdf for xlsx/pdf reports"
```

---

## Task 4: Extend `FypCycleRepository` with status-ordered listing

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/repository/FypCycleRepository.java`

- [ ] **Step 1: Read the file to know where to insert**

Read: `backend/src/main/java/com/fyp/supervision/repository/FypCycleRepository.java`

- [ ] **Step 2: Add the method**

Insert immediately above the closing `}`:

```java
    /**
     * List every cycle ordered by status priority (ACTIVE > UPCOMING > COMPLETED > ARCHIVED)
     * then most-recent start date. Used by the committee cycle dropdown.
     */
    @Query("select c from FypCycle c order by " +
           "case c.status when com.fyp.supervision.enums.CycleStatus.ACTIVE then 0 " +
           "when com.fyp.supervision.enums.CycleStatus.UPCOMING then 1 " +
           "when com.fyp.supervision.enums.CycleStatus.COMPLETED then 2 " +
           "when com.fyp.supervision.enums.CycleStatus.ARCHIVED then 3 else 4 end, " +
           "c.startDate desc")
    List<FypCycle> findAllOrderedForDropdown();
```

If `@Query` import is missing, add `import org.springframework.data.jpa.repository.Query;` to the imports.

- [ ] **Step 3: Verify compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/repository/FypCycleRepository.java
git commit -m "add cycle dropdown ordered listing"
```

---

## Task 5: Extend `MeetingRepository` with conducted-meeting helpers

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/repository/MeetingRepository.java`

- [ ] **Step 1: Read the file**

Read: `backend/src/main/java/com/fyp/supervision/repository/MeetingRepository.java`

- [ ] **Step 2: Add the two methods**

Insert immediately above the closing `}`:

```java
    long countByProject_ProjectIdAndStatus(Long projectId, com.fyp.supervision.enums.MeetingStatus status);

    @Query("select max(m.confirmedStartAt) from Meeting m " +
           "where m.project.projectId = :projectId and m.status = :status")
    java.util.Optional<java.time.LocalDateTime> findMaxConfirmedStartAtByProjectAndStatus(
            @org.springframework.data.repository.query.Param("projectId") Long projectId,
            @org.springframework.data.repository.query.Param("status") com.fyp.supervision.enums.MeetingStatus status);
```

If a `@Query` / `@Param` import already exists, the fully-qualified names above still compile — leave them as written for self-containment.

- [ ] **Step 3: Verify compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/repository/MeetingRepository.java
git commit -m "add conducted meeting count + last meeting query"
```

---

## Task 6: Extend `SupervisorRequestRepository` with last-request lookup

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/repository/SupervisorRequestRepository.java`

- [ ] **Step 1: Add the method**

Insert immediately above the closing `}`:

```java
    @org.springframework.data.jpa.repository.Query(
        "select max(r.submittedAt) from SupervisorRequest r where r.student.userId = :studentUserId")
    java.util.Optional<java.time.LocalDateTime> findMaxSubmittedAtByStudent_UserId(
        @org.springframework.data.repository.query.Param("studentUserId") Long studentUserId);
```

- [ ] **Step 2: Verify compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/repository/SupervisorRequestRepository.java
git commit -m "add last-request lookup for unpaired student stats"
```

---

## Task 7: Make `ProjectRepository` Specification-capable

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/repository/ProjectRepository.java`

- [ ] **Step 1: Add the interface marker**

Open the file. Change the declaration line:

From:
```java
public interface ProjectRepository extends JpaRepository<Project, Long> {
```
To:
```java
public interface ProjectRepository extends JpaRepository<Project, Long>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<Project> {
```

- [ ] **Step 2: Verify compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/repository/ProjectRepository.java
git commit -m "enable JpaSpecificationExecutor on ProjectRepository"
```

---

# Phase 2 — Project progress + risk service (TDD)

## Task 8: Define `ProjectProgressService` skeleton with a failing test

**Files:**
- Create: `backend/src/main/java/com/fyp/supervision/service/ProjectProgressService.java`
- Create: `backend/src/test/java/com/fyp/supervision/service/ProjectProgressServiceTest.java`

- [ ] **Step 1: Write the skeleton service**

```java
package com.fyp.supervision.service;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.enums.ProposalStatus;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectProgressService {

    public record ProjectRisk(String level, List<String> factors) {}

    private static final int CONDUCTED_TARGET = 8;
    private static final int LOG_TARGET = 6;

    private final ProposalRepository proposalRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogComplianceService meetingLogComplianceService;

    /** Composite 30/40/20/10 weighting documented in the spec. Returns 0..100. */
    public int progressFor(Project project) {
        if (project == null || project.getStudent() == null) return 0;
        Long studentId = project.getStudent().getUserId();
        String phase = phaseOf(project);

        int proposalScore = scoreProposal(studentId);
        int logScore = scoreMeetingLogs(studentId, phase);
        int conductedScore = scoreConducted(project.getProjectId());
        int timeScore = scoreTime(project);

        double weighted = 0.30 * proposalScore
                + 0.40 * logScore
                + 0.20 * conductedScore
                + 0.10 * timeScore;
        return (int) Math.round(weighted);
    }

    /** Rule-based risk. Returns LOW with empty factors for past cycles. */
    public ProjectRisk riskFor(Project project) {
        if (project == null) return new ProjectRisk("LOW", List.of());

        if (project.getCycle() != null && project.getCycle().getStatus() != null) {
            String s = project.getCycle().getStatus().name();
            if ("COMPLETED".equals(s) || "ARCHIVED".equals(s)) {
                return new ProjectRisk("LOW", List.of());
            }
        }

        List<String> factors = new ArrayList<>();
        Long studentId = project.getStudent() != null ? project.getStudent().getUserId() : null;
        boolean unpaired = project.getSupervisor() == null;
        long daysIn = daysSinceCycleStart(project);
        long cycleDuration = cycleDuration(project);
        int requiredByNow = cycleDuration > 0
                ? (int) Math.max(0, Math.round((double) LOG_TARGET * daysIn / cycleDuration))
                : 0;

        ProposalStatus proposalStatus = studentId != null
                ? proposalRepository.findByStudent_UserId(studentId)
                        .map(p -> p.getStatus()).orElse(null)
                : null;

        if (unpaired && daysIn > 30) {
            factors.add("Unpaired 30+ days into cycle");
        }
        if (proposalStatus == ProposalStatus.REJECTED) {
            factors.add("Proposal rejected");
        }
        if ((proposalStatus == null || proposalStatus == ProposalStatus.DRAFT) && daysIn > 30) {
            factors.add("Proposal not yet submitted");
        }

        int lockedLogs = studentId != null
                ? meetingLogComplianceService.completedLogCount(studentId, phaseOf(project))
                : 0;
        boolean veryBehindLogs = false;
        if (daysIn > 30 && lockedLogs < (requiredByNow / 2)) {
            factors.add("Behind on meeting logs (" + lockedLogs + " of expected " + requiredByNow + ")");
            if (daysIn > 60) veryBehindLogs = true;
        }

        java.util.Optional<LocalDateTime> lastConducted = meetingRepository
                .findMaxConfirmedStartAtByProjectAndStatus(project.getProjectId(), MeetingStatus.COMPLETED);
        if (lastConducted.isEmpty() && daysIn > 21) {
            factors.add("No meetings conducted yet");
        } else if (lastConducted.isPresent()) {
            long daysSince = ChronoUnit.DAYS.between(lastConducted.get().toLocalDate(), LocalDate.now());
            if (daysSince > 21) {
                factors.add("No conducted meeting in " + daysSince + " days");
            }
        }

        boolean high = (unpaired && daysIn > 30)
                || proposalStatus == ProposalStatus.REJECTED
                || veryBehindLogs;
        String level = high ? "HIGH" : (factors.isEmpty() ? "LOW" : "MEDIUM");
        return new ProjectRisk(level, factors);
    }

    // ===== helpers =====

    private String phaseOf(Project project) {
        String stage = project.getStage();
        if (stage != null && (stage.equalsIgnoreCase("FYP2") || stage.equalsIgnoreCase("FYP 2"))) {
            return "FYP2";
        }
        return "FYP1";
    }

    private int scoreProposal(Long studentId) {
        if (studentId == null) return 0;
        return proposalRepository.findByStudent_UserId(studentId)
                .map(p -> switch (p.getStatus()) {
                    case DRAFT -> 0;
                    case SUBMITTED -> 33;
                    case REVISION_REQUIRED -> 50;
                    case REJECTED -> 20;
                    case APPROVED -> 100;
                })
                .orElse(0);
    }

    private int scoreMeetingLogs(Long studentId, String phase) {
        int logs = meetingLogComplianceService.completedLogCount(studentId, phase);
        return Math.min(100, (int) Math.round(((double) logs / LOG_TARGET) * 100));
    }

    private int scoreConducted(Long projectId) {
        long count = meetingRepository.countByProject_ProjectIdAndStatus(projectId, MeetingStatus.COMPLETED);
        return Math.min(100, (int) Math.round(((double) count / CONDUCTED_TARGET) * 100));
    }

    private int scoreTime(Project project) {
        if (project.getCycle() == null) return 0;
        LocalDate start = project.getCycle().getStartDate();
        LocalDate end = project.getCycle().getEndDate();
        if (start == null || end == null) return 0;
        LocalDate today = LocalDate.now();
        long total = ChronoUnit.DAYS.between(start, end);
        if (total <= 0) return 100;
        long elapsed = ChronoUnit.DAYS.between(start, today);
        long pct = Math.round(((double) elapsed / total) * 100);
        return (int) Math.max(0, Math.min(100, pct));
    }

    private long daysSinceCycleStart(Project project) {
        if (project.getCycle() == null || project.getCycle().getStartDate() == null) return 0;
        return ChronoUnit.DAYS.between(project.getCycle().getStartDate(), LocalDate.now());
    }

    private long cycleDuration(Project project) {
        if (project.getCycle() == null || project.getCycle().getStartDate() == null
                || project.getCycle().getEndDate() == null) return 0;
        return ChronoUnit.DAYS.between(project.getCycle().getStartDate(), project.getCycle().getEndDate());
    }
}
```

- [ ] **Step 2: Write the test (failing first)**

Create `backend/src/test/java/com/fyp/supervision/service/ProjectProgressServiceTest.java`:

```java
package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.enums.ProposalStatus;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProposalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class ProjectProgressServiceTest {

    private ProposalRepository proposalRepository;
    private MeetingRepository meetingRepository;
    private MeetingLogComplianceService meetingLogComplianceService;
    private ProjectProgressService service;

    @BeforeEach
    void setUp() {
        proposalRepository = Mockito.mock(ProposalRepository.class);
        meetingRepository = Mockito.mock(MeetingRepository.class);
        meetingLogComplianceService = Mockito.mock(MeetingLogComplianceService.class);
        service = new ProjectProgressService(proposalRepository, meetingRepository, meetingLogComplianceService);
    }

    private Project sampleProject(Long projectId, Long studentId, boolean paired, String stage,
                                  LocalDate cycleStart, LocalDate cycleEnd, CycleStatus cycleStatus) {
        UserAccount student = UserAccount.builder().userId(studentId).build();
        UserAccount supervisor = paired ? UserAccount.builder().userId(99L).build() : null;
        FypCycle cycle = FypCycle.builder()
                .cycleId(1L).cycleCode("FYP1-T").cycleType("FYP1").academicYear("2024/2025")
                .startDate(cycleStart).endDate(cycleEnd).status(cycleStatus).build();
        return Project.builder()
                .projectId(projectId).cycle(cycle).student(student).supervisor(supervisor)
                .stage(stage).build();
    }

    @Test
    void progress_zero_when_nothing_done() {
        Project p = sampleProject(1L, 10L, true, "FYP1",
                LocalDate.now(), LocalDate.now().plusDays(120), CycleStatus.ACTIVE);
        when(proposalRepository.findByStudent_UserId(10L)).thenReturn(Optional.empty());
        when(meetingLogComplianceService.completedLogCount(eq(10L), any())).thenReturn(0);
        when(meetingRepository.countByProject_ProjectIdAndStatus(eq(1L), eq(MeetingStatus.COMPLETED))).thenReturn(0L);

        assertThat(service.progressFor(p)).isEqualTo(0);
    }

    @Test
    void progress_full_when_approved_six_logs_eight_meetings_full_cycle() {
        Project p = sampleProject(2L, 11L, true, "FYP1",
                LocalDate.now().minusDays(120), LocalDate.now(), CycleStatus.ACTIVE);
        Proposal proposal = Proposal.builder().status(ProposalStatus.APPROVED).build();
        when(proposalRepository.findByStudent_UserId(11L)).thenReturn(Optional.of(proposal));
        when(meetingLogComplianceService.completedLogCount(eq(11L), eq("FYP1"))).thenReturn(6);
        when(meetingRepository.countByProject_ProjectIdAndStatus(eq(2L), eq(MeetingStatus.COMPLETED))).thenReturn(8L);

        assertThat(service.progressFor(p)).isEqualTo(100);
    }

    @Test
    void risk_low_when_archived_cycle_regardless_of_signals() {
        Project p = sampleProject(3L, 12L, false, "FYP1",
                LocalDate.now().minusDays(200), LocalDate.now().minusDays(50), CycleStatus.COMPLETED);
        ProjectProgressService.ProjectRisk r = service.riskFor(p);
        assertThat(r.level()).isEqualTo("LOW");
        assertThat(r.factors()).isEmpty();
    }

    @Test
    void risk_high_when_unpaired_late_into_active_cycle() {
        Project p = sampleProject(4L, 13L, false, "FYP1",
                LocalDate.now().minusDays(45), LocalDate.now().plusDays(60), CycleStatus.ACTIVE);
        when(proposalRepository.findByStudent_UserId(13L)).thenReturn(Optional.empty());
        when(meetingLogComplianceService.completedLogCount(eq(13L), any())).thenReturn(0);
        when(meetingRepository.findMaxConfirmedStartAtByProjectAndStatus(eq(4L), eq(MeetingStatus.COMPLETED)))
                .thenReturn(Optional.empty());

        ProjectProgressService.ProjectRisk r = service.riskFor(p);
        assertThat(r.level()).isEqualTo("HIGH");
        assertThat(r.factors()).anyMatch(f -> f.startsWith("Unpaired 30+ days"));
    }

    @Test
    void risk_medium_when_no_recent_meeting_but_otherwise_okay() {
        Project p = sampleProject(5L, 14L, true, "FYP1",
                LocalDate.now().minusDays(45), LocalDate.now().plusDays(60), CycleStatus.ACTIVE);
        when(proposalRepository.findByStudent_UserId(14L))
                .thenReturn(Optional.of(Proposal.builder().status(ProposalStatus.APPROVED).build()));
        when(meetingLogComplianceService.completedLogCount(eq(14L), any())).thenReturn(3);
        when(meetingRepository.findMaxConfirmedStartAtByProjectAndStatus(eq(5L), eq(MeetingStatus.COMPLETED)))
                .thenReturn(Optional.of(LocalDateTime.now().minusDays(30)));

        ProjectProgressService.ProjectRisk r = service.riskFor(p);
        assertThat(r.level()).isEqualTo("MEDIUM");
        assertThat(r.factors()).anyMatch(f -> f.contains("No conducted meeting"));
    }
}
```

- [ ] **Step 3: Run the test, expect PASS (skeleton service is already complete)**

Run: `cd backend && mvn -q -Dtest=ProjectProgressServiceTest test`
Expected: 5 tests pass. If a `Proposal.builder().status(...)` line fails to compile, open `Proposal.java` and confirm `@Builder` is present — it is (verified in spec exploration).

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/ProjectProgressService.java backend/src/test/java/com/fyp/supervision/service/ProjectProgressServiceTest.java
git commit -m "add ProjectProgressService with composite progress + rule-based risk"
```

---

# Phase 3 — Cycles dropdown endpoint

## Task 9: Add `GET /committee/cycles`

**Files:**
- Create: `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeCycleController.java`

- [ ] **Step 1: Write the controller**

```java
package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/committee/cycles")
@RequiredArgsConstructor
public class CommitteeCycleController {

    private final FypCycleRepository fypCycleRepository;
    private final ProjectRepository projectRepository;

    @GetMapping
    public ResponseEntity<?> listCycles() {
        List<FypCycle> cycles = fypCycleRepository.findAllOrderedForDropdown();
        List<Map<String, Object>> out = cycles.stream().map(c -> {
            long count = projectRepository.findAllByCycleId(c.getCycleId(),
                    org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("cycleId", c.getCycleId());
            dto.put("cycleCode", c.getCycleCode());
            dto.put("cycleType", c.getCycleType());
            dto.put("academicYear", c.getAcademicYear());
            dto.put("semester", c.getSemester());
            dto.put("startDate", c.getStartDate() != null ? c.getStartDate().toString() : null);
            dto.put("endDate", c.getEndDate() != null ? c.getEndDate().toString() : null);
            dto.put("status", c.getStatus() != null ? c.getStatus().name() : null);
            dto.put("projectCount", count);
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("cycles", out, "total", out.size()));
    }
}
```

- [ ] **Step 2: Manual smoke**

Run the backend (`cd backend && mvn -q -DskipTests spring-boot:run` in another shell), then:
```
curl -s -H "Authorization: Bearer <committee-jwt>" http://localhost:8080/api/committee/cycles
```
Expected: JSON `{"cycles":[{"cycleId":..,"cycleCode":..,"status":..,"projectCount":..}],"total":N}` ordered ACTIVE first.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeCycleController.java
git commit -m "add GET /committee/cycles for dropdowns"
```

---

# Phase 4 — `/committee/projects` filters + real DTO

## Task 10: Add `ProjectSpecifications` helper and switch service to specs

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/CommitteeService.java`

- [ ] **Step 1: Locate `getProjectDtos` and `buildProjectOverviewDto`**

Run: `grep -n "getProjectDtos\|buildProjectOverviewDto\|buildProjectDetailDto" backend/src/main/java/com/fyp/supervision/service/CommitteeService.java`
Expected: prints line numbers (~199, 235, 281).

- [ ] **Step 2: Inject `ProjectProgressService` into `CommitteeService`**

Open `CommitteeService.java`. Add (or extend) the constructor-injected fields. Since the class uses `@RequiredArgsConstructor` (verify with `grep -n "@RequiredArgsConstructor" backend/src/main/java/com/fyp/supervision/service/CommitteeService.java`), add the field near the other repositories:

```java
    private final ProjectProgressService projectProgressService;
    private final com.fyp.supervision.repository.SupervisorRequestRepository supervisorRequestRepository;
```

If `SupervisorRequestRepository` is already injected, do not add a duplicate.

- [ ] **Step 3: Replace `getProjectDtos` body**

Replace the existing `getProjectDtos(Long cycleId, Pageable pageable)` method with the new signature and implementation:

```java
    /** Returns project overview DTOs matching ProjectOverview. Filters apply server-side. */
    public Map<String, Object> getProjectDtos(
            Long cycleId,
            String cycleStatus,
            String projectStatus,
            String pairingStatus,
            String riskLevel,
            String search,
            org.springframework.data.domain.Pageable pageable) {

        org.springframework.data.jpa.domain.Specification<com.fyp.supervision.entity.Project> spec =
                (root, query, cb) -> cb.conjunction();

        if (cycleId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("cycle").get("cycleId"), cycleId));
        } else if (cycleStatus != null && !cycleStatus.isBlank()) {
            try {
                com.fyp.supervision.enums.CycleStatus cs =
                        com.fyp.supervision.enums.CycleStatus.valueOf(cycleStatus.toUpperCase());
                spec = spec.and((root, q, cb) -> cb.equal(root.get("cycle").get("status"), cs));
            } catch (IllegalArgumentException ignored) { }
        }
        if (projectStatus != null && !projectStatus.isBlank()) {
            try {
                com.fyp.supervision.enums.ProjectStatus ps =
                        com.fyp.supervision.enums.ProjectStatus.valueOf(projectStatus.toUpperCase());
                spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), ps));
            } catch (IllegalArgumentException ignored) { }
        }
        if (pairingStatus != null && !pairingStatus.isBlank()) {
            String ps = pairingStatus.toUpperCase();
            spec = spec.and((root, q, cb) -> switch (ps) {
                case "PAIRED" -> cb.isNotNull(root.get("supervisor"));
                case "UNPAIRED" -> cb.isNull(root.get("supervisor"));
                default -> cb.conjunction(); // PENDING_APPROVAL not modelled on Project today
            });
        }
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase().trim() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("projectTitle")), like),
                    cb.like(cb.lower(root.get("student").get("fullName")), like),
                    cb.like(cb.lower(root.get("student").get("mmuId")), like),
                    cb.like(cb.lower(root.get("supervisor").get("fullName")), like)
            ));
        }

        org.springframework.data.domain.Page<com.fyp.supervision.entity.Project> page =
                projectRepository.findAll(spec, pageable);

        java.util.List<java.util.Map<String, Object>> dtos = page.getContent().stream()
                .map(this::buildProjectOverviewDto)
                .filter(dto -> riskLevel == null || riskLevel.isBlank()
                        || riskLevel.equalsIgnoreCase((String) dto.get("riskLevel")))
                .collect(java.util.stream.Collectors.toList());

        return java.util.Map.of(
                "content", dtos,
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "number", page.getNumber(),
                "size", page.getSize());
    }
```

Risk is computed per-row and filtered after page fetch — acceptable for current data volume (≤ a few hundred projects). If `pageable.getSize()` × N pages exceeds 5000, revisit.

- [ ] **Step 4: Replace `buildProjectOverviewDto` body**

Replace the entire method (the one that currently hardcodes `cycle="FYP1"`, `progress=0`, `riskLevel="LOW"`) with:

```java
    public Map<String, Object> buildProjectOverviewDto(com.fyp.supervision.entity.Project project) {
        com.fyp.supervision.entity.UserAccount student = project.getStudent();
        com.fyp.supervision.entity.UserAccount supervisor = project.getSupervisor();
        com.fyp.supervision.entity.StudentProfile sp = student != null
                ? studentProfileRepository.findById(student.getUserId()).orElse(null) : null;

        String proposalStatus = "NOT_SUBMITTED";
        if (student != null) {
            com.fyp.supervision.entity.Proposal proposal =
                    proposalRepository.findByStudent_UserId(student.getUserId()).orElse(null);
            if (proposal != null) {
                proposalStatus = proposal.getStatus().name();
                if ("SUBMITTED".equals(proposalStatus)) proposalStatus = "PENDING_REVIEW";
                if ("REVISION_REQUIRED".equals(proposalStatus)) proposalStatus = "REVISION_REQUESTED";
            }
        }

        com.fyp.supervision.entity.FypCycle cycle = project.getCycle();
        int progress = projectProgressService.progressFor(project);
        ProjectProgressService.ProjectRisk risk = projectProgressService.riskFor(project);

        java.util.Map<String, Object> dto = new java.util.LinkedHashMap<>();
        dto.put("projectId", project.getProjectId());
        dto.put("title", project.getProjectTitle());
        dto.put("studentName", student != null ? student.getFullName() : "");
        dto.put("studentId", student != null ? student.getMmuId() : "");
        dto.put("studentEmail", student != null ? student.getEmail() : "");
        dto.put("programme", sp != null && sp.getProgramme() != null ? sp.getProgramme() : "");
        // Legacy field kept for one release; structured fields below replace it.
        dto.put("cycle", cycle != null && cycle.getCycleType() != null ? cycle.getCycleType() : "");
        dto.put("supervisorName", supervisor != null ? supervisor.getFullName() : null);
        dto.put("supervisorId", supervisor != null ? supervisor.getMmuId() : null);
        dto.put("pairingStatus", supervisor != null ? "PAIRED" : "UNPAIRED");
        dto.put("projectStatus", project.getStatus().name());
        dto.put("proposalStatus", proposalStatus);
        dto.put("progress", progress);
        dto.put("lastActivity", project.getUpdatedAt() != null ? project.getUpdatedAt().toString() : "");
        dto.put("riskLevel", risk.level());
        dto.put("riskFactors", risk.factors());

        if (cycle != null) {
            dto.put("cycleId", cycle.getCycleId());
            dto.put("cycleCode", cycle.getCycleCode());
            dto.put("cycleType", cycle.getCycleType());
            dto.put("academicYear", cycle.getAcademicYear());
            dto.put("cycleStatus", cycle.getStatus() != null ? cycle.getStatus().name() : null);
        } else {
            dto.put("cycleId", null);
            dto.put("cycleCode", null);
            dto.put("cycleType", null);
            dto.put("academicYear", null);
            dto.put("cycleStatus", null);
        }
        return dto;
    }
```

- [ ] **Step 5: Extend `buildProjectDetailDto` with the Engagement block**

Replace the method body with:

```java
    public Map<String, Object> buildProjectDetailDto(com.fyp.supervision.entity.Project project) {
        Map<String, Object> dto = buildProjectOverviewDto(project);
        dto.put("description", project.getDescription());
        dto.put("registeredAt", project.getRegisteredAt() != null ? project.getRegisteredAt().toString() : "");

        java.util.Map<String, Object> engagement = new java.util.LinkedHashMap<>();
        com.fyp.supervision.entity.UserAccount student = project.getStudent();
        String phase = (project.getStage() != null
                && (project.getStage().equalsIgnoreCase("FYP2") || project.getStage().equalsIgnoreCase("FYP 2")))
                ? "FYP2" : "FYP1";
        int locked = student != null
                ? meetingLogComplianceService.completedLogCount(student.getUserId(), phase) : 0;
        engagement.put("lockedLogs", locked);
        engagement.put("requiredLogs", meetingLogComplianceService.requiredLogCount(phase));
        long conducted = meetingRepository.countByProject_ProjectIdAndStatus(
                project.getProjectId(), com.fyp.supervision.enums.MeetingStatus.COMPLETED);
        engagement.put("completedMeetings", conducted);
        engagement.put("lastConductedMeetingAt", meetingRepository
                .findMaxConfirmedStartAtByProjectAndStatus(project.getProjectId(),
                        com.fyp.supervision.enums.MeetingStatus.COMPLETED)
                .map(java.time.LocalDateTime::toString).orElse(null));

        com.fyp.supervision.entity.Proposal latestProposal = student != null
                ? proposalRepository.findByStudent_UserId(student.getUserId()).orElse(null) : null;
        engagement.put("proposalStatus", latestProposal != null ? latestProposal.getStatus().name() : "NOT_SUBMITTED");
        engagement.put("proposalVersion", latestProposal != null ? latestProposal.getCurrentVersion() : 0);

        dto.put("engagement", engagement);
        dto.put("milestones", java.util.List.of()); // legacy field — empty; will be removed in next release
        dto.put("recentMeetings", java.util.List.of());
        dto.put("submissions", java.util.List.of());
        return dto;
    }
```

Confirm `meetingLogComplianceService` and `meetingRepository` are already injected; if not, add them as `private final` fields.

- [ ] **Step 6: Compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS. Any unresolved import means a field/inject was missed — add it and re-run.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/CommitteeService.java
git commit -m "real cycle + progress + risk on committee project DTOs, server-side filters"
```

---

## Task 11: Wire new filter params into `CommitteeProjectController`

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeProjectController.java`

- [ ] **Step 1: Replace the controller body**

```java
package com.fyp.supervision.controller.committee;

import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.service.CommitteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/projects")
@RequiredArgsConstructor
public class CommitteeProjectController {

    private final CommitteeService committeeService;
    private final FypCycleRepository fypCycleRepository;

    @GetMapping
    public ResponseEntity<?> getProjects(
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) String cycleStatus,
            @RequestParam(required = false) String projectStatus,
            @RequestParam(required = false) String pairingStatus,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String search,
            Pageable pageable) {

        // Default scope = ACTIVE cycles when caller passed no cycle filter at all.
        String effectiveCycleStatus = cycleStatus;
        if (cycleId == null && (cycleStatus == null || cycleStatus.isBlank())) {
            effectiveCycleStatus = "ACTIVE";
        }
        if ("ALL".equalsIgnoreCase(effectiveCycleStatus)) {
            effectiveCycleStatus = null;
        }

        Pageable effective = pageable.getSort().isSorted() ? pageable
                : org.springframework.data.domain.PageRequest.of(
                        pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "updatedAt"));

        return ResponseEntity.ok(committeeService.getProjectDtos(
                cycleId, effectiveCycleStatus, projectStatus, pairingStatus, riskLevel, search, effective));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.getProjectDetailDto(id));
    }

    @GetMapping("/unpaired-students")
    public ResponseEntity<?> getUnpairedStudents(@RequestParam(required = false) Long cycleId) {
        if (cycleId != null) {
            List<Map<String, Object>> students = committeeService.getUnpairedStudentDtos(cycleId);
            return ResponseEntity.ok(Map.of("students", students));
        }
        // No cycleId → union across all ACTIVE cycles
        List<Map<String, Object>> students = fypCycleRepository
                .findFirstByStatusOrderByStartDateDesc(CycleStatus.ACTIVE)
                .map(c -> committeeService.getUnpairedStudentDtos(c.getCycleId()))
                .orElseGet(List::of);
        return ResponseEntity.ok(Map.of("students", students));
    }

    @GetMapping("/supervisor-loads")
    public ResponseEntity<?> getSupervisorLoads() {
        List<Map<String, Object>> loads = committeeService.getSupervisorLoadDtos();
        return ResponseEntity.ok(Map.of("supervisors", loads));
    }

    @GetMapping("/supervisor-loads/{id}")
    public ResponseEntity<?> getSupervisorLoad(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.getSupervisorLoadDetailDto(id));
    }

    @PostMapping("/{id}/advance-phase")
    public ResponseEntity<?> advancePhase(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.advanceProjectPhase(id));
    }
}
```

- [ ] **Step 2: Compile and run smoke test**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

Run the backend, then:
```
curl -s -H "Authorization: Bearer <committee-jwt>" "http://localhost:8080/api/committee/projects?pairingStatus=UNPAIRED&size=5"
```
Expected: JSON `{ "content":[…], "totalElements":N, … }` where every row has `pairingStatus":"UNPAIRED"`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeProjectController.java
git commit -m "wire cycleId/projectStatus/pairingStatus/riskLevel/search filters"
```

---

## Task 12: Fix `getUnpairedStudentDtos` and `buildSupervisorLoadDto` (no more hardcodes)

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/CommitteeService.java`

- [ ] **Step 1: Replace `getUnpairedStudentDtos`**

Replace the entire method body with:

```java
    public List<Map<String, Object>> getUnpairedStudentDtos(Long cycleId) {
        List<com.fyp.supervision.entity.Project> projects = projectRepository.findUnpairedStudentsByCycle(cycleId);
        return projects.stream().map(p -> {
            com.fyp.supervision.entity.UserAccount student = p.getStudent();
            com.fyp.supervision.entity.StudentProfile sp = student != null
                    ? studentProfileRepository.findById(student.getUserId()).orElse(null) : null;
            com.fyp.supervision.entity.FypCycle c = p.getCycle();

            long sent = student != null ? supervisorRequestRepository
                    .countByStudent_UserIdAndStatus(student.getUserId(),
                            com.fyp.supervision.enums.RequestStatus.PENDING)
                + supervisorRequestRepository.countByStudent_UserIdAndStatus(student.getUserId(),
                            com.fyp.supervision.enums.RequestStatus.ACCEPTED)
                + supervisorRequestRepository.countByStudent_UserIdAndStatus(student.getUserId(),
                            com.fyp.supervision.enums.RequestStatus.REJECTED) : 0;
            long rejected = student != null ? supervisorRequestRepository
                    .countByStudent_UserIdAndStatus(student.getUserId(),
                            com.fyp.supervision.enums.RequestStatus.REJECTED) : 0;
            String lastRequestAt = student != null
                    ? supervisorRequestRepository.findMaxSubmittedAtByStudent_UserId(student.getUserId())
                            .map(java.time.LocalDateTime::toString).orElse(null)
                    : null;

            java.util.Map<String, Object> dto = new java.util.LinkedHashMap<>();
            dto.put("studentId", student != null ? student.getMmuId() : "");
            dto.put("userId", student != null ? student.getUserId().toString() : "");
            dto.put("fullName", student != null ? student.getFullName() : "");
            dto.put("email", student != null ? student.getEmail() : "");
            dto.put("programme", sp != null && sp.getProgramme() != null ? sp.getProgramme() : "");
            dto.put("cycle", c != null && c.getCycleType() != null ? c.getCycleType() : "");
            dto.put("cycleId", c != null ? c.getCycleId() : null);
            dto.put("cycleCode", c != null ? c.getCycleCode() : null);
            dto.put("cycleType", c != null ? c.getCycleType() : null);
            dto.put("academicYear", c != null ? c.getAcademicYear() : null);
            dto.put("cycleStatus", c != null && c.getStatus() != null ? c.getStatus().name() : null);
            dto.put("registeredAt", p.getRegisteredAt() != null ? p.getRegisteredAt().toString() : "");
            dto.put("requestsSent", sent);
            dto.put("requestsRejected", rejected);
            dto.put("lastRequestAt", lastRequestAt);
            dto.put("preferredAreas", sp != null ? parseJsonArray(sp.getInterests()) : java.util.List.of());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }
```

- [ ] **Step 2: Replace `buildSupervisorLoadDto`**

Replace the existing method with:

```java
    public Map<String, Object> buildSupervisorLoadDto(com.fyp.supervision.entity.SupervisorProfile profile) {
        com.fyp.supervision.entity.UserAccount user =
                userAccountRepository.findById(profile.getUserId()).orElse(null);
        java.util.List<com.fyp.supervision.entity.Project> projects =
                projectRepository.findActiveCycleBySupervisor(profile.getUserId());

        long fyp1Count = projects.stream()
                .filter(p -> p.getCycle() != null && "FYP1".equalsIgnoreCase(p.getCycle().getCycleType())).count();
        long fyp2Count = projects.stream()
                .filter(p -> p.getCycle() != null && "FYP2".equalsIgnoreCase(p.getCycle().getCycleType())).count();

        java.util.List<java.util.Map<String, Object>> students = projects.stream().map(p -> {
            com.fyp.supervision.entity.UserAccount stu = p.getStudent();
            com.fyp.supervision.entity.FypCycle c = p.getCycle();
            int prog = projectProgressService.progressFor(p);
            ProjectProgressService.ProjectRisk r = projectProgressService.riskFor(p);
            java.util.Map<String, Object> sDto = new java.util.LinkedHashMap<>();
            sDto.put("studentId", stu != null ? stu.getMmuId() : "");
            sDto.put("fullName", stu != null ? stu.getFullName() : "");
            sDto.put("cycle", c != null ? c.getCycleType() : "");
            sDto.put("cycleId", c != null ? c.getCycleId() : null);
            sDto.put("cycleCode", c != null ? c.getCycleCode() : null);
            sDto.put("cycleType", c != null ? c.getCycleType() : null);
            sDto.put("projectTitle", p.getProjectTitle());
            sDto.put("progress", prog);
            sDto.put("riskLevel", r.level());
            return sDto;
        }).collect(java.util.stream.Collectors.toList());

        double utilization = profile.getSupervisionQuota() > 0
                ? (double) profile.getCurrentLoad() / profile.getSupervisionQuota() * 100 : 0;

        java.util.Map<String, Object> dto = new java.util.LinkedHashMap<>();
        dto.put("supervisorId", user != null ? user.getMmuId() : "");
        dto.put("userId", profile.getUserId().toString());
        dto.put("fullName", user != null ? user.getFullName() : "");
        dto.put("email", user != null ? user.getEmail() : "");
        dto.put("department", profile.getDepartment() != null ? profile.getDepartment() : "");
        dto.put("currentLoad", profile.getCurrentLoad());
        dto.put("maxCapacity", profile.getSupervisionQuota());
        dto.put("fyp1Students", fyp1Count);
        dto.put("fyp2Students", fyp2Count);
        dto.put("utilizationRate", Math.round(utilization));
        dto.put("isOverloaded", profile.getCurrentLoad() > profile.getSupervisionQuota());
        dto.put("expertise", parseJsonArray(profile.getExpertise()));
        dto.put("students", students);
        return dto;
    }
```

- [ ] **Step 3: Compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/CommitteeService.java
git commit -m "real fyp1/fyp2 counts on supervisor load, real request counts on unpaired list"
```

---

# Phase 5 — Project export (CSV / XLSX / PDF)

## Task 13: Add `ReportFormat` enum and `CsvReportRenderer`

**Files:**
- Create: `backend/src/main/java/com/fyp/supervision/service/report/ReportFormat.java`
- Create: `backend/src/main/java/com/fyp/supervision/service/report/CsvReportRenderer.java`

- [ ] **Step 1: Write the enum**

```java
package com.fyp.supervision.service.report;

public enum ReportFormat {
    CSV("text/csv", "csv"),
    XLSX("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"),
    PDF("application/pdf", "pdf");

    public final String contentType;
    public final String extension;

    ReportFormat(String contentType, String extension) {
        this.contentType = contentType;
        this.extension = extension;
    }

    public static ReportFormat parse(String value) {
        if (value == null) return CSV;
        try { return valueOf(value.toUpperCase()); }
        catch (IllegalArgumentException e) { return CSV; }
    }
}
```

- [ ] **Step 2: Write the CSV renderer**

```java
package com.fyp.supervision.service.report;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class CsvReportRenderer {

    public byte[] render(List<String> headers, List<Map<String, Object>> rows, List<String> keys) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", headers.stream().map(CsvReportRenderer::escape).toList())).append("\n");
        for (Map<String, Object> r : rows) {
            for (int i = 0; i < keys.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(escape(r.get(keys.get(i))));
            }
            sb.append("\n");
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private static String escape(Object value) {
        if (value == null) return "";
        String s = value.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
```

- [ ] **Step 3: Compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/report/ReportFormat.java backend/src/main/java/com/fyp/supervision/service/report/CsvReportRenderer.java
git commit -m "add ReportFormat enum + CsvReportRenderer"
```

---

## Task 14: Add `XlsxReportRenderer`

**Files:**
- Create: `backend/src/main/java/com/fyp/supervision/service/report/XlsxReportRenderer.java`

- [ ] **Step 1: Write the renderer**

```java
package com.fyp.supervision.service.report;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class XlsxReportRenderer {

    public byte[] render(String sheetName, List<String> headers, List<Map<String, Object>> rows, List<String> keys) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet(safeSheetName(sheetName));
            Font bold = wb.createFont();
            bold.setBold(true);
            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFont(bold);

            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell c = header.createCell(i);
                c.setCellValue(headers.get(i));
                c.setCellStyle(headerStyle);
            }

            int r = 1;
            for (Map<String, Object> row : rows) {
                Row excelRow = sheet.createRow(r++);
                for (int i = 0; i < keys.size(); i++) {
                    Object v = row.get(keys.get(i));
                    Cell c = excelRow.createCell(i);
                    if (v == null) { c.setBlank(); continue; }
                    if (v instanceof Number n) { c.setCellValue(n.doubleValue()); }
                    else if (v instanceof Boolean b) { c.setCellValue(b); }
                    else { c.setCellValue(v.toString()); }
                }
            }

            for (int i = 0; i < headers.size(); i++) sheet.autoSizeColumn(i);
            sheet.createFreezePane(0, 1);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to build XLSX", e);
        }
    }

    private static String safeSheetName(String name) {
        if (name == null || name.isBlank()) return "Sheet1";
        String trimmed = name.replaceAll("[\\\\/\\?\\*\\[\\]:]", "_");
        return trimmed.length() > 31 ? trimmed.substring(0, 31) : trimmed;
    }
}
```

- [ ] **Step 2: Compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/report/XlsxReportRenderer.java
git commit -m "add XlsxReportRenderer using poi"
```

---

## Task 15: Add `PdfReportRenderer`

**Files:**
- Create: `backend/src/main/java/com/fyp/supervision/service/report/PdfReportRenderer.java`

- [ ] **Step 1: Write the renderer**

```java
package com.fyp.supervision.service.report;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
public class PdfReportRenderer {

    public byte[] render(String title, Map<String, String> filterChips,
                         List<String> headers, List<Map<String, Object>> rows, List<String> keys) {
        Document document = new Document(PageSize.A4.rotate(), 28, 28, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new PageNumberFooter());
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD);
            Font metaFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);
            Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
            Font cellFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

            Paragraph t = new Paragraph(title, titleFont);
            t.setSpacingAfter(4);
            document.add(t);

            String meta = "Generated " + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            if (!filterChips.isEmpty()) {
                StringBuilder sb = new StringBuilder(meta).append("   |   Filters: ");
                int i = 0;
                for (Map.Entry<String, String> e : filterChips.entrySet()) {
                    if (i++ > 0) sb.append(", ");
                    sb.append(e.getKey()).append("=").append(e.getValue());
                }
                meta = sb.toString();
            }
            Paragraph m = new Paragraph(meta, metaFont);
            m.setSpacingAfter(10);
            document.add(m);

            PdfPTable table = new PdfPTable(headers.size());
            table.setWidthPercentage(100);

            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(63, 63, 70));
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                table.addCell(cell);
            }
            for (Map<String, Object> row : rows) {
                for (String key : keys) {
                    Object v = row.get(key);
                    PdfPCell cell = new PdfPCell(new Phrase(v == null ? "" : v.toString(), cellFont));
                    cell.setPadding(4);
                    table.addCell(cell);
                }
            }
            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new RuntimeException("Failed to build PDF", e);
        }
    }

    private static class PageNumberFooter extends PdfPageEventHelper {
        private final Font font = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.GRAY);
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Phrase footer = new Phrase("Page " + writer.getPageNumber(), font);
            com.lowagie.text.pdf.ColumnText.showTextAligned(
                writer.getDirectContent(), Element.ALIGN_CENTER, footer,
                (document.right() - document.left()) / 2 + document.leftMargin(),
                document.bottom() - 10, 0);
        }
    }
}
```

- [ ] **Step 2: Compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS. OpenPDF lives under package `com.lowagie.text` — historical name, intentional.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/report/PdfReportRenderer.java
git commit -m "add PdfReportRenderer using openpdf"
```

---

## Task 16: Add `ProjectExportService` and export endpoint

**Files:**
- Create: `backend/src/main/java/com/fyp/supervision/service/ProjectExportService.java`
- Modify: `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeProjectController.java`

- [ ] **Step 1: Write the service**

```java
package com.fyp.supervision.service;

import com.fyp.supervision.service.report.CsvReportRenderer;
import com.fyp.supervision.service.report.PdfReportRenderer;
import com.fyp.supervision.service.report.ReportFormat;
import com.fyp.supervision.service.report.XlsxReportRenderer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProjectExportService {

    private static final List<String> HEADERS = List.of(
            "Project ID", "Title", "Student ID", "Student Name", "Programme",
            "Cycle Code", "Cycle Type", "Academic Year", "Cycle Status",
            "Supervisor", "Pairing", "Project Status", "Proposal Status",
            "Progress %", "Risk", "Risk Factors", "Last Activity");
    private static final List<String> KEYS = List.of(
            "projectId", "title", "studentId", "studentName", "programme",
            "cycleCode", "cycleType", "academicYear", "cycleStatus",
            "supervisorName", "pairingStatus", "projectStatus", "proposalStatus",
            "progress", "riskLevel", "riskFactorsCsv", "lastActivity");

    private final CommitteeService committeeService;
    private final CsvReportRenderer csv;
    private final XlsxReportRenderer xlsx;
    private final PdfReportRenderer pdf;

    public byte[] export(ReportFormat format,
                         Long cycleId, String cycleStatus, String projectStatus,
                         String pairingStatus, String riskLevel, String search) {

        Map<String, Object> page = committeeService.getProjectDtos(
                cycleId, cycleStatus, projectStatus, pairingStatus, riskLevel, search,
                PageRequest.of(0, 5000));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) page.getOrDefault("content", List.of());

        // riskFactors is a list; flatten for table renderers.
        for (Map<String, Object> r : rows) {
            Object factors = r.get("riskFactors");
            r.put("riskFactorsCsv", factors instanceof List<?> l
                    ? String.join("; ", l.stream().map(Object::toString).toList()) : "");
        }

        return switch (format) {
            case CSV -> csv.render(HEADERS, rows, KEYS);
            case XLSX -> xlsx.render("Projects", HEADERS, rows, KEYS);
            case PDF -> pdf.render(
                    "Committee · Projects Export · " + LocalDate.now(),
                    chips(cycleId, cycleStatus, projectStatus, pairingStatus, riskLevel, search),
                    HEADERS, rows, KEYS);
        };
    }

    private Map<String, String> chips(Long cycleId, String cycleStatus, String projectStatus,
                                      String pairingStatus, String riskLevel, String search) {
        Map<String, String> m = new LinkedHashMap<>();
        if (cycleId != null) m.put("cycleId", cycleId.toString());
        if (cycleStatus != null && !cycleStatus.isBlank()) m.put("cycleStatus", cycleStatus);
        if (projectStatus != null && !projectStatus.isBlank()) m.put("projectStatus", projectStatus);
        if (pairingStatus != null && !pairingStatus.isBlank()) m.put("pairingStatus", pairingStatus);
        if (riskLevel != null && !riskLevel.isBlank()) m.put("riskLevel", riskLevel);
        if (search != null && !search.isBlank()) m.put("search", search);
        return m;
    }
}
```

- [ ] **Step 2: Add the export endpoint to `CommitteeProjectController`**

Inject `ProjectExportService` (add to the constructor-injected fields) and add a method:

```java
    private final com.fyp.supervision.service.ProjectExportService projectExportService;

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportProjects(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) String cycleStatus,
            @RequestParam(required = false) String projectStatus,
            @RequestParam(required = false) String pairingStatus,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String search) {

        com.fyp.supervision.service.report.ReportFormat fmt =
                com.fyp.supervision.service.report.ReportFormat.parse(format);
        byte[] bytes = projectExportService.export(fmt, cycleId, cycleStatus, projectStatus,
                pairingStatus, riskLevel, search);
        String name = "projects-" + java.time.LocalDate.now() + "." + fmt.extension;

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + name + "\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, fmt.contentType)
                .body(bytes);
    }
```

- [ ] **Step 3: Compile + smoke**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

Run backend, then:
```
curl -sS -H "Authorization: Bearer <committee-jwt>" \
  "http://localhost:8080/api/committee/projects/export?format=csv&pairingStatus=UNPAIRED" -o out.csv
head -3 out.csv
```
Expected: header row matches `HEADERS` above, body has comma-separated rows.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/ProjectExportService.java backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeProjectController.java
git commit -m "add /committee/projects/export csv/xlsx/pdf"
```

---

# Phase 6 — Reports backend rebuild

## Task 17: Rebuild `CommitteeReportService`

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/CommitteeReportService.java`

- [ ] **Step 1: Replace the service**

Replace the entire file with:

```java
package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.GeneratedReport;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.GeneratedReportRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.report.CsvReportRenderer;
import com.fyp.supervision.service.report.PdfReportRenderer;
import com.fyp.supervision.service.report.ReportFormat;
import com.fyp.supervision.service.report.XlsxReportRenderer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommitteeReportService {

    private static final List<String> TYPES = List.of(
            "PAIRING_STATUS", "SUPERVISOR_LOAD", "PROPOSAL_SUMMARY",
            "MEETING_LOG_COMPLIANCE", "RISK_ASSESSMENT");

    private final CommitteeService committeeService;
    private final ProjectProgressService projectProgressService;
    private final MeetingLogComplianceService meetingLogComplianceService;
    private final GeneratedReportRepository generatedReportRepository;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageConfig fileStorageConfig;
    private final CsvReportRenderer csv;
    private final XlsxReportRenderer xlsx;
    private final PdfReportRenderer pdf;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> getReportDtos() {
        return generatedReportRepository.findAllByOrderByGeneratedAtDesc().stream()
                .map(this::toReportDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> generateReport(Long userId, Map<String, Object> config) throws IOException {
        String reportType = (String) config.getOrDefault("reportType", "PROPOSAL_SUMMARY");
        if (!TYPES.contains(reportType)) reportType = "PROPOSAL_SUMMARY";
        ReportFormat format = ReportFormat.parse((String) config.getOrDefault("format", "CSV"));
        String title = (String) config.getOrDefault("title", reportType + " · " + LocalDate.now());
        @SuppressWarnings("unchecked")
        Map<String, Object> filters = config.get("filters") instanceof Map
                ? (Map<String, Object>) config.get("filters") : Map.of();

        UserAccount generatedBy = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GeneratedReport report = GeneratedReport.builder()
                .reportType(reportType)
                .title(title)
                .generatedBy(generatedBy)
                .generatedAt(LocalDateTime.now())
                .format(format.name())
                .status("COMPLETED")
                .filtersJson(objectMapper.writeValueAsString(filters))
                .expiresAt(LocalDateTime.now().plusMonths(3))
                .build();
        report = generatedReportRepository.save(report);

        byte[] bytes;
        try {
            bytes = buildBytes(reportType, format, filters);
        } catch (Exception e) {
            report.setStatus("FAILED");
            generatedReportRepository.save(report);
            throw new IOException("Failed to render report: " + e.getMessage(), e);
        }

        Path reportsDir = fileStorageConfig.getUploadPath().resolve("reports");
        Files.createDirectories(reportsDir);
        Path filePath = reportsDir.resolve(report.getReportId() + "." + format.extension);
        Files.write(filePath, bytes);

        report.setFilePath("reports/" + report.getReportId() + "." + format.extension);
        report.setFileSize((long) bytes.length);
        report = generatedReportRepository.save(report);

        return toReportDto(report);
    }

    public Path getReportFilePath(Long reportId) {
        GeneratedReport report = generatedReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getFilePath() == null || report.getFilePath().isBlank()) {
            throw new ResourceNotFoundException("Report file not found");
        }
        Path path = fileStorageConfig.getUploadPath().resolve(report.getFilePath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Report file not found");
        }
        return path;
    }

    public ReportFormat getReportFormat(Long reportId) {
        return generatedReportRepository.findById(reportId)
                .map(r -> ReportFormat.parse(r.getFormat()))
                .orElse(ReportFormat.CSV);
    }

    @Transactional
    public void deleteReport(Long reportId) throws IOException {
        GeneratedReport report = generatedReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getFilePath() != null && !report.getFilePath().isBlank()) {
            Path path = fileStorageConfig.getUploadPath().resolve(report.getFilePath());
            if (Files.exists(path)) Files.delete(path);
        }
        generatedReportRepository.delete(report);
    }

    private Map<String, Object> toReportDto(GeneratedReport r) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("reportId", r.getReportId());
        dto.put("reportType", r.getReportType());
        dto.put("title", r.getTitle());
        dto.put("status", r.getStatus() != null ? r.getStatus() : "COMPLETED");
        dto.put("generatedBy", r.getGeneratedBy() != null ? r.getGeneratedBy().getFullName() : "");
        dto.put("generatedAt", r.getGeneratedAt() != null ? r.getGeneratedAt().toString() : "");
        dto.put("format", r.getFormat());
        dto.put("fileSize", r.getFileSize() != null ? r.getFileSize() : 0);
        dto.put("downloadUrl", "/api/committee/reports/" + r.getReportId() + "/download");
        dto.put("filters", r.getFiltersJson() != null ? parseFilters(r.getFiltersJson()) : Map.of());
        dto.put("expiresAt", r.getExpiresAt() != null ? r.getExpiresAt().toString() : null);
        return dto;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseFilters(String json) {
        try { return objectMapper.readValue(json, Map.class); }
        catch (Exception e) { return Map.of(); }
    }

    // ===== builders per report type =====

    private byte[] buildBytes(String reportType, ReportFormat format, Map<String, Object> filters) {
        return switch (reportType) {
            case "SUPERVISOR_LOAD" -> render(format, "Supervisor Load · " + LocalDate.now(),
                    chips(filters),
                    supervisorLoadHeaders(), supervisorLoadKeys(), supervisorLoadRows(filters));
            case "PAIRING_STATUS" -> render(format, "Pairing Status · " + LocalDate.now(),
                    chips(filters),
                    pairingHeaders(), pairingKeys(), pairingRows(filters));
            case "MEETING_LOG_COMPLIANCE" -> render(format, "Meeting Log Compliance · " + LocalDate.now(),
                    chips(filters),
                    complianceHeaders(), complianceKeys(), complianceRows(filters));
            case "RISK_ASSESSMENT" -> render(format, "Risk Assessment · " + LocalDate.now(),
                    chips(filters),
                    riskHeaders(), riskKeys(), riskRows(filters));
            default -> render(format, "Proposal Summary · " + LocalDate.now(),
                    chips(filters),
                    proposalHeaders(), proposalKeys(), proposalRows(filters));
        };
    }

    private byte[] render(ReportFormat format, String title, Map<String, String> chips,
                          List<String> headers, List<String> keys, List<Map<String, Object>> rows) {
        return switch (format) {
            case CSV -> csv.render(headers, rows, keys);
            case XLSX -> xlsx.render(title, headers, rows, keys);
            case PDF -> pdf.render(title, chips, headers, rows, keys);
        };
    }

    private Map<String, String> chips(Map<String, Object> filters) {
        Map<String, String> chips = new LinkedHashMap<>();
        filters.forEach((k, v) -> { if (v != null) chips.put(k, v.toString()); });
        return chips;
    }

    private Long cycleIdOf(Map<String, Object> filters) {
        Object v = filters.get("cycleId");
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    // --- PAIRING_STATUS
    private List<String> pairingHeaders() { return List.of("Project ID","Title","Student","Student ID","Supervisor","Pairing","Project Status","Proposal Status","Cycle"); }
    private List<String> pairingKeys() { return List.of("projectId","title","studentName","studentId","supervisorName","pairingStatus","projectStatus","proposalStatus","cycleCode"); }
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> pairingRows(Map<String, Object> filters) {
        Map<String, Object> page = committeeService.getProjectDtos(
                cycleIdOf(filters), (String) filters.get("cycleStatus"),
                (String) filters.get("projectStatus"), (String) filters.get("pairingStatus"),
                null, null, PageRequest.of(0, 5000));
        return (List<Map<String, Object>>) page.getOrDefault("content", List.of());
    }

    // --- SUPERVISOR_LOAD
    private List<String> supervisorLoadHeaders() { return List.of("Supervisor ID","Name","Email","Department","Current","Max","FYP1","FYP2","Utilization %","Overloaded"); }
    private List<String> supervisorLoadKeys() { return List.of("supervisorId","fullName","email","department","currentLoad","maxCapacity","fyp1Students","fyp2Students","utilizationRate","isOverloaded"); }
    private List<Map<String, Object>> supervisorLoadRows(Map<String, Object> filters) {
        return committeeService.getSupervisorLoadDtos();
    }

    // --- PROPOSAL_SUMMARY (uses existing proposal DTOs)
    private List<String> proposalHeaders() { return List.of("Proposal ID","Student","Student ID","Supervisor","Status","Submitted"); }
    private List<String> proposalKeys() { return List.of("proposalId","studentName","studentId","supervisorName","status","submittedAt"); }
    private List<Map<String, Object>> proposalRows(Map<String, Object> filters) {
        return committeeService.getProposalDtos(null, PageRequest.of(0, 5000));
    }

    // --- MEETING_LOG_COMPLIANCE
    private List<String> complianceHeaders() { return List.of("Project ID","Student","Student ID","Cycle","Phase","Logs Completed","Logs Required","Meets Minimum"); }
    private List<String> complianceKeys() { return List.of("projectId","studentName","studentId","cycleCode","phase","logsCompleted","logsRequired","meetsMinimum"); }
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> complianceRows(Map<String, Object> filters) {
        Map<String, Object> page = committeeService.getProjectDtos(
                cycleIdOf(filters), (String) filters.get("cycleStatus"),
                null, null, null, null, PageRequest.of(0, 5000));
        List<Map<String, Object>> rows = (List<Map<String, Object>>) page.getOrDefault("content", List.of());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            String phase = String.valueOf(r.getOrDefault("cycleType", "FYP1"));
            Long studentUserId = null;
            // studentId in DTO is mmuId; need userId — find by mmuId via userAccountRepository
            Object studentMmu = r.get("studentId");
            if (studentMmu != null) {
                studentUserId = userAccountRepository.findByMmuId(studentMmu.toString())
                        .map(UserAccount::getUserId).orElse(null);
            }
            int completed = studentUserId != null
                    ? meetingLogComplianceService.completedLogCount(studentUserId, phase) : 0;
            int required = meetingLogComplianceService.requiredLogCount(phase);
            Map<String, Object> row = new LinkedHashMap<>(r);
            row.put("phase", phase);
            row.put("logsCompleted", completed);
            row.put("logsRequired", required);
            row.put("meetsMinimum", completed >= required);
            out.add(row);
        }
        return out;
    }

    // --- RISK_ASSESSMENT
    private List<String> riskHeaders() { return List.of("Project ID","Title","Student","Student ID","Supervisor","Risk","Reasons","Cycle"); }
    private List<String> riskKeys() { return List.of("projectId","title","studentName","studentId","supervisorName","riskLevel","riskFactorsCsv","cycleCode"); }
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> riskRows(Map<String, Object> filters) {
        Map<String, Object> page = committeeService.getProjectDtos(
                cycleIdOf(filters), (String) filters.get("cycleStatus"),
                null, null, null, null, PageRequest.of(0, 5000));
        List<Map<String, Object>> rows = (List<Map<String, Object>>) page.getOrDefault("content", List.of());
        rows.removeIf(r -> "LOW".equalsIgnoreCase((String) r.get("riskLevel")));
        for (Map<String, Object> r : rows) {
            Object factors = r.get("riskFactors");
            r.put("riskFactorsCsv", factors instanceof List<?> l
                    ? String.join("; ", l.stream().map(Object::toString).toList()) : "");
        }
        return rows;
    }
}
```

This file references `UserAccountRepository.findByMmuId`. If that finder does not yet exist, add it in the next sub-step.

- [ ] **Step 2: Ensure `UserAccountRepository.findByMmuId` exists**

Run: `grep -n "findByMmuId" backend/src/main/java/com/fyp/supervision/repository/UserAccountRepository.java`

If missing, add to the repository:

```java
    java.util.Optional<com.fyp.supervision.entity.UserAccount> findByMmuId(String mmuId);
```

- [ ] **Step 3: Compile**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/service/CommitteeReportService.java backend/src/main/java/com/fyp/supervision/repository/UserAccountRepository.java
git commit -m "rewire CommitteeReportService with real types + csv/xlsx/pdf"
```

---

## Task 18: Fix `CommitteeReportController` (add POST alias + correct download content-type)

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeReportController.java`

- [ ] **Step 1: Replace the controller**

```java
package com.fyp.supervision.controller.committee;

import com.fyp.supervision.service.CommitteeReportService;
import com.fyp.supervision.service.report.ReportFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/reports")
@RequiredArgsConstructor
public class CommitteeReportController {

    private final CommitteeReportService committeeReportService;

    @GetMapping
    public ResponseEntity<?> getReports() {
        List<Map<String, Object>> reports = committeeReportService.getReportDtos();
        return ResponseEntity.ok(Map.of("reports", reports, "total", reports.size()));
    }

    /** Canonical generate endpoint. */
    @PostMapping("/generate")
    public ResponseEntity<?> generateCanonical(@AuthenticationPrincipal UserDetails user,
                                               @RequestBody Map<String, Object> config) {
        return doGenerate(user, config);
    }

    /** Back-compat alias — accepts the same payload at the bare collection URL. */
    @PostMapping
    public ResponseEntity<?> generateAlias(@AuthenticationPrincipal UserDetails user,
                                           @RequestBody Map<String, Object> config) {
        return doGenerate(user, config);
    }

    private ResponseEntity<?> doGenerate(UserDetails user, Map<String, Object> config) {
        try {
            Long userId = Long.parseLong(user.getUsername());
            Map<String, Object> result = committeeReportService.generateReport(userId, config);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to generate report: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadReport(@PathVariable Long id) {
        try {
            Path path = committeeReportService.getReportFilePath(id);
            ReportFormat fmt = committeeReportService.getReportFormat(id);
            Resource resource = new PathResource(path);
            String filename = path.getFileName() != null ? path.getFileName().toString()
                    : ("report." + fmt.extension);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fmt.contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        try {
            committeeReportService.deleteReport(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
```

- [ ] **Step 2: Compile + smoke**

Run: `cd backend && mvn -q -DskipTests compile`
Expected: BUILD SUCCESS.

Run backend; POST a sample report:
```
curl -sS -X POST -H "Authorization: Bearer <committee-jwt>" -H "Content-Type: application/json" \
  -d '{"reportType":"PAIRING_STATUS","format":"XLSX","filters":{"cycleStatus":"ACTIVE"}}' \
  http://localhost:8080/api/committee/reports
```
Expected: `{ "reportId":N, "status":"COMPLETED", "format":"XLSX", "fileSize":>0, "downloadUrl":"/api/committee/reports/N/download", … }`.

Download it:
```
curl -sS -H "Authorization: Bearer <committee-jwt>" \
  "http://localhost:8080/api/committee/reports/N/download" -o report.xlsx
file report.xlsx
```
Expected: `report.xlsx: Microsoft Excel 2007+` (or similar zip-based signature on Windows).

- [ ] **Step 3: Run existing backend tests**

Run: `cd backend && mvn -q test`
Expected: existing 26 tests + 5 new = 31 pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/fyp/supervision/controller/committee/CommitteeReportController.java
git commit -m "add POST /committee/reports alias and correct download content-type"
```

---

# Phase 7 — Frontend types and hooks

## Task 19: Update committee types

**Files:**
- Modify: `frontend/src/types/committee.ts`

- [ ] **Step 1: Add `CycleSummary`**

Insert (near the other domain types, e.g. after `RecentActivity`):

```ts
export type CycleStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export interface CycleSummary {
  cycleId: number
  cycleCode: string
  cycleType: 'FYP1' | 'FYP2'
  academicYear: string
  semester: number
  startDate: string
  endDate: string
  status: CycleStatus
  projectCount: number
}
```

- [ ] **Step 2: Extend `ProjectOverview`, `ProjectDetail`, `UnpairedStudent`, `SupervisorStudentSummary`**

Replace the existing interfaces with:

```ts
export interface ProjectOverview {
  projectId: number
  title: string
  studentName: string
  studentId: string
  studentEmail: string
  programme: string
  // Legacy field kept for one release; prefer cycleCode/cycleType.
  cycle: 'FYP1' | 'FYP2' | ''
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  academicYear?: string
  cycleStatus?: CycleStatus
  supervisorName?: string
  supervisorId?: string
  pairingStatus: PairingStatus
  projectStatus: CommitteeProjectStatus
  proposalStatus: CommitteeProposalStatus
  progress: number
  lastActivity: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskFactors: string[]
}

export interface UnpairedStudent {
  studentId: string
  userId: string
  fullName: string
  email: string
  programme: string
  cycle: 'FYP1' | 'FYP2' | ''
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  academicYear?: string
  cycleStatus?: CycleStatus
  registeredAt: string
  requestsSent: number
  requestsRejected: number
  lastRequestAt?: string
  preferredAreas?: string[]
}

export interface SupervisorStudentSummary {
  studentId: string
  fullName: string
  cycle: 'FYP1' | 'FYP2' | ''
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  projectTitle?: string
  progress: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ProjectEngagement {
  lockedLogs: number
  requiredLogs: number
  completedMeetings: number
  lastConductedMeetingAt: string | null
  proposalStatus: string
  proposalVersion: number
}

// extend ProjectDetail
export interface ProjectDetail {
  projectId: number
  title: string
  description?: string
  studentId: string
  studentName: string
  studentEmail: string
  programme: string
  cycle: string
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  academicYear?: string
  cycleStatus?: CycleStatus
  supervisorId?: string
  supervisorName?: string
  supervisorEmail?: string
  supervisorDepartment?: string
  pairingStatus: PairingStatus
  projectStatus: CommitteeProjectStatus
  proposalStatus?: CommitteeProposalStatus
  progress: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskFactors?: string[]
  registeredAt: string
  pairedAt?: string
  engagement?: ProjectEngagement
  milestones?: ProjectMilestone[]
  recentMeetings?: RecentMeeting[]
  submissions?: ProjectSubmission[]
}
```

- [ ] **Step 3: Replace `CommitteeProjectStatus`, `ReportType`, `ReportConfig`, `GeneratedReport`**

Within the same file:

```ts
// Real backend enum
export type CommitteeProjectStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'DROPPED'

export type ReportType =
  | 'PAIRING_STATUS'
  | 'SUPERVISOR_LOAD'
  | 'PROPOSAL_SUMMARY'
  | 'MEETING_LOG_COMPLIANCE'
  | 'RISK_ASSESSMENT'

export type ReportFormat = 'CSV' | 'XLSX' | 'PDF'

export interface ReportConfig {
  reportType: ReportType
  format: ReportFormat
  title?: string
  filters: {
    cycleId?: number
    cycleStatus?: CycleStatus
    programme?: string
    dateFrom?: string
    dateTo?: string
    supervisorId?: number
  }
}

export interface GeneratedReport {
  reportId: number
  reportType: ReportType
  title: string
  status: 'COMPLETED' | 'FAILED' | 'PENDING'
  format: ReportFormat
  fileSize: number
  downloadUrl: string
  filters: ReportConfig['filters']
  generatedBy: string
  generatedAt: string
  expiresAt: string
}
```

- [ ] **Step 4: Lint**

Run: `cd frontend && npm run lint`
Expected: 0 errors / 0 warnings. If duplicate-export errors appear from `index.ts`, proceed to Step 5.

- [ ] **Step 5: Sanity-check `types/index.ts` for collisions**

Run: `grep -n "ReportType\|ReportFormat\|GeneratedReport\|CycleSummary\|CycleStatus" frontend/src/types/index.ts`
If a clash with `student.ts`/`supervisor.ts`/`admin.ts` exists, alias the committee export (`export type { ReportType as CommitteeReportType } from './committee'`). Spec § 5.1 requires this pattern.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/committee.ts frontend/src/types/index.ts
git commit -m "structured cycle fields + real report types on committee types"
```

---

## Task 20: Update `useCommittee.ts` hooks

**Files:**
- Modify: `frontend/src/lib/hooks/useCommittee.ts`

- [ ] **Step 1: Add the cycles + export + download hooks; tighten `useProjectOverview`; fix generate payload**

Replace the relevant hooks (others stay):

```ts
// Add at top of "PROJECT & PAIRING HOOKS" section
export function useCommitteeCycles() {
  return useQuery({
    queryKey: [...committeeKeys.all, 'cycles'] as const,
    queryFn: async (): Promise<{ cycles: CycleSummary[]; total: number }> => {
      const { data } = await apiClient.get('/committee/cycles')
      return data
    },
  })
}

// Replace existing useProjectOverview
export function useProjectOverview(params: {
  cycleId?: number
  cycleStatus?: CycleStatus
  projectStatus?: CommitteeProjectStatus
  pairingStatus?: PairingStatus
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  search?: string
  page?: number
  size?: number
} = {}) {
  return useQuery({
    queryKey: [...committeeKeys.projects(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        content?: ProjectOverview[]
        totalElements?: number
        totalPages?: number
        number?: number
        size?: number
      }>('/committee/projects', {
        params: {
          cycleId: params.cycleId,
          cycleStatus: params.cycleStatus,
          projectStatus: params.projectStatus,
          pairingStatus: params.pairingStatus,
          riskLevel: params.riskLevel,
          search: params.search || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      })
      return {
        projects: data.content ?? [],
        total: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
        page: data.number ?? 0,
        size: data.size ?? (params.size ?? 20),
      }
    },
    placeholderData: (prev) => prev,
  })
}

// Replace existing useExportProjectData with a blob downloader.
export function useExportProjects() {
  return useMutation({
    mutationFn: async (options: {
      format: 'CSV' | 'XLSX' | 'PDF'
      filters?: {
        cycleId?: number
        cycleStatus?: CycleStatus
        projectStatus?: CommitteeProjectStatus
        pairingStatus?: PairingStatus
        riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
        search?: string
      }
    }) => {
      const response = await apiClient.get('/committee/projects/export', {
        params: { format: options.format.toLowerCase(), ...(options.filters || {}) },
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers['content-disposition'] as string | undefined
      const match = disposition?.match(/filename="?([^";]+)"?/i)
      a.download = match ? match[1]
        : `projects-${new Date().toISOString().slice(0, 10)}.${options.format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { success: true }
    },
  })
}

// Replace existing useGenerateReport — payload aligned with new ReportConfig.
export function useGenerateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: ReportConfig) => {
      const { data } = await apiClient.post('/committee/reports/generate', config)
      return data as GeneratedReport
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.reports() })
    },
  })
}

// New: download a generated report.
export function useDownloadReport() {
  return useMutation({
    mutationFn: async (report: GeneratedReport) => {
      const response = await apiClient.get(`/committee/reports/${report.reportId}/download`, {
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers['content-disposition'] as string | undefined
      const match = disposition?.match(/filename="?([^";]+)"?/i)
      a.download = match ? match[1]
        : `${report.title.replace(/[^a-z0-9-]+/gi, '_')}.${report.format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { success: true }
    },
  })
}

export function useUnpairedStudents(cycleId?: number) {
  return useQuery({
    queryKey: [...committeeKeys.unpairedStudents(), cycleId],
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/projects/unpaired-students', {
        params: { cycleId },
      })
      return data as { students: UnpairedStudent[] }
    },
  })
}
```

Add to the imports near the top of the file:

```ts
import type { CycleSummary, CycleStatus } from '@/types'
```

Make sure `useGeneratedReports` and `useDeleteReport` keep their existing signatures.

- [ ] **Step 2: Remove the now-orphaned `useExportProjectData` export**

Run: `grep -rn "useExportProjectData" frontend/src/`
Replace every remaining caller with `useExportProjects`. Delete the old hook from `useCommittee.ts`.

- [ ] **Step 3: Lint + typecheck**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/hooks/useCommittee.ts
git commit -m "committee hooks: cycles, paged projects, blob export + report download"
```

---

# Phase 8 — Frontend Project Overview rebuild

## Task 21: Rebuild `ProjectOverview.tsx`

**Files:**
- Modify: `frontend/src/pages/committee/ProjectOverview.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire file with:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban, Search, Users, UserX, AlertTriangle, ChevronRight,
  Download, GraduationCap, User, ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import {
  useProjectOverview, useCommitteeCycles, useExportProjects,
} from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type {
  CommitteeProjectStatus, PairingStatus, CycleSummary, CycleStatus,
} from '@/types'

type StatusEntry = { label: string; color: string; bgColor: string }
const DEFAULT: StatusEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }

const projectStatusConfig: Record<string, StatusEntry> = {
  ACTIVE: { label: 'Active', color: 'text-sky-600', bgColor: 'bg-sky-100' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  SUSPENDED: { label: 'Suspended', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  DROPPED: { label: 'Dropped', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}
const pairingStatusConfig: Record<string, StatusEntry> = {
  UNPAIRED: { label: 'Unpaired', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  PENDING_APPROVAL: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  PAIRED: { label: 'Paired', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
}
const cycleStatusBadge: Record<CycleStatus, StatusEntry> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  UPCOMING: { label: 'Upcoming', color: 'text-sky-700', bgColor: 'bg-sky-50' },
  COMPLETED: { label: 'Past', color: 'text-stone-600', bgColor: 'bg-stone-100' },
  ARCHIVED: { label: 'Archived', color: 'text-stone-500', bgColor: 'bg-stone-100' },
}
const riskConfig = {
  LOW: { label: 'Low Risk', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  MEDIUM: { label: 'Medium Risk', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  HIGH: { label: 'High Risk', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}

const get = (table: Record<string, StatusEntry>, key: string | undefined): StatusEntry =>
  (key && table[key]) || DEFAULT

type CycleChoice =
  | { kind: 'active' }
  | { kind: 'all' }
  | { kind: 'specific'; cycleId: number }

function describeCycle(c: CycleSummary): string {
  const sem = c.semester ? ` Sem ${c.semester}` : ''
  const status = cycleStatusBadge[c.status].label
  return `${c.cycleType} · ${c.academicYear}${sem} · ${status}`
}

export function ProjectOverview() {
  const [cycleChoice, setCycleChoice] = useState<CycleChoice>({ kind: 'active' })
  const [statusFilter, setStatusFilter] = useState<CommitteeProjectStatus | 'ALL'>('ALL')
  const [pairingFilter, setPairingFilter] = useState<PairingStatus | 'ALL'>('ALL')
  const [riskFilter, setRiskFilter] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'ALL'>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const cyclesQuery = useCommitteeCycles()
  const cycles = cyclesQuery.data?.cycles ?? []

  const filterPayload = useMemo(() => ({
    cycleId: cycleChoice.kind === 'specific' ? cycleChoice.cycleId : undefined,
    cycleStatus: cycleChoice.kind === 'active' ? ('ACTIVE' as const)
      : cycleChoice.kind === 'all' ? undefined : undefined,
    projectStatus: statusFilter === 'ALL' ? undefined : statusFilter,
    pairingStatus: pairingFilter === 'ALL' ? undefined : pairingFilter,
    riskLevel: riskFilter === 'ALL' ? undefined : riskFilter,
    search: search || undefined,
  }), [cycleChoice, statusFilter, pairingFilter, riskFilter, search])

  const { data, isLoading, isFetching } = useProjectOverview({ ...filterPayload, page, size })
  const exportMutation = useExportProjects()

  const stats = useMemo(() => ({
    total: data?.total ?? 0,
    paired: (data?.projects ?? []).filter(p => p.pairingStatus === 'PAIRED').length,
    unpaired: (data?.projects ?? []).filter(p => p.pairingStatus === 'UNPAIRED').length,
    highRisk: (data?.projects ?? []).filter(p => p.riskLevel === 'HIGH').length,
  }), [data])

  const handleExport = (format: 'CSV' | 'XLSX' | 'PDF') => {
    setExportOpen(false)
    exportMutation.mutate({ format, filters: filterPayload })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <FolderKanban className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Project & Pairing Overview</h1>
              <p className="text-stone-300 text-xs">Monitor all FYP projects and student-supervisor pairings</p>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <Link to={ROUTES.COMMITTEE.UNPAIRED_STUDENTS}>
              <Button variant="secondary" className="border-stone-600 text-stone-200 hover:bg-stone-700">
                <UserX className="h-4 w-4 mr-2" />
                Unpaired ({stats.unpaired})
              </Button>
            </Link>
            <div className="relative">
              <Button
                type="button"
                onClick={() => setExportOpen(o => !o)}
                disabled={exportMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {exportMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Export <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg z-10 min-w-[140px]">
                  {(['CSV','XLSX','PDF'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleExport(f)}
                      className="block w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                    >Export {f}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-l-4 border-l-stone-400">
          <p className="text-3xl font-bold text-stone-800">{stats.total}</p>
          <p className="text-sm text-stone-600 font-medium">Total Projects</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-emerald-500">
          <p className="text-3xl font-bold text-emerald-600">{stats.paired}</p>
          <p className="text-sm text-stone-600 font-medium">Paired Students</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-rose-500">
          <p className="text-3xl font-bold text-rose-600">{stats.unpaired}</p>
          <p className="text-sm text-stone-600 font-medium">Unpaired Students</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-amber-500">
          <p className="text-3xl font-bold text-amber-600">{stats.highRisk}</p>
          <p className="text-sm text-stone-600 font-medium">High Risk</p>
        </Card>
      </div>

      <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by title, student, or supervisor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={cycleChoice.kind === 'specific' ? `id:${cycleChoice.cycleId}` : cycleChoice.kind}
              onChange={(e) => {
                const v = e.target.value
                setPage(0)
                if (v === 'active') setCycleChoice({ kind: 'active' })
                else if (v === 'all') setCycleChoice({ kind: 'all' })
                else setCycleChoice({ kind: 'specific', cycleId: Number(v.slice(3)) })
              }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="active">All Active Cycles</option>
              <option value="all">All Cycles (incl. past)</option>
              {cycles.map(c => (
                <option key={c.cycleId} value={`id:${c.cycleId}`}>{describeCycle(c)}</option>
              ))}
            </select>
            <select
              value={pairingFilter}
              onChange={(e) => { setPairingFilter(e.target.value as PairingStatus | 'ALL'); setPage(0) }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Pairing Status</option>
              <option value="PAIRED">Paired</option>
              <option value="UNPAIRED">Unpaired</option>
              <option value="PENDING_APPROVAL">Pending</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as CommitteeProjectStatus | 'ALL'); setPage(0) }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DROPPED">Dropped</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value as 'LOW'|'MEDIUM'|'HIGH'|'ALL'); setPage(0) }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Risk</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
          <Button variant="secondary" size="sm" className="border-stone-300 hover:bg-stone-100">
            <Users className="h-4 w-4 mr-2" />
            Supervisor Load Analysis
          </Button>
        </Link>
      </div>

      <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-2.5', isFetching && 'opacity-60')}>
        {(data?.projects ?? []).length > 0 ? (
          (data?.projects ?? []).map((project) => {
            const pairing = get(pairingStatusConfig, project.pairingStatus)
            const pStatus = get(projectStatusConfig, project.projectStatus)
            const risk = riskConfig[project.riskLevel]
            const cycleBadge = project.cycleStatus ? cycleStatusBadge[project.cycleStatus] : undefined
            return (
              <Link key={project.projectId} to={ROUTES.COMMITTEE.PROJECT_DETAIL.replace(':id', String(project.projectId))}>
                <Card className="group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-stone-300">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle className="text-neutral-200" strokeWidth="4" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                        <circle
                          className={cn(project.progress >= 70 ? 'text-emerald-500'
                            : project.progress >= 40 ? 'text-amber-500' : 'text-rose-500')}
                          strokeWidth="4"
                          strokeDasharray={`${project.progress * 1.51} 151`}
                          strokeLinecap="round" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{project.progress}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                            {project.title || 'Untitled Project'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                            <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{project.studentName}</span>
                            {project.supervisorName && (
                              <span className="flex items-center gap-1"><User className="h-4 w-4" />{project.supervisorName}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', pairing.bgColor, pairing.color)}>{pairing.label}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', pStatus.bgColor, pStatus.color)}>{pStatus.label}</span>
                        {project.cycleCode && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">{project.cycleCode}</span>
                        )}
                        {project.programme && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">{project.programme}</span>
                        )}
                        {cycleBadge && project.cycleStatus !== 'ACTIVE' && (
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', cycleBadge.bgColor, cycleBadge.color)}>{cycleBadge.label}</span>
                        )}
                        {project.riskLevel !== 'LOW' && (
                          <span
                            className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', risk.bgColor, risk.color)}
                            title={project.riskFactors?.join(' · ')}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {risk.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="text-center py-8 col-span-full">
            <h3 className="font-medium text-stone-800">No projects found</h3>
            <p className="text-neutral-500 mt-1">
              {search || cycleChoice.kind !== 'active' || statusFilter !== 'ALL' || pairingFilter !== 'ALL' || riskFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No projects have been registered in active cycles yet'}
            </p>
          </Card>
        )}
      </div>

      {data && data.total > 0 && (
        <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <span>Page size:</span>
              <select
                value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
                className="px-2 py-1 border border-stone-200 rounded text-sm bg-white"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <Pagination
              currentPage={page + 1}
              totalPages={Math.max(1, data.totalPages)}
              onPageChange={(p) => setPage(p - 1)}
              totalItems={data.total}
              pageSize={size}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Lint + dev server smoke**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

Run `npm run dev`, log in as committee, visit `/committee/projects`:
- All cycles dropdown lists actual cycle codes.
- Switching cycle / pairing / status / risk updates the list without a full reload.
- Search box debounces and resets to page 1.
- Pagination renders when totalPages > 1.
- Clicking Export → CSV downloads a file named `projects-YYYY-MM-DD.csv` with the filters applied.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/committee/ProjectOverview.tsx
git commit -m "rebuild committee project overview: filters, pagination, export dropdown"
```

---

## Task 22: Engagement panel on `ProjectDetail.tsx`

**Files:**
- Modify: `frontend/src/pages/committee/ProjectDetail.tsx`

- [ ] **Step 1: Locate where milestones/meetings/submissions render**

Read the current file end-to-end to find where the right-column cards sit; insert the Engagement card before any "Milestones" / placeholder sections, and surface `riskFactors`.

- [ ] **Step 2: Insert engagement card and risk factors block**

Add (inside the JSX, after the header card but before recent activity):

```tsx
{data?.engagement && (
  <Card className="p-4">
    <h3 className="font-semibold text-stone-800 mb-3">Engagement</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-stone-600">Meeting Logs (LOCKED)</span>
          <span className="font-medium">{data.engagement.lockedLogs} / {data.engagement.requiredLogs}</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full',
              data.engagement.lockedLogs >= data.engagement.requiredLogs ? 'bg-emerald-500' : 'bg-amber-500')}
            style={{ width: `${Math.min(100, (data.engagement.lockedLogs / Math.max(1, data.engagement.requiredLogs)) * 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-stone-600">Conducted Meetings</span>
        <span className="font-medium">{data.engagement.completedMeetings}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-stone-600">Last Conducted</span>
        <span className="font-medium">
          {data.engagement.lastConductedMeetingAt
            ? new Date(data.engagement.lastConductedMeetingAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-stone-600">Proposal</span>
        <span className="font-medium">{data.engagement.proposalStatus} (v{data.engagement.proposalVersion})</span>
      </div>
    </div>
  </Card>
)}

{data?.riskFactors && data.riskFactors.length > 0 && (
  <Card className="p-4 border-l-4 border-l-rose-500 bg-rose-50/30">
    <h3 className="font-semibold text-rose-800 mb-2">Risk Factors</h3>
    <ul className="list-disc list-inside text-sm text-rose-700 space-y-1">
      {data.riskFactors.map(f => <li key={f}>{f}</li>)}
    </ul>
  </Card>
)}
```

Add `import { cn } from '@/lib/utils/cn'` if missing. Drop any imports / sections that referenced the mocked "milestones" array; they can be left as empty arrays in the type but should not render UI.

- [ ] **Step 3: Lint + smoke**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

Visit a project detail; verify Engagement card numbers match what you'd see on the supervisor's logs/meeting pages.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/committee/ProjectDetail.tsx
git commit -m "engagement panel + risk factors on committee project detail"
```

---

## Task 23: Cycle dropdown on `UnpairedStudents.tsx`

**Files:**
- Modify: `frontend/src/pages/committee/UnpairedStudents.tsx`

- [ ] **Step 1: Read the file and identify where filtering happens**

Read `frontend/src/pages/committee/UnpairedStudents.tsx`. Identify the data-load hook (`useUnpairedStudents`) and add a cycle selector that drives its `cycleId` arg.

- [ ] **Step 2: Add the cycle selector**

Near the top of the component:

```tsx
import { useCommitteeCycles, useUnpairedStudents } from '@/lib/hooks/useCommittee'
...
const [cycleId, setCycleId] = useState<number | undefined>(undefined)
const cyclesQuery = useCommitteeCycles()
const { data } = useUnpairedStudents(cycleId)
```

Render a select inside the existing filter row:

```tsx
<select
  value={cycleId ?? ''}
  onChange={(e) => setCycleId(e.target.value ? Number(e.target.value) : undefined)}
  className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
>
  <option value="">All Active Cycles</option>
  {(cyclesQuery.data?.cycles ?? []).map(c => (
    <option key={c.cycleId} value={c.cycleId}>
      {c.cycleType} · {c.academicYear} Sem {c.semester} · {c.status}
    </option>
  ))}
</select>
```

Drop any hardcoded `cycle: 'FYP1'` display badges; render `student.cycleCode` instead.

- [ ] **Step 3: Lint + commit**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

```bash
git add frontend/src/pages/committee/UnpairedStudents.tsx
git commit -m "cycle dropdown on unpaired students"
```

---

## Task 24: Real cycle counts on `SupervisorLoad.tsx` + detail

**Files:**
- Modify: `frontend/src/pages/committee/SupervisorLoad.tsx`
- Modify: `frontend/src/pages/committee/SupervisorLoadDetail.tsx`

- [ ] **Step 1: Update list page**

Read the file. The per-supervisor row currently shows `fyp1Students` and `fyp2Students`; with the backend fix those are now real. No code change required apart from removing any TODO comment that calls them "approximations" and ensuring student rows render `cycleCode` instead of just "FYP1".

Locate `cycle: 'FYP1'` literals via:
```
grep -n "'FYP1'\|'FYP2'" frontend/src/pages/committee/SupervisorLoad.tsx frontend/src/pages/committee/SupervisorLoadDetail.tsx
```
Replace any badge that prints the hardcoded string with `{s.cycleCode || s.cycle}`.

- [ ] **Step 2: Lint + commit**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

```bash
git add frontend/src/pages/committee/SupervisorLoad.tsx frontend/src/pages/committee/SupervisorLoadDetail.tsx
git commit -m "use cycleCode on supervisor load student rows"
```

---

# Phase 9 — Reports module rebuild

## Task 25: Rebuild `ReportsModule.tsx`

**Files:**
- Modify: `frontend/src/pages/committee/ReportsModule.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3, FileText, Download, Calendar, Filter, Clock,
  ChevronRight, PieChart, TrendingUp, Users, FolderKanban, History,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useGenerateReport, useCommitteeCycles } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ReportType, ReportFormat } from '@/types'

const reportTypes: {
  value: ReportType
  label: string
  description: string
  icon: typeof BarChart3
  color: string
}[] = [
  { value: 'PAIRING_STATUS', label: 'Pairing Status', description: 'Student↔supervisor pairings across the chosen cycle', icon: FolderKanban, color: 'text-amber-600' },
  { value: 'SUPERVISOR_LOAD', label: 'Supervisor Load', description: 'Capacity, utilization, and assigned students', icon: Users, color: 'text-violet-600' },
  { value: 'PROPOSAL_SUMMARY', label: 'Proposal Summary', description: 'Submitted proposals by status', icon: FileText, color: 'text-emerald-600' },
  { value: 'MEETING_LOG_COMPLIANCE', label: 'Meeting Log Compliance', description: 'LOCKED logs per student vs the 6-log minimum', icon: TrendingUp, color: 'text-sky-600' },
  { value: 'RISK_ASSESSMENT', label: 'Risk Assessment', description: 'Projects flagged HIGH or MEDIUM with reasons', icon: BarChart3, color: 'text-rose-600' },
]

export function ReportsModule() {
  const navigate = useNavigate()
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [format, setFormat] = useState<ReportFormat>('CSV')
  const [cycleId, setCycleId] = useState<number | undefined>(undefined)
  const [programmeFilter, setProgrammeFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  const cyclesQuery = useCommitteeCycles()
  const generateMutation = useGenerateReport()

  const handleGenerate = async () => {
    if (!selectedReport) return
    try {
      await generateMutation.mutateAsync({
        reportType: selectedReport,
        format,
        filters: {
          cycleId,
          cycleStatus: cycleId ? undefined : 'ACTIVE',
          programme: programmeFilter || undefined,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
        },
      })
      navigate(ROUTES.COMMITTEE.REPORTS_HISTORY)
    } catch (e) {
      console.error('Failed to generate report:', e)
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <BarChart3 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Reports Module</h1>
              <p className="text-stone-300 text-xs">Generate FYP management reports (CSV / XLSX / PDF)</p>
            </div>
          </div>
          <Link to={ROUTES.COMMITTEE.REPORTS_HISTORY}>
            <Button variant="secondary" className="border-stone-600 text-stone-200 hover:bg-stone-700">
              <History className="h-4 w-4 mr-2" />
              View Generated Reports
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2"><PieChart className="h-5 w-5 text-amber-600" />Select Report Type</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon
              return (
                <button
                  key={report.value} type="button"
                  onClick={() => setSelectedReport(report.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all duration-300',
                    selectedReport === report.value
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200 shadow-sm'
                      : 'border-stone-200 hover:bg-stone-50 hover:border-stone-300')}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                      selectedReport === report.value ? 'bg-amber-100' : 'bg-stone-100')}>
                      <Icon className={cn('h-5 w-5', report.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-stone-800">{report.label}</h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{report.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2"><Filter className="h-5 w-5 text-amber-600" />Report Filters</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">FYP Cycle</label>
            <select
              value={cycleId ?? ''} onChange={(e) => setCycleId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Active Cycles</option>
              {(cyclesQuery.data?.cycles ?? []).map(c => (
                <option key={c.cycleId} value={c.cycleId}>
                  {c.cycleType} · {c.academicYear} Sem {c.semester} · {c.status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Programme</label>
            <select
              value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Programmes</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">From Date</label>
            <input type="date" value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">To Date</label>
            <input type="date" value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">Format</label>
            <div className="flex gap-2">
              {(['CSV','XLSX','PDF'] as const).map(f => (
                <button
                  key={f} type="button" onClick={() => setFormat(f)}
                  className={cn('flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                    format === f ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200 hover:bg-stone-50')}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {selectedReport && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
          <div className="flex items-start justify-between p-4">
            <div>
              <h3 className="font-semibold text-stone-800">{reportTypes.find(r => r.value === selectedReport)?.label}</h3>
              <p className="text-sm text-stone-600 mt-1">{reportTypes.find(r => r.value === selectedReport)?.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateRange.from} to {dateRange.to}</span>
                {cycleId && <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full font-medium">cycleId={cycleId}</span>}
                {programmeFilter && <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full font-medium">{programmeFilter}</span>}
                <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full font-medium">{format}</span>
              </div>
            </div>
            <span className="text-xs text-stone-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Synchronous</span>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Link to={ROUTES.COMMITTEE.DASHBOARD}>
          <Button variant="secondary" className="border-stone-300">Cancel</Button>
        </Link>
        <Button onClick={handleGenerate} disabled={!selectedReport || generateMutation.isPending}
          className="bg-amber-500 hover:bg-amber-600 text-white">
          {generateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Generate Report
        </Button>
      </div>
    </div>
  )
}
```

(The unused `ChevronRight` import in the original file is removed.)

- [ ] **Step 2: Lint**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/committee/ReportsModule.tsx
git commit -m "rebuild reports module: 5 real types + format toggle + cycle dropdown"
```

---

## Task 26: Rebuild `ReportsHistory.tsx`

**Files:**
- Modify: `frontend/src/pages/committee/ReportsHistory.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, History, FileText, Download, Trash2, Calendar, Search,
  BarChart3, TrendingUp, Users, FolderKanban, CheckCircle, AlertCircle, Loader,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  useGeneratedReports, useDeleteReport, useDownloadReport,
} from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ReportType, GeneratedReport } from '@/types'

const reportTypeConfig: Record<ReportType, { label: string; icon: typeof BarChart3; color: string }> = {
  PAIRING_STATUS: { label: 'Pairing Status', icon: FolderKanban, color: 'text-primary-600' },
  SUPERVISOR_LOAD: { label: 'Supervisor Load', icon: Users, color: 'text-accent-600' },
  PROPOSAL_SUMMARY: { label: 'Proposal Summary', icon: FileText, color: 'text-success-600' },
  MEETING_LOG_COMPLIANCE: { label: 'Meeting Log Compliance', icon: TrendingUp, color: 'text-info-600' },
  RISK_ASSESSMENT: { label: 'Risk Assessment', icon: BarChart3, color: 'text-error-600' },
}
const statusConfig = {
  PENDING: { label: 'Generating', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Loader },
  COMPLETED: { label: 'Ready', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'text-error-600', bgColor: 'bg-error-50', icon: AlertCircle },
}

export function ReportsHistory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'ALL'>('ALL')

  const { data, isLoading } = useGeneratedReports()
  const deleteMutation = useDeleteReport()
  const downloadMutation = useDownloadReport()

  const filteredReports = (data?.reports ?? []).filter((report: GeneratedReport) => {
    if (typeFilter !== 'ALL' && report.reportType !== typeFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return report.title.toLowerCase().includes(q)
      || reportTypeConfig[report.reportType]?.label.toLowerCase().includes(q)
  })

  const handleDelete = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    await deleteMutation.mutateAsync(reportId).catch(e => console.error('delete failed:', e))
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.REPORTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Reports
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <History className="h-7 w-7 text-primary-600" />Generated Reports
          </h1>
          <p className="text-neutral-600 mt-1">View and download previously generated reports</p>
        </div>
        <Link to={ROUTES.COMMITTEE.REPORTS}>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />Generate New Report
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input type="text" placeholder="Search reports..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <select value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReportType | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm">
            <option value="ALL">All Types</option>
            {Object.entries(reportTypeConfig).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((report: GeneratedReport) => {
            const typeCfg = reportTypeConfig[report.reportType] ?? reportTypeConfig.PAIRING_STATUS
            const statusCfg = statusConfig[report.status] ?? statusConfig.COMPLETED
            const Icon = typeCfg.icon
            const StatusIcon = statusCfg.icon
            return (
              <Card key={report.reportId} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    report.status === 'COMPLETED' ? 'bg-primary-50' : 'bg-neutral-100')}>
                    <Icon className={cn('h-6 w-6',
                      report.status === 'COMPLETED' ? typeCfg.color : 'text-neutral-400')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{report.title}</h3>
                        <p className="text-sm text-neutral-500">{typeCfg.label}</p>
                      </div>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                        statusCfg.bgColor, statusCfg.color)}>
                        <StatusIcon className={cn('h-3.5 w-3.5', report.status === 'PENDING' && 'animate-spin')} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(report.generatedAt).toLocaleDateString('en-MY', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span>{formatFileSize(report.fileSize)}</span>
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full font-medium">{report.format}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {report.status === 'COMPLETED' && (
                        <Button variant="secondary" size="sm"
                          onClick={() => downloadMutation.mutate(report)}
                          disabled={downloadMutation.isPending}>
                          <Download className="h-4 w-4 mr-1" />Download
                        </Button>
                      )}
                      <Button variant="ghost" size="sm"
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                        onClick={() => handleDelete(report.reportId)}
                        disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="text-center py-8">
            <History className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No reports found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || typeFilter !== 'ALL' ? 'Try adjusting your filters' : 'Generate your first report to get started'}
            </p>
            {!searchQuery && typeFilter === 'ALL' && (
              <Link to={ROUTES.COMMITTEE.REPORTS}>
                <Button className="mt-4"><BarChart3 className="h-4 w-4 mr-2" />Generate Report</Button>
              </Link>
            )}
          </Card>
        )}
      </div>

      {data && data.reports.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Showing {filteredReports.length} of {data.total} reports</span>
            <span className="text-neutral-500">
              {data.reports.filter((r: GeneratedReport) => r.status === 'COMPLETED').length} ready for download
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Lint + smoke**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

Run frontend, generate a PDF report from the Reports module, switch to History, click Download — file should save with a `.pdf` extension and open in a PDF viewer.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/committee/ReportsHistory.tsx
git commit -m "rebuild reports history: correct fields + working download"
```

---

# Phase 10 — Cleanup

## Task 27: Delete `ExportOverview` page + route + barrel export

**Files:**
- Delete: `frontend/src/pages/committee/ExportOverview.tsx`
- Modify: `frontend/src/pages/committee/index.ts`
- Modify: `frontend/src/lib/constants/routes.ts`
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/components/layout/SideNav.tsx` (only if it references the route)

- [ ] **Step 1: Replace route definition with redirect**

In `frontend/src/lib/constants/routes.ts`, leave the `EXPORT_OVERVIEW` key in place but mark it for removal in a follow-up, OR remove it now. Removing now requires no callers — verify first:

```
grep -rn "EXPORT_OVERVIEW" frontend/src/
```
After Task 21 there should be NO callers besides this constants file and `router.tsx`. If true, remove the line `EXPORT_OVERVIEW: '/committee/projects/export',`.

In `frontend/src/app/router.tsx`:
- Remove the `const ExportOverview = lazy(...)` line.
- Replace the `{ path: ROUTES.COMMITTEE.EXPORT_OVERVIEW, ... }` route entry with:

```tsx
{
  path: '/committee/projects/export',
  element: <Navigate to="/committee/projects" replace />,
},
```

Add `import { Navigate } from 'react-router-dom'` if not already imported.

- [ ] **Step 2: Drop barrel export**

In `frontend/src/pages/committee/index.ts`, remove the line:
```ts
export { ExportOverview } from './ExportOverview'
```

- [ ] **Step 3: Delete the file**

```bash
rm frontend/src/pages/committee/ExportOverview.tsx
```

- [ ] **Step 4: Check sidebar**

Run: `grep -n "EXPORT_OVERVIEW\|ExportOverview" frontend/src/components/layout/SideNav.tsx`
If a nav entry references it, remove that nav item.

- [ ] **Step 5: Lint + dev smoke**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

Run `npm run dev`, visit `/committee/projects/export` directly — should redirect to `/committee/projects`.

- [ ] **Step 6: Commit**

```bash
git add -u frontend/src/pages/committee/index.ts frontend/src/lib/constants/routes.ts frontend/src/app/router.tsx frontend/src/components/layout/SideNav.tsx
git add frontend/src/pages/committee/ExportOverview.tsx 2>/dev/null || true
git commit -m "remove standalone export overview, redirect /committee/projects/export"
```

(The `git add ExportOverview.tsx` records the deletion if the file is staged-as-deleted; on Windows `git rm` is cleaner — adapt as needed.)

---

## Task 28: Final full-stack smoke + global typecheck

- [ ] **Step 1: Backend tests + start**

Run: `cd backend && mvn -q test`
Expected: all tests pass (existing + the 5 from Task 8).

Run: `cd backend && mvn -q spring-boot:run` (in another shell). Wait for "Started SupervisionApplication". Smoke endpoints:
```
curl -sS -H "Authorization: Bearer <committee-jwt>" http://localhost:8080/api/committee/cycles | head -c 400
curl -sS -H "Authorization: Bearer <committee-jwt>" "http://localhost:8080/api/committee/projects?page=0&size=5" | head -c 400
curl -sS -H "Authorization: Bearer <committee-jwt>" "http://localhost:8080/api/committee/projects/export?format=pdf" -o smoke.pdf
file smoke.pdf
```
Expected: all three return reasonable shapes; smoke.pdf is a valid PDF.

- [ ] **Step 2: Frontend lint + dev**

Run: `cd frontend && npm run lint`
Expected: 0 issues.

`npm run dev`, log in as committee. Walk through:
- `/committee/projects`: cycle dropdown lists real cycles; switch to a past cycle and verify cards show the "Past" badge; check that progress and risk vary across projects (no longer 0% / LOW everywhere); apply filters and confirm the count + paginator update; export CSV / XLSX / PDF and inspect each file.
- `/committee/projects/<id>`: Engagement card shows real meeting log and conducted-meeting numbers; if risk is not LOW, the Risk Factors block lists reasons.
- `/committee/projects/unpaired`: cycle dropdown switches the list.
- `/committee/projects/supervisor-load`: FYP1/FYP2 student counts match the underlying projects.
- `/committee/reports`: pick "Risk Assessment", format PDF, Generate → redirects to History → row appears with status "Ready", click Download → PDF saves and opens.
- `/committee/projects/export` direct URL → redirects to `/committee/projects`.

- [ ] **Step 3: Commit any tidy-ups**

If any lint/typecheck fixes were needed during the smoke, commit them under a single message:

```bash
git commit -am "smoke fixes"
```

---

# Self-review checklist (after writing the plan above)

- **Spec coverage:** Each spec section (§1–§9) has at least one task — §4.1 endpoints → Tasks 9, 16, 18; §4.2 → Tasks 10, 11, 17, 18; §4.3 → Tasks 8, 10, 12, 16, 17; §4.4 repositories → Tasks 4–7; §4.5 deps → Task 3; §4.6 migration → Task 1; §5.1 types → Task 19; §5.2 hooks → Task 20; §5.3 pages → Tasks 21–26; §5.4 routes → Task 27.
- **Placeholders:** None remaining. All "TBD" calls expanded into concrete code blocks.
- **Type consistency:** `ProjectProgressService.ProjectRisk` used identically in §Task 8 (definition) and §Task 10 (caller). `ReportFormat` enum used in both `ProjectExportService` and `CommitteeReportService`. Frontend `ReportConfig.reportType` matches backend `config.get("reportType")`. `useExportProjects` payload `format: 'CSV'|'XLSX'|'PDF'` matches backend `?format=csv|xlsx|pdf` (case normalized in `ReportFormat.parse`).

Plan complete.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-25-committee-projects-and-reports-rebuild.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — I execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
