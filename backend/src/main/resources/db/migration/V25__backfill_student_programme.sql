-- V25: Backfill programme, faculty, expected_graduation for existing student profiles.
-- Mapping mirrors AuthService.programmeForSpecialisation:
--   Information Systems → Bachelor of Information Technology (Honours)
--   anything else      → Bachelor of Computer Science (Hons.)
-- Faculty is FCI for all current specialisations.
-- Expected graduation = intake_year + 3 (year string).

UPDATE student_profile
SET programme = CASE
    WHEN LOWER(TRIM(COALESCE(specialisation, ''))) = 'information systems'
        THEN 'Bachelor of Information Technology (Honours)'
    ELSE 'Bachelor of Computer Science (Hons.)'
END
WHERE (programme IS NULL OR programme = '')
  AND specialisation IS NOT NULL;

UPDATE student_profile
SET faculty = 'FCI'
WHERE (faculty IS NULL OR faculty = '')
  AND specialisation IS NOT NULL;

UPDATE student_profile
SET expected_graduation = CAST(intake_year + 3 AS CHAR)
WHERE (expected_graduation IS NULL OR expected_graduation = '')
  AND intake_year IS NOT NULL;
