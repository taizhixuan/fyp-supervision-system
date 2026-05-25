package com.fyp.supervision.service;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Renders a {@link MeetingLog} into the MMU FCI Meeting Log .docx template,
 * populating header / sections / signatures. Mirrors {@link ProposalDocumentService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingLogDocumentService {

    private static final String TEMPLATE_FYP1 = "templates/meeting-log-fyp1.docx";
    private static final String TEMPLATE_FYP2 = "templates/meeting-log-fyp2.docx";

    private final StudentProfileRepository studentProfileRepository;
    private final FileStorageService fileStorageService;

    /** Render a single meeting log into populated DOCX bytes. */
    public byte[] renderLog(MeetingLog log) throws Exception {
        String templatePath = "FYP2".equalsIgnoreCase(log.getFypPhase())
                ? TEMPLATE_FYP2 : TEMPLATE_FYP1;
        try (InputStream in = new ClassPathResource(templatePath).getInputStream();
             XWPFDocument doc = new XWPFDocument(in);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Future tasks fill in the doc here.
            doc.write(out);
            return out.toByteArray();
        }
    }
}
