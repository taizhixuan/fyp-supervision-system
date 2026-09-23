package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.service.ActionItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/supervisor/action-items")
@RequiredArgsConstructor
public class SupervisorActionItemController {

    private final ActionItemService actionItemService;

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal UserDetails user, @PathVariable Long id,
                                    @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(actionItemService.toDto(actionItemService.setStatus(id, userId, data.get("status"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        actionItemService.delete(id, Long.parseLong(user.getUsername()));
        return ResponseEntity.noContent().build();
    }
}
