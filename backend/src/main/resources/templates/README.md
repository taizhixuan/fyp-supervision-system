# Meeting Log Templates

These two files are runtime copies of the MMU FCI meeting log templates.

- Source of truth: `docs-project/template/Meeting Log FYP1.docx`, `Meeting Log FYP2.docx`
- Loaded by: `com.fyp.supervision.service.MeetingLogDocumentService` via `ClassPathResource`

If you change the source `.docx`, copy the updated file here too — Maven
includes everything under `src/main/resources/**` in the JAR, and the service
loads from the classpath, not from the docs-project folder.

The companion `fyp-proposal-form.docx` in this directory is read by
`ProposalDocumentService` and follows the same pattern.
