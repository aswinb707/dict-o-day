package com.example.myapp.controller;

import com.example.myapp.dto.ApiResponse;
import com.example.myapp.dto.WordSeenRequest;
import com.example.myapp.entity.CalendarEntry;
import com.example.myapp.entity.DailySession;
import com.example.myapp.entity.SessionWord;
import com.example.myapp.repository.CalendarEntryRepository;
import com.example.myapp.security.JwtUserDetails;
import com.example.myapp.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final CalendarEntryRepository calendarEntryRepository;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<DailySession>> startSession(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(sessionService.startSession(d.getUserId())));
    }

    @PostMapping("/{id}/word-seen")
    public ResponseEntity<ApiResponse<SessionWord>> markWordSeen(
            @PathVariable UUID id, @Valid @RequestBody WordSeenRequest req, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(
                sessionService.markWordSeen(id, req.getWordId(), d.getUserId())));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<DailySession>> completeSession(
            @PathVariable UUID id, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(sessionService.completeSession(id, d.getUserId())));
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<CalendarEntry>>> getCalendar(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        List<CalendarEntry> entries = calendarEntryRepository
                .findByUserIdOrderByEntryDateDesc(d.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @GetMapping("/{date}")
    public ResponseEntity<ApiResponse<DailySession>> getSessionByDate(
            @PathVariable String date, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        LocalDate ld = LocalDate.parse(date);
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getSessionByDate(d.getUserId(), ld)));
    }
}
