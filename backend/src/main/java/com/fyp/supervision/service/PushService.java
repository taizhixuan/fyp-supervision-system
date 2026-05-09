package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.PushSubscription;
import com.fyp.supervision.repository.PushSubscriptionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Security;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.push.enabled:false}")
    private boolean enabled;

    @Value("${app.push.vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${app.push.vapid.private-key:}")
    private String vapidPrivateKey;

    @Value("${app.push.vapid.subject:mailto:fyp-noreply@mmu.edu.my}")
    private String vapidSubject;

    private nl.martijndwars.webpush.PushService pushClient;

    @PostConstruct
    void init() {
        if (!isConfigured()) {
            log.info("Web Push disabled (app.push.enabled={}, vapidKeysPresent={})",
                    enabled, !vapidPublicKey.isBlank() && !vapidPrivateKey.isBlank());
            return;
        }
        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            pushClient = new nl.martijndwars.webpush.PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("Web Push initialised");
        } catch (Exception e) {
            log.warn("Failed to initialise Web Push, push delivery will be disabled: {}", e.getMessage());
            pushClient = null;
        }
    }

    public boolean isConfigured() {
        return enabled
                && vapidPublicKey != null && !vapidPublicKey.isBlank()
                && vapidPrivateKey != null && !vapidPrivateKey.isBlank();
    }

    public String getPublicKey() {
        return isConfigured() ? vapidPublicKey : null;
    }

    @Async("emailExecutor")
    @Transactional
    public void sendToUser(Long userId, String type, String title, String message, String targetRoute) {
        if (pushClient == null) {
            return;
        }
        List<PushSubscription> subscriptions = subscriptionRepository.findByUser_UserId(userId);
        if (subscriptions.isEmpty()) {
            return;
        }
        String payload;
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("type", type);
            body.put("title", title == null ? "" : title);
            body.put("message", message == null ? "" : message);
            body.put("targetRoute", targetRoute == null ? "/" : targetRoute);
            payload = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            log.warn("Failed to encode push payload: {}", e.getMessage());
            return;
        }

        for (PushSubscription sub : subscriptions) {
            try {
                Subscription wp = new Subscription(
                        sub.getEndpoint(),
                        new Subscription.Keys(sub.getP256dh(), sub.getAuthKey()));
                Notification notification = new Notification(wp, payload);
                int statusCode = pushClient.send(notification).getStatusLine().getStatusCode();
                if (statusCode == 404 || statusCode == 410) {
                    log.info("Removing dead push subscription endpoint={} (status={})", sub.getEndpoint(), statusCode);
                    subscriptionRepository.deleteById(sub.getId());
                } else if (statusCode >= 400) {
                    log.warn("Push send returned status {} for user={} endpoint={}", statusCode, userId, sub.getEndpoint());
                } else {
                    sub.setLastUsedAt(LocalDateTime.now());
                    subscriptionRepository.save(sub);
                }
            } catch (Exception e) {
                log.warn("Failed to send push to endpoint={}: {}", sub.getEndpoint(), e.getMessage());
            }
        }
    }
}
