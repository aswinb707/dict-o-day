package com.example.myapp.service;

import com.example.myapp.dto.UpdateProfileRequest;
import com.example.myapp.entity.User;
import com.example.myapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RedisService redisService;

    public User getProfile(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    public User updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = getProfile(userId);

        if (request.getDifficulty() != null) {
            user.setDifficulty(request.getDifficulty());
        }
        if (request.getWordCount() != null) {
            user.setWordCountPerDay(Math.max(1, Math.min(request.getWordCount(), 10)));
        }

        return userRepository.save(user);
    }

    public int getStreak(UUID userId) {
        // Try Redis first
        Integer cached = redisService.getCachedStreak(userId);
        if (cached != null) {
            return cached;
        }
        // Fallback to DB
        User user = getProfile(userId);
        redisService.cacheStreak(userId, user.getStreakCount());
        return user.getStreakCount();
    }
}
