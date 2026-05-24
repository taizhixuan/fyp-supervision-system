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
