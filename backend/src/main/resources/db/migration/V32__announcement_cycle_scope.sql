-- V32: scope announcements by specific cycle, not by cycleType string.
-- Drives the per-cohort audience filter so a student whose cycle has ended
-- stops receiving content broadcast to a newer FYP1/FYP2 cycle of the same type.

ALTER TABLE announcement
    ADD COLUMN cycle_id BIGINT NULL AFTER created_by_user_id,
    ADD CONSTRAINT fk_announcement_cycle
        FOREIGN KEY (cycle_id) REFERENCES fyp_cycle(cycle_id)
        ON DELETE SET NULL;

-- Best-effort backfill: for every FYP1/FYP2-scoped announcement, link it to the
-- most recently-started cycle of that type whose start_date <= the announcement's
-- created_at. Older or ALL/PROGRAMME-scoped rows stay NULL and the service treats
-- them via the cycleType fallback for backward compatibility.
UPDATE announcement a
JOIN fyp_cycle c
    ON c.cycle_type = a.scope
   AND c.start_date <= DATE(a.created_at)
   AND c.cycle_id = (
       SELECT c2.cycle_id
       FROM fyp_cycle c2
       WHERE c2.cycle_type = a.scope
         AND c2.start_date <= DATE(a.created_at)
       ORDER BY c2.start_date DESC
       LIMIT 1
   )
SET a.cycle_id = c.cycle_id
WHERE a.scope IN ('FYP1', 'FYP2')
  AND a.cycle_id IS NULL;

CREATE INDEX idx_announcement_cycle_id ON announcement(cycle_id);
