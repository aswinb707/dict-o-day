package com.example.myapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Redis service for session caching, daily word queues, streaks, and rate limiting.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisService {

    private final StringRedisTemplate redisTemplate;

    private static final String STREAK_KEY = "streak:";
    private static final String DAILY_WORDS_KEY = "daily_words:";
    private static final String RATE_LIMIT_KEY = "rate_limit:";

    // ── Streak Cache ──

    public void cacheStreak(UUID userId, int streak) {
        redisTemplate.opsForValue().set(
                STREAK_KEY + userId, String.valueOf(streak), Duration.ofHours(24));
    }

    public Integer getCachedStreak(UUID userId) {
        String val = redisTemplate.opsForValue().get(STREAK_KEY + userId);
        return val != null ? Integer.parseInt(val) : null;
    }

    // ── Daily Word Queue ──

    public void cacheDailyWords(UUID userId, String wordsJson) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime midnight = now.toLocalDate().plusDays(1).atStartOfDay();
        java.time.Duration durationToMidnight = java.time.Duration.between(now, midnight);
        redisTemplate.opsForValue().set(
                DAILY_WORDS_KEY + userId, wordsJson, durationToMidnight);
    }

    public String getCachedDailyWords(UUID userId) {
        return redisTemplate.opsForValue().get(DAILY_WORDS_KEY + userId);
    }

    public void clearDailyWords(UUID userId) {
        redisTemplate.delete(DAILY_WORDS_KEY + userId);
    }

    // ── Rate Limiting ──

    public boolean isRateLimited(String key, int maxRequests, Duration window) {
        String redisKey = RATE_LIMIT_KEY + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);
        if (count != null && count == 1) {
            redisTemplate.expire(redisKey, window);
        }
        return count != null && count > maxRequests;
    }
}
