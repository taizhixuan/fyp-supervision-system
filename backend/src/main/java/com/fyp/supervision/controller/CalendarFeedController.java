package com.fyp.supervision.controller;

import com.fyp.supervision.service.CalendarFeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Calendar subscription feed. Token management needs a login (students and supervisors);
 * /calendar/feed/{token}.ics is public because calendar apps can't send a JWT.
 */
@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
public class CalendarFeedController {

    private final CalendarFeedService calendarFeedService;

    @GetMapping("/feed-token")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(calendarFeedService.status(Long.parseLong(user.getUsername())));
    }

    @PostMapping("/feed-token")
    public ResponseEntity<Map<String, Object>> rotate(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(calendarFeedService.rotate(Long.parseLong(user.getUsername())));
    }

    @DeleteMapping("/feed-token")
    public ResponseEntity<Void> revoke(@AuthenticationPrincipal UserDetails user) {
        calendarFeedService.revoke(Long.parseLong(user.getUsername()));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/feed/{file}")
    public ResponseEntity<byte[]> feed(@PathVariable String file) {
        String token = file.endsWith(".ics") ? file.substring(0, file.length() - 4) : file;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"fyp-meetings.ics\"")
                .cacheControl(CacheControl.noCache())
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .body(calendarFeedService.feed(token));
    }
}
