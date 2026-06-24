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

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private AiService aiService;

    public Word createCustomWord(UUID userId, Word customWord) {
        Word word = wordRepository.findByWordIgnoreCase(customWord.getWord().trim())
                .orElseGet(() -> wordRepository.save(customWord));
        markWordSeen(userId, word.getId());
        forceWordIntoTodayWords(userId, word.getId());
        return word;
    }

    public Word addRecommendedWord(UUID userId, String wordName) {
        String cleanWord = wordName.trim();
        Word word = wordRepository.findByWordIgnoreCase(cleanWord)
                .orElseGet(() -> {
                    Word generated = generateWordDetails(cleanWord);
                    return wordRepository.save(generated);
                });
        markWordSeen(userId, word.getId());
        forceWordIntoTodayWords(userId, word.getId());
        return word;
    }

    public Word generateWordDetails(String wordName) {
        try {
            String jsonStr = aiService.generateWordDetailsWithAi(wordName);
            if (jsonStr.contains("```")) {
                jsonStr = jsonStr.replaceAll("```json", "").replaceAll("```", "").trim();
            }
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(jsonStr);
            String word = root.path("word").asText(wordName);
            String pos = root.path("partOfSpeech").asText("adjective");
            String def = root.path("definition").asText("Definition not found.");
            String pron = root.path("pronunciation").asText("Pronunciation not found.");
            String inASentence = root.path("inASentence").asText("");
            List<String> examples = new java.util.ArrayList<>();
            if (root.has("examples") && root.get("examples").isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode ex : root.get("examples")) {
                    examples.add(ex.asText());
                }
            }
            String synonyms = root.path("synonyms").asText("N/A");
            String antonyms = root.path("antonyms").asText("N/A");
            
            boolean isIeltsLevel = root.path("isIeltsLevel").asBoolean(true);
            String fusedWord = root.has("fusedWord") && !root.get("fusedWord").isNull() && !root.get("fusedWord").asText().equalsIgnoreCase("null") ? root.get("fusedWord").asText() : null;
            String fusedDefinition = root.has("fusedDefinition") && !root.get("fusedDefinition").isNull() && !root.get("fusedDefinition").asText().equalsIgnoreCase("null") ? root.get("fusedDefinition").asText() : null;
            String fusedPronunciation = root.has("fusedPronunciation") && !root.get("fusedPronunciation").isNull() && !root.get("fusedPronunciation").asText().equalsIgnoreCase("null") ? root.get("fusedPronunciation").asText() : null;
            String fusedSentence = root.has("fusedSentence") && !root.get("fusedSentence").isNull() && !root.get("fusedSentence").asText().equalsIgnoreCase("null") ? root.get("fusedSentence").asText() : null;

            List<String> tags = new java.util.ArrayList<>();
            tags.add("recommended");
            if (isIeltsLevel) {
                tags.add("ielts");
            } else {
                tags.add("fused");
            }

            return Word.builder()
                .word(word)
                .partOfSpeech(pos)
                .definition(def)
                .pronunciation(pron)
                .inASentence(inASentence)
                .examples(examples)
                .synonyms(synonyms)
                .antonyms(antonyms)
                .fusedWord(fusedWord)
                .fusedDefinition(fusedDefinition)
                .fusedPronunciation(fusedPronunciation)
                .fusedSentence(fusedSentence)
                .tags(tags)
                .build();
        } catch (Exception e) {
            log.error("Failed to generate word details for: {}, error: {}", wordName, e.getMessage());
            return Word.builder()
                .word(wordName)
                .partOfSpeech("adjective")
                .definition("An advanced word recommended for professional speaking.")
                .pronunciation(wordName)
                .inASentence("It is " + wordName + " to use advanced vocabulary.")
                .examples(List.of("A " + wordName + " approach works best."))
                .tags(List.of("recommended"))
                .synonyms("N/A")
                .antonyms("N/A")
                .build();
        }
    }

    public List<Word> getTodayWords(UUID userId) {
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

        int limit = user.getWordCountPerDay();
        java.time.LocalDate today = java.time.LocalDate.now();

        List<UserWordProgress> duePostponedProgress = progressRepository.findDuePostponed(userId, today);
        List<Word> words = new java.util.ArrayList<>();
        
        for (UserWordProgress p : duePostponedProgress) {
            Word w = wordRepository.findById(p.getWordId()).orElse(null);
            if (w != null) {
                words.add(w);
                p.setPostponedUntil(null);
                progressRepository.save(p);
            }
        }

        int remaining = limit - words.size();
        if (remaining > 0) {
            List<Word> randomPool = wordRepository.findTodayWordsPersonalized(userId, remaining + words.size());
            for (Word w : randomPool) {
                if (words.size() >= limit) break;
                boolean alreadyInList = words.stream().anyMatch(existing -> existing.getId().equals(w.getId()));
                if (!alreadyInList) {
                    words.add(w);
                }
            }
        }

        // If we still need words, fetch suggestions from the AI
        int stillNeeded = limit - words.size();
        if (stillNeeded > 0) {
            log.info("Database low on unmastered words. Requesting AI suggestions for user {}", userId);
            try {
                int countToRequest = Math.max(5, stillNeeded + words.size());
                List<String> suggestions = aiService.suggestWordsJson(userId, countToRequest);
                for (String s : suggestions) {
                    if (words.size() >= limit) break;
                    
                    String cleanSuggestion = s.trim();
                    if (cleanSuggestion.isEmpty()) continue;

                    // Ensure we don't duplicate a word in the today list
                    boolean alreadyInToday = words.stream().anyMatch(w -> w.getWord().equalsIgnoreCase(cleanSuggestion));
                    if (alreadyInToday) continue;

                    Word w = wordRepository.findByWordIgnoreCase(cleanSuggestion)
                            .orElseGet(() -> {
                                Word generated = generateWordDetails(cleanSuggestion);
                                if (generated != null) {
                                    return wordRepository.save(generated);
                                }
                                return null;
                            });

                    if (w != null) {
                        boolean mastered = progressRepository.findByUserIdAndWordId(userId, w.getId())
                                .map(p -> "mastered".equals(p.getStatus()))
                                .orElse(false);
                        
                        if (!mastered) {
                            words.add(w);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to generate AI suggestions for today's words", e);
            }
        }

        // Safety fallback: if we still don't have enough words, fetch any words from DB
        if (words.size() < limit) {
            List<Word> fallbackPool = wordRepository.findAll();
            for (Word w : fallbackPool) {
                if (words.size() >= limit) break;
                boolean alreadyInList = words.stream().anyMatch(existing -> existing.getId().equals(w.getId()));
                if (!alreadyInList) {
                    words.add(w);
                }
            }
        }

        try {
            List<UUID> ids = words.stream().map(Word::getId).toList();
            redisService.cacheDailyWords(userId, objectMapper.writeValueAsString(ids));
        } catch (Exception e) {
            log.warn("Failed to cache daily words");
        }

        return words;
    }

    public void adjustTodayWordsToLimit(UUID userId, int newLimit) {
        try {
            // First fetch current today words from cache/DB
            List<Word> currentWords = getTodayWords(userId);
            List<UUID> ids = new java.util.ArrayList<>(currentWords.stream().map(Word::getId).toList());
            
            if (ids.size() < newLimit) {
                // Limit increased: need to create/add new words
                int needed = newLimit - ids.size();

                // First: retrieve any postponed words and un-postpone them
                List<UserWordProgress> postponedProgress = progressRepository.findPostponed(userId);
                for (UserWordProgress p : postponedProgress) {
                    if (needed <= 0) break;
                    
                    Word w = wordRepository.findById(p.getWordId()).orElse(null);
                    if (w != null && !ids.contains(w.getId())) {
                        ids.add(w.getId());
                        p.setPostponedUntil(null);
                        progressRepository.save(p);
                        needed--;
                    }
                }

                // Second: if we still need words, fetch personalized unmastered words from DB
                if (needed > 0) {
                    List<Word> additional = wordRepository.findTodayWordsPersonalized(userId, needed + ids.size());
                    for (Word w : additional) {
                        if (ids.size() >= newLimit) break;
                        if (!ids.contains(w.getId())) {
                            ids.add(w.getId());
                        }
                    }
                }

                // If we still need words, request AI suggestions
                int stillNeeded = newLimit - ids.size();
                if (stillNeeded > 0) {
                    log.info("Database low on unmastered words during adjustment. Requesting AI suggestions for user {}", userId);
                    try {
                        int countToRequest = Math.max(5, stillNeeded + ids.size());
                        List<String> suggestions = aiService.suggestWordsJson(userId, countToRequest);
                        for (String s : suggestions) {
                            if (ids.size() >= newLimit) break;
                            
                            String cleanSuggestion = s.trim();
                            if (cleanSuggestion.isEmpty()) continue;

                            Word w = wordRepository.findByWordIgnoreCase(cleanSuggestion)
                                    .orElseGet(() -> {
                                        Word generated = generateWordDetails(cleanSuggestion);
                                        if (generated != null) {
                                            return wordRepository.save(generated);
                                        }
                                        return null;
                                    });

                            if (w != null && !ids.contains(w.getId())) {
                                boolean mastered = progressRepository.findByUserIdAndWordId(userId, w.getId())
                                        .map(p -> "mastered".equals(p.getStatus()))
                                        .orElse(false);
                                
                                if (!mastered) {
                                    ids.add(w.getId());
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Failed to generate AI suggestions during adjustment", e);
                    }
                }

                // Safety fallback: if we still don't have enough, fetch any words from DB
                if (ids.size() < newLimit) {
                    List<Word> fallbackPool = wordRepository.findAll();
                    for (Word w : fallbackPool) {
                        if (ids.size() >= newLimit) break;
                        if (!ids.contains(w.getId())) {
                            ids.add(w.getId());
                        }
                    }
                }
            } else if (ids.size() > newLimit) {
                // Limit decreased: truncate the list to newLimit
                ids = new java.util.ArrayList<>(ids.subList(0, newLimit));
            }
            
            // Save back to Redis cache
            redisService.cacheDailyWords(userId, objectMapper.writeValueAsString(ids));
        } catch (Exception e) {
            log.error("Failed to adjust today words to new limit: {}", e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void postponeWord(UUID userId, UUID wordId) {
        UserWordProgress progress = progressRepository.findByUserIdAndWordId(userId, wordId)
                .orElseGet(() -> UserWordProgress.builder()
                        .userId(userId)
                        .wordId(wordId)
                        .status("learning")
                        .timesSeen(1)
                        .timesCorrect(0)
                        .masteryScore(0.0)
                        .build());
        progress.setPostponedUntil(java.time.LocalDate.now().plusDays(1));
        progressRepository.save(progress);

        try {
            String cached = redisService.getCachedDailyWords(userId);
            if (cached != null) {
                List<UUID> ids = new java.util.ArrayList<>(objectMapper.readValue(cached, new TypeReference<List<UUID>>() {}));
                if (ids.remove(wordId)) {
                    redisService.cacheDailyWords(userId, objectMapper.writeValueAsString(ids));
                }
            }
        } catch (Exception e) {
            log.error("Failed to remove postponed word from Redis: {}", e.getMessage());
        }
    }

    private void forceWordIntoTodayWords(UUID userId, UUID wordId) {
        try {
            String cached = redisService.getCachedDailyWords(userId);
            List<UUID> ids = new java.util.ArrayList<>();
            if (cached != null) {
                try {
                    ids = new java.util.ArrayList<>(objectMapper.readValue(cached, new TypeReference<List<UUID>>() {}));
                } catch (Exception e) {
                    log.warn("Failed to parse cached daily words during force addition");
                }
            }
            if (ids.isEmpty()) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));
                List<Word> words = wordRepository.findTodayWordsPersonalized(userId, user.getWordCountPerDay());
                ids = new java.util.ArrayList<>(words.stream().map(Word::getId).toList());
            }
            
            if (!ids.contains(wordId)) {
                ids.add(0, wordId);
                redisService.cacheDailyWords(userId, objectMapper.writeValueAsString(ids));
            }
        } catch (Exception e) {
            log.error("Failed to force word into today's list: {}", e.getMessage());
        }
    }

    public Word getWordById(UUID wordId) {
        return wordRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Word not found."));
    }

    public Word previewWord(String wordName) {
        return wordRepository.findByWordIgnoreCase(wordName.trim())
                .orElseGet(() -> generateWordDetails(wordName.trim()));
    }

    /**
     * Get learned words.
     */
    public List<UserWordProgress> getLearnedWords(UUID userId) {
        List<UserWordProgress> progressList = progressRepository.findByUserIdAndStatus(userId, "mastered");
        for (UserWordProgress p : progressList) {
            wordRepository.findById(p.getWordId()).ifPresent(p::setWord);
        }
        return progressList;
    }

    /**
     * Search words by query.
     */
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

    public UserWordProgress markWordLearnedAfterQuiz(UUID userId, UUID wordId) {
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

        progress.setTimesSeen(progress.getTimesSeen() + 3);
        progress.setTimesCorrect(progress.getTimesSeen());
        progress.setLastReviewedAt(java.time.LocalDateTime.now());

        recalculateMastery(progress);

        // Ensure 100% mastery and status is mastered
        progress.setMasteryScore(1.0);
        progress.setStatus("mastered");

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
