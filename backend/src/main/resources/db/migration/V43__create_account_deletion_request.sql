-- Account deletion requests (PDPA right of erasure).
-- One PENDING row per user max (enforced via partial-uniqueness pattern in app
-- logic, since MySQL 8 doesn't support filtered indexes). On APPROVED, a
-- background routine anonymises the user_account row and hard-deletes their
-- chat / notification data, then flips status to COMPLETED.

CREATE TABLE account_deletion_request (
    request_id        BIGINT       NOT NULL AUTO_INCREMENT,
    user_id           BIGINT       NOT NULL,
    reason            TEXT         NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    requested_at      DATETIME     NOT NULL,
    decided_by_user_id BIGINT      NULL,
    decided_at        DATETIME     NULL,
    decision_note     TEXT         NULL,
    completed_at      DATETIME     NULL,
    PRIMARY KEY (request_id),
    CONSTRAINT fk_adr_user FOREIGN KEY (user_id) REFERENCES user_account(user_id),
    CONSTRAINT fk_adr_decided_by FOREIGN KEY (decided_by_user_id) REFERENCES user_account(user_id),
    INDEX idx_adr_user_status (user_id, status),
    INDEX idx_adr_status_requested (status, requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
