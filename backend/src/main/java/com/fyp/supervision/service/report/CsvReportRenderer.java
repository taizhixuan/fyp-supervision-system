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
