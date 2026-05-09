-- Drop the plagiarism_score column from proposal_check_result.
-- The previous AI analyzer hardcoded this value to 85 for every proposal,
-- which the frontend rendered as a real plagiarism check. The system does
-- not actually compute a plagiarism signal, so the column is removed
-- rather than left as a permanently-fake field.

ALTER TABLE proposal_check_result
    DROP COLUMN plagiarism_score;
