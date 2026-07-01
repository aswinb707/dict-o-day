package com.example.myapp.service;

import com.example.myapp.dto.AuthResponse;
import com.example.myapp.dto.LoginRequest;
import com.example.myapp.dto.RegisterRequest;
import com.example.myapp.entity.User;
import com.example.myapp.repository.UserRepository;
import com.example.myapp.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered.");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken.");
        }
        if (request.getDob() == null) {
            throw new IllegalArgumentException("Date of birth is required.");
        }
        if (request.getDob().isAfter(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Date of birth cannot be in the future.");
        }
        int age = java.time.Period.between(request.getDob(), java.time.LocalDate.now()).getYears();
        if (age < 10 || age > 116) {
            throw new IllegalArgumentException("Age must be between 10 and 116 years.");
        }

        // Default word count to 5 if not set, max 15
        int wordCount = request.getWordCount() != null ? Math.min(request.getWordCount(), 15) : 5;
        String difficulty = request.getDifficulty() != null ? request.getDifficulty() : "beginner";

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .dob(request.getDob())
                .difficulty(difficulty)
                .wordCountPerDay(wordCount)
                .streakCount(0)
                .build();
        userRepository.save(user);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        log.info("User registered: {}", user.getEmail());

        return AuthResponse.builder()
                .success(true)
                .message("User registered successfully.")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(toUserInfo(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .success(true)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(toUserInfo(user))
                .build();
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token.");
        }

        String usrId = jwtUtil.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(java.util.UUID.fromString(usrId))
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .success(true)
                .message("Token refreshed.")
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(toUserInfo(user))
                .build();
    }

    private AuthResponse.UserInfo toUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .difficulty(user.getDifficulty())
                .wordCountPerDay(user.getWordCountPerDay())
                .streakCount(user.getStreakCount())
                .build();
    }
}
