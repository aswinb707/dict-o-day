package com.example.myapp.controller;

import com.example.myapp.dto.ApiResponse;
import com.example.myapp.dto.UpdateProfileRequest;
import com.example.myapp.entity.User;
import com.example.myapp.security.JwtUserDetails;
import com.example.myapp.service.AnalyticsService;
import com.example.myapp.service.UserService;
import com.example.myapp.service.WordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AnalyticsService analyticsService;
    private final WordService wordService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getProfile(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(d.getUserId())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @RequestBody UpdateProfileRequest request, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        User updated = userService.updateProfile(d.getUserId(), request);
        if (request.getWordCount() != null) {
            wordService.adjustTodayWordsToLimit(d.getUserId(), updated.getWordCountPerDay());
        }
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/me/streak")
    public ResponseEntity<Map<String, Object>> getStreak(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        User user = userService.getProfile(d.getUserId());
        return ResponseEntity.ok(Map.of(
                "streakCount", userService.getStreak(d.getUserId()),
                "lastActive", user.getLastActive() != null ? user.getLastActive().toString() : "never"));
    }

    @GetMapping("/me/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getAnalytics(d.getUserId())));
    }
}
