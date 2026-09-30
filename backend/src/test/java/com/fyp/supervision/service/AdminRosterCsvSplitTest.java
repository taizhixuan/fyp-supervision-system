package com.fyp.supervision.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AdminRosterCsvSplitTest {

    @Test
    void quotedCommaStaysInOneField() {
        assertThat(AdminRosterService.splitCsvLine("1211100001,a@student.mmu.edu.my,\"Tan, Ah Kow\",,Software Engineering"))
                .containsExactly("1211100001", "a@student.mmu.edu.my", "Tan, Ah Kow", "", "Software Engineering");
    }

    @Test
    void doubledQuoteIsALiteralQuote() {
        assertThat(AdminRosterService.splitCsvLine("x,\"say \"\"hi\"\"\",y"))
                .containsExactly("x", "say \"hi\"", "y");
    }
}
