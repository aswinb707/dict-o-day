package com.example.myapp.service;

import com.example.myapp.entity.CalendarEntry;
import com.example.myapp.entity.User;
import com.example.myapp.repository.CalendarEntryRepository;
import com.example.myapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Streak engine business logic:
 * On session complete → check last_active.
 * If yesterday → streak++. If today → no-op. Else → reset to 1.
 * Write to Redis + DB.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StreakService {

    private final UserRepository userRepository;
    private final CalendarEntryRepository calendarEntryRepository;
    private final RedisService redisService;

    @Transactional
    public int updateStreak(UUID userId, int wordsCount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        LocalDate today = LocalDate.now();
        LocalDateTime lastActive = user.getLastActive();
        int newStreak;

        if (lastActive == null) {
            // First ever session
            newStreak = 1;
        } else {
            LocalDate lastActiveDate = lastActive.toLocalDate();
            if (lastActiveDate.equals(today)) {
                // Already active today — no-op for streak
                newStreak = user.getStreakCount();
            } else if (lastActiveDate.equals(today.minusDays(1))) {
                // Yesterday — increment streak
                newStreak = user.getStreakCount() + 1;
            } else {
                // Missed days — reset to 1
                newStreak = 1;
            }
        }

        // Update user
        user.setStreakCount(newStreak);
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);

        // Update calendar entry
        CalendarEntry entry = calendarEntryRepository
                .findByUserIdAndEntryDate(userId, today)
                .orElse(CalendarEntry.builder()
                        .userId(userId)
                        .entryDate(today)
                        .wordsCount(0)
                        .build());
        entry.setWordsCount(entry.getWordsCount() + wordsCount);
        entry.setStreakMaintained(true);
        calendarEntryRepository.save(entry);

        // Cache in Redis
        redisService.cacheStreak(userId, newStreak);

        log.info("Streak updated for user {}: {} days", userId, newStreak);
        return newStreak;
    }
}
