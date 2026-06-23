package com.example.myapp.service;

import com.example.myapp.entity.CalendarEntry;
import com.example.myapp.repository.CalendarEntryRepository;
import com.example.myapp.repository.UserWordProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserWordProgressRepository progressRepository;
    private final CalendarEntryRepository calendarRepository;

    /**
     * Learning analytics — mastery over time graph data.
     */
    public Map<String, Object> getAnalytics(UUID userId) {
        long totalWords = progressRepository.findByUserId(userId).size();
        long mastered = progressRepository.countByUserIdAndStatus(userId, "mastered");
        long learning = progressRepository.countByUserIdAndStatus(userId, "learning");
        long newWords = progressRepository.countByUserIdAndStatus(userId, "new");

        List<CalendarEntry> calendar = calendarRepository.findByUserIdOrderByEntryDateDesc(userId);

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("totalWordsStudied", totalWords);
        analytics.put("mastered", mastered);
        analytics.put("learning", learning);
        analytics.put("new", newWords);
        analytics.put("masteryPercentage", totalWords > 0 ? (mastered * 100.0 / totalWords) : 0);
        analytics.put("calendarHistory", calendar);

        return analytics;
    }
}
