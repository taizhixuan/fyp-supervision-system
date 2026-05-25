package com.fyp.supervision.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean enabled;

    @Value("${app.email.from:fyp-noreply@mmu.edu.my}")
    private String fromAddress;

    @Value("${app.email.app-base-url:http://localhost:3000}")
    private String appBaseUrl;

    @Async("emailExecutor")
    public void sendNotificationEmail(String recipientEmail, String recipientName,
                                      String type, String title, String message, String targetRoute) {
        if (!enabled) {
            log.debug("Email skipped (disabled): type={} to={}", type, recipientEmail);
            return;
        }
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return;
        }
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject(title);
            helper.setText(buildHtml(recipientName, title, message, targetRoute), true);
            mailSender.send(mime);
            log.info("Sent notification email type={} to={}", type, recipientEmail);
        } catch (Exception ex) {
            log.warn("Failed to send notification email type={} to={}: {}", type, recipientEmail, ex.getMessage());
        }
    }

    @Async("emailExecutor")
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String rawToken) {
        if (!enabled) {
            log.debug("Password reset email skipped (disabled): to={}", recipientEmail);
            return;
        }
        if (recipientEmail == null || recipientEmail.isBlank() || rawToken == null) {
            return;
        }
        try {
            String resetUrl = appBaseUrl + "/reset-password?token=" + rawToken;
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject("Reset your FYP Supervision password");
            helper.setText(buildResetHtml(recipientName, resetUrl), true);
            mailSender.send(mime);
            log.info("Sent password reset email to={}", recipientEmail);
        } catch (Exception ex) {
            log.warn("Failed to send password reset email to={}: {}", recipientEmail, ex.getMessage());
        }
    }

    private String buildResetHtml(String name, String resetUrl) {
        String safeName = escape(name == null ? "there" : name);
        String safeUrl = escape(resetUrl);
        return "<!DOCTYPE html><html><body style=\"font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;\">"
                + "<table cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;\">"
                + "<tr><td style=\"background:#1f2937;color:#ffffff;padding:16px 24px;font-size:16px;font-weight:bold;\">FYP Supervision System</td></tr>"
                + "<tr><td style=\"padding:24px;color:#111827;\">"
                + "<p style=\"margin:0 0 12px 0;\">Hi " + safeName + ",</p>"
                + "<h2 style=\"margin:0 0 12px 0;font-size:18px;\">Reset your password</h2>"
                + "<p style=\"margin:0 0 16px 0;line-height:1.5;\">We received a request to reset the password for your FYP Supervision account. "
                + "Click the button below to choose a new password. This link expires in 1 hour and can be used once.</p>"
                + "<p style=\"margin:0 0 24px 0;\"><a href=\"" + safeUrl + "\" style=\"display:inline-block;background:#2563eb;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;\">Reset password</a></p>"
                + "<p style=\"margin:0 0 8px 0;font-size:13px;color:#6b7280;\">If the button doesn't work, paste this link into your browser:</p>"
                + "<p style=\"margin:0 0 24px 0;font-size:13px;word-break:break-all;color:#2563eb;\">" + safeUrl + "</p>"
                + "<p style=\"margin:0;font-size:13px;color:#6b7280;\">If you didn't request this, you can ignore this email — your password won't change.</p>"
                + "</td></tr>"
                + "<tr><td style=\"padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;\">"
                + "FYP Supervision System &middot; Multimedia University"
                + "</td></tr></table></body></html>";
    }

    private String buildHtml(String name, String title, String message, String targetRoute) {
        String safeName = escape(name == null ? "there" : name);
        String safeTitle = escape(title == null ? "" : title);
        String safeMessage = escape(message == null ? "" : message);
        String ctaUrl = appBaseUrl + (targetRoute == null || targetRoute.isBlank() ? "/" : targetRoute);
        String prefsUrl = appBaseUrl + "/student/notifications/settings";
        return "<!DOCTYPE html><html><body style=\"font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;\">"
                + "<table cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;\">"
                + "<tr><td style=\"background:#1f2937;color:#ffffff;padding:16px 24px;font-size:16px;font-weight:bold;\">FYP Supervision System</td></tr>"
                + "<tr><td style=\"padding:24px;color:#111827;\">"
                + "<p style=\"margin:0 0 12px 0;\">Hi " + safeName + ",</p>"
                + "<h2 style=\"margin:0 0 12px 0;font-size:18px;\">" + safeTitle + "</h2>"
                + "<p style=\"margin:0 0 24px 0;line-height:1.5;\">" + safeMessage + "</p>"
                + "<p style=\"margin:0 0 24px 0;\"><a href=\"" + escape(ctaUrl) + "\" style=\"display:inline-block;background:#2563eb;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;\">View in app</a></p>"
                + "</td></tr>"
                + "<tr><td style=\"padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;\">"
                + "You received this email because of your notification preferences. "
                + "<a href=\"" + escape(prefsUrl) + "\" style=\"color:#2563eb;\">Manage preferences</a>."
                + "</td></tr></table></body></html>";
    }

    private String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
