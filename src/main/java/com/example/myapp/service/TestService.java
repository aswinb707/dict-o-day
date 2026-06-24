package com.example.myapp.service;

import com.example.myapp.entity.DailySession;
import com.example.myapp.entity.SessionWord;
import com.example.myapp.entity.Test;
import com.example.myapp.repository.DailySessionRepository;
import com.example.myapp.repository.SessionWordRepository;
import com.example.myapp.repository.TestRepository;
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
public class TestService {

    private final TestRepository testRepository;
    private final DailySessionRepository sessionRepository;
    private final SessionWordRepository sessionWordRepository;
    private final WordService wordService;

    public Test startTest(UUID userId, String type) {
        LocalDate today = LocalDate.now();
        DailySession session = sessionRepository.findByUserIdAndSessionDate(userId, today)
                .orElseThrow(() -> new IllegalArgumentException("Start a session first."));
        Test test = Test.builder()
                .sessionId(session.getId()).userId(userId).type(type)
                .totalQuestions(0).correctAnswers(0).scorePct(0.0).build();
        return testRepository.save(test);
    }

    @Transactional
    public boolean submitAnswer(UUID testId, UUID wordId, String answer, Integer timeTakenMs, UUID userId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new IllegalArgumentException("Test not found."));
        var word = wordService.getWordById(wordId);
        boolean correct = word.getWord().equalsIgnoreCase(answer.trim());
        SessionWord sw = SessionWord.builder()
                .sessionId(test.getSessionId()).wordId(wordId).mode("test")
                .answeredCorrect(correct).timeTakenMs(timeTakenMs).build();
        sessionWordRepository.save(sw);
        if (correct) {
            test.setCorrectAnswers(test.getCorrectAnswers() + 1);
        }
        test.setTotalQuestions(test.getTotalQuestions() + 1);
        testRepository.save(test);
        if (correct) {
            wordService.recordCorrectAnswer(userId, wordId);
        }
        return correct;
    }

    @Transactional
    public Test finalizeTest(UUID testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new IllegalArgumentException("Test not found."));
        if (test.getTotalQuestions() > 0) {
            test.setScorePct((double) test.getCorrectAnswers() / test.getTotalQuestions() * 100.0);
        }
        testRepository.save(test);
        DailySession session = sessionRepository.findById(test.getSessionId()).orElse(null);
        if (session != null) {
            session.setWordsTested(test.getTotalQuestions());
            session.setScore(test.getCorrectAnswers());
            sessionRepository.save(session);
        }
        return test;
    }

    public List<Test> getTestHistory(UUID userId) {
        return testRepository.findByUserIdOrderByTakenAtDesc(userId);
    }
}
