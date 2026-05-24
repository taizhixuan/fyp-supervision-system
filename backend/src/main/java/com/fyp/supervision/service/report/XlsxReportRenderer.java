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
