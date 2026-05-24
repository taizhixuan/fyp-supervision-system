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
