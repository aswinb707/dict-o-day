package com.example.myapp.service;

import com.example.myapp.entity.DailySession;
import com.example.myapp.entity.SessionWord;
import com.example.myapp.repository.DailySessionRepository;
import com.example.myapp.repository.SessionWordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final DailySessionRepository sessionRepository;
    private final SessionWordRepository sessionWordRepository;
    private final StreakService streakService;
    private final WordService wordService;
    private final RedisService redisService;

    /**
     * POST /sessions/start — begin today's session.
     */
    public DailySession startSession(UUID userId) {
        LocalDate today = LocalDate.now();

        // Check if session already exists for today
        return sessionRepository.findByUserIdAndSessionDate(userId, today)
                .orElseGet(() -> {
                    DailySession session = DailySession.builder()
                            .userId(userId)
                            .sessionDate(today)
                            .wordsLearned(0)
                            .wordsTested(0)
                            .score(0)
                            .completed(false)
                            .build();
                    log.info("New session started for user {} on {}", userId, today);
                    return sessionRepository.save(session);
                });
    }

    /**
     * POST /sessions/:id/word-seen — mark a word as seen in learn mode.
     */
    @Transactional
    public SessionWord markWordSeen(UUID sessionId, UUID wordId, UUID userId) {
        DailySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        // Record in session_words
        SessionWord sw = SessionWord.builder()
                .sessionId(sessionId)
                .wordId(wordId)
                .mode("learn")
                .answeredCorrect(null)
                .build();
        sessionWordRepository.save(sw);

        // Update session word count
        session.setWordsLearned(session.getWordsLearned() + 1);
        sessionRepository.save(session);

        // Update word progress
        wordService.markWordLearnedAfterQuiz(userId, wordId);

        // Update streak/calendar immediately for the learned word!
        streakService.updateStreak(userId, 1);

        return sw;
    }

    /**
     * POST /sessions/:id/complete — complete session, update streak + calendar.
     */
    @Transactional
    public DailySession completeSession(UUID sessionId, UUID userId) {
        DailySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        if (session.getCompleted()) {
            return session; // already completed
        }

        session.setCompleted(true);
        sessionRepository.save(session);

        // Update streak with 0 additional words (since we already counted them in markWordSeen)
        streakService.updateStreak(userId, 0);

        log.info("Session {} completed for user {}. Words learned: {}", sessionId, userId, session.getWordsLearned());
        return session;
    }

    /**
     * GET /sessions/:date — words learned on a specific date.
     */
    public DailySession getSessionByDate(UUID userId, LocalDate date) {
        return sessionRepository.findByUserIdAndSessionDate(userId, date)
                .orElseThrow(() -> new IllegalArgumentException("No session found for date: " + date));
    }

    public List<SessionWord> getSessionWords(UUID sessionId) {
        return sessionWordRepository.findBySessionId(sessionId);
    }
}
