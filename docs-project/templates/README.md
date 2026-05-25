# Templates

Official templates supplied by MMU FCI for FYP1 and FYP2.

These are reference copies. The system's runtime templates (used by
`MeetingLogDocumentService` to render DOCX files) live separately
under `backend/src/main/resources/templates/`. Keep both in sync if
the faculty issues a new revision.

## Files

| File | Source | Used for |
|---|---|---|
| `meeting-log-fyp1.docx` | MMU FCI | Layout reference for the FYP1 meeting log DOCX renderer |
| `meeting-log-fyp2.docx` | MMU FCI | Layout reference for the FYP2 meeting log DOCX renderer |
| `fyp-proposal-form.docx` | MMU FCI | Layout reference for the proposal submission form |
| `ieee-conference-template.docx` | IEEE | Style reference for the FYP2 conference paper (`conference-paper/paper.docx`) |
| `commercialisation-guidelines-fyp2.pdf` | MMU FCI | Brief for the commercialisation proposal appendix (`report/appendix-commercialisation.md`) |

## When These Were Last Verified Against the Faculty Issue

Last manual check: 2026-05-25. If the faculty issues an updated
template, replace the file in this folder, refresh the runtime
template under `backend/src/main/resources/templates/` if relevant,
and re-run the meeting log JUnit suite
(`mvn -pl backend test -Dtest=MeetingLogDocumentServiceTest`) to
make sure the rendered output still matches.
