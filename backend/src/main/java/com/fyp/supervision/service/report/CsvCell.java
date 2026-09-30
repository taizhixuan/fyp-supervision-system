package com.fyp.supervision.service.report;

/**
 * Escapes one CSV cell. Besides RFC 4180 quoting, it neutralises spreadsheet formulas:
 * a cell starting with = + - @ (or a tab/CR) is run as a formula by Excel, so a project
 * titled {@code =HYPERLINK(...)} would execute on the committee's machine. Prefixing a
 * single quote makes Excel treat it as text.
 */
public final class CsvCell {

    private static final java.util.regex.Pattern PLAIN_NUMBER =
            java.util.regex.Pattern.compile("[-+]?\\d+(\\.\\d+)?");

    private CsvCell() {}

    public static String of(Object value) {
        if (value == null) return "";
        String s = value.toString();
        if (!s.isEmpty() && !(value instanceof Number) && !PLAIN_NUMBER.matcher(s).matches()
                && "=+-@\t\r".indexOf(s.charAt(0)) >= 0) {
            s = "'" + s;
        }
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
