package com.example.myapp.controller;

import com.example.myapp.dto.ApiResponse;
import com.example.myapp.dto.StartTestRequest;
import com.example.myapp.dto.SubmitAnswerRequest;
import com.example.myapp.entity.Test;
import com.example.myapp.security.JwtUserDetails;
import com.example.myapp.service.TestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Test>> startTest(
            @Valid @RequestBody StartTestRequest req, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(testService.startTest(d.getUserId(), req.getType())));
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable UUID id, @Valid @RequestBody SubmitAnswerRequest req, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        boolean correct = testService.submitAnswer(
                id, req.getWordId(), req.getAnswer(), req.getTimeTakenMs(), d.getUserId());
        return ResponseEntity.ok(Map.of("correct", correct));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Test>> finalizeTest(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(testService.finalizeTest(id)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Test>>> getHistory(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(testService.getTestHistory(d.getUserId())));
    }
}
