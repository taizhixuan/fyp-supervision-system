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
