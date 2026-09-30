package com.fyp.supervision.service.report;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CsvCellTest {

    @Test
    void neutralisesFormulaPrefixes() {
        assertThat(CsvCell.of("=HYPERLINK(\"http://x\")")).isEqualTo("\"'=HYPERLINK(\"\"http://x\"\")\"");
        assertThat(CsvCell.of("+cmd")).isEqualTo("'+cmd");
        assertThat(CsvCell.of("@SUM(A1)")).isEqualTo("'@SUM(A1)");
        assertThat(CsvCell.of("-2+3")).isEqualTo("'-2+3");
    }

    @Test
    void leavesNumbersAndPlainTextAlone() {
        assertThat(CsvCell.of(-5)).isEqualTo("-5");
        assertThat(CsvCell.of("-5")).isEqualTo("-5");
        assertThat(CsvCell.of("3.14")).isEqualTo("3.14");
        assertThat(CsvCell.of("Tan, Ah Kow")).isEqualTo("\"Tan, Ah Kow\"");
        assertThat(CsvCell.of(null)).isEmpty();
    }
}
