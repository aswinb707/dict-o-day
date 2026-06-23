package com.example.myapp.service;

import com.example.myapp.entity.User;
import com.example.myapp.entity.UserWordProgress;
import com.example.myapp.entity.Word;
import com.example.myapp.repository.UserRepository;
import com.example.myapp.repository.UserWordProgressRepository;
import com.example.myapp.repository.WordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WordService {

    private final WordRepository wordRepository;
    private final UserWordProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    /**
     * GET /words/today — personalized daily word batch.
     * Uses Redis cache first, then queries DB.
     */
    public List<Word> getTodayWords(UUID userId) {
        // Check Redis cache
        String cached = redisService.getCachedDailyWords(userId);
        if (cached != null) {
            try {
                List<UUID> ids = objectMapper.readValue(cached, new TypeReference<>() {});
                return wordRepository.findByIdIn(ids);
            } catch (Exception e) {
                log.warn("Failed to parse cached daily words, fetching fresh");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Word> words = wordRepository.findTodayWords(userId, user.getWordCountPerDay());

        // Cache the word IDs
        try {
            List<UUID> ids = words.stream().map(Word::getId).toList();
            redisService.cacheDailyWords(userId, objectMapper.writeValueAsString(ids));
        } catch (Exception e) {
            log.warn("Failed to cache daily words");
        }

        return words;
    }

    public Word getWordById(UUID wordId) {
        return wordRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Word not found."));
    }

    /**
     * GET /words/learned — all words user has learned, with mastery scores.
     */
    public List<UserWordProgress> getLearnedWords(UUID userId) {
        return progressRepository.findByUserId(userId);
    }

    public List<Word> searchWords(String query) {
        return wordRepository.searchWords(query);
    }

    /**
     * Mark a word as seen — updates user_word_progress and mastery.
     */
    public UserWordProgress markWordSeen(UUID userId, UUID wordId) {
        UserWordProgress progress = progressRepository
                .findByUserIdAndWordId(userId, wordId)
                .orElse(UserWordProgress.builder()
                        .userId(userId)
                        .wordId(wordId)
                        .status("new")
                        .timesSeen(0)
                        .timesCorrect(0)
                        .masteryScore(0.0)
                        .build());

        progress.setTimesSeen(progress.getTimesSeen() + 1);
        progress.setLastReviewedAt(java.time.LocalDateTime.now());

        // Update status: new → learning after first view
        if ("new".equals(progress.getStatus())) {
            progress.setStatus("learning");
        }

        // Recalculate mastery
        recalculateMastery(progress);

        return progressRepository.save(progress);
    }

    /**
     * Record a correct answer — updates mastery.
     */
    public UserWordProgress recordCorrectAnswer(UUID userId, UUID wordId) {
        UserWordProgress progress = progressRepository
                .findByUserIdAndWordId(userId, wordId)
                .orElseThrow(() -> new IllegalArgumentException("No progress found for this word."));

        progress.setTimesCorrect(progress.getTimesCorrect() + 1);
        progress.setLastReviewedAt(java.time.LocalDateTime.now());

        recalculateMastery(progress);

        return progressRepository.save(progress);
    }

    /**
     * Mastery scoring: mastery_score = correct / seen × recency_weight.
     * Status: new → learning → mastered (when score >= 0.8).
     */
    private void recalculateMastery(UserWordProgress progress) {
        if (progress.getTimesSeen() == 0) return;

        double ratio = (double) progress.getTimesCorrect() / progress.getTimesSeen();

        // Recency weight: boost if reviewed recently (simplified)
        double recencyWeight = 1.0;
        if (progress.getLastReviewedAt() != null) {
            long daysSince = java.time.Duration.between(
                    progress.getLastReviewedAt(), java.time.LocalDateTime.now()).toDays();
            recencyWeight = Math.max(0.5, 1.0 - (daysSince * 0.05));
        }

        progress.setMasteryScore(ratio * recencyWeight);

        // Status transition
        if (progress.getMasteryScore() >= 0.8 && progress.getTimesSeen() >= 3) {
            progress.setStatus("mastered");
        } else if (progress.getTimesSeen() > 0) {
            progress.setStatus("learning");
        }
    }
}
