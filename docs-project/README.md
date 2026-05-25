# docs-project

Project documentation for the FYP Supervision System (MMU FCI,
Bachelor of Computer Science). This folder is gitignored in parts;
see the root `CLAUDE.md` for what is checked in and what is not.

## Folder Map

| Folder | What lives there |
|---|---|
| `report/` | The FYP2 academic report, chapter by chapter. Includes appendix, data dictionary, sequence diagrams and the ERD source. |
| `conference-paper/` | IEEE-format conference paper that summarises the FYP2 work. Markdown source, LaTeX source, generated DOCX and PDF, plus the matplotlib scripts that produce the figures. |
| `templates/` | Official templates supplied by MMU FCI (meeting log, proposal form, IEEE conference template, commercialisation proposal guidelines). |
| `api/` | API documentation and Postman collections for the five role-based endpoint groups (auth, student, supervisor, committee, admin). |
| `demo/` | The live demo walkthrough script used in supervisor sessions. |
| `CLAUDE.md` | Tone and style rules for any new prose written into this folder. |

## Where to Start

- New to the project? Read `report/chapter4.md` first for the system design and `report/chapter5.md` for the implementation.
- Looking for templates? See `templates/README.md`.
- Building the conference paper? See `conference-paper/README.md`.
- Running the API by hand? See `api/README.md`.
- Doing a live demo? See `demo/walkthrough.md`.

## Generated Output

Each subfolder that has a build pipeline keeps generated artefacts
under a `build/` subfolder, separate from the source.

- `report/build/` — DOCX exports of report chapters and commit logs
- `conference-paper/build/` — LaTeX auxiliary files and the Overleaf zip

These can be regenerated from source and are not the canonical
version of any document. The canonical version is always the
Markdown or LaTeX source next to them.
