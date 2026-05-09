-- V20: Web Push subscriptions per user. One row per browser/device endpoint.
-- endpoint is unique because the push gateway URL itself uniquely identifies a subscription;
-- if a user re-subscribes on the same browser, we upsert by endpoint.

CREATE TABLE push_subscription (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    endpoint      VARCHAR(500) NOT NULL,
    p256dh        VARCHAR(255) NOT NULL,
    auth_key      VARCHAR(255) NOT NULL,
    user_agent    VARCHAR(255) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at  DATETIME     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_push_subscription_endpoint (endpoint),
    KEY idx_push_subscription_user (user_id),
    CONSTRAINT fk_push_subscription_user
        FOREIGN KEY (user_id) REFERENCES user_account(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
