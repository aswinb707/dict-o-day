package com.example.myapp.service;

import com.example.myapp.entity.AiConversation;
import com.example.myapp.entity.Word;
import com.example.myapp.repository.AiConversationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AiConversationRepository conversationRepository;
    private final WordService wordService;
    private final ObjectMapper objectMapper;

    @Value("${app.groq.api-key}")
    private String groqApiKey;

    @Value("${app.groq.base-url}")
    private String groqBaseUrl;

    @Value("${app.groq.model}")
    private String groqModel;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * POST /ai/chat — send message to AI tutor.
     * Builds context with word details + user level + last N messages.
     */
    public String chat(UUID userId, String userMessage, UUID wordId) {
        // Build conversation history
        List<Map<String, String>> messages = new ArrayList<>();

        // System prompt
        String systemPrompt = buildSystemPrompt(wordId);
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Last N conversation messages for context
        List<AiConversation> history;
        if (wordId != null) {
            history = conversationRepository.findByUserIdAndWordIdOrderByCreatedAtAsc(userId, wordId);
        } else {
            history = conversationRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId);
            Collections.reverse(history);
        }

        for (AiConversation conv : history) {
            messages.add(Map.of("role", conv.getRole(), "content", conv.getMessage()));
        }

        // Add current user message
        messages.add(Map.of("role", "user", "content", userMessage));

        // Call Groq API
        String aiResponse = callGroqApi(messages);

        // Persist user message
        conversationRepository.save(AiConversation.builder()
                .userId(userId).wordId(wordId).role("user").message(userMessage).build());

        // Persist AI response
        conversationRepository.save(AiConversation.builder()
                .userId(userId).wordId(wordId).role("assistant").message(aiResponse).build());

        return aiResponse;
    }

    public List<AiConversation> getConversationHistory(UUID userId, UUID wordId) {
        return conversationRepository.findByUserIdAndWordIdOrderByCreatedAtAsc(userId, wordId);
    }

    private String buildSystemPrompt(UUID wordId) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are Dict-o-Day AI Tutor, an expert English language teacher. ");
        sb.append("Help users learn vocabulary, grammar, and pronunciation for competitive exams and interviews. ");
        sb.append("Be encouraging, clear, and provide examples. ");

        if (wordId != null) {
            try {
                Word word = wordService.getWordById(wordId);
                sb.append("\n\nCurrent word context:\n");
                sb.append("Word: ").append(word.getWord()).append("\n");
                sb.append("Definition: ").append(word.getDefinition()).append("\n");
                sb.append("Part of Speech: ").append(word.getPartOfSpeech()).append("\n");
                sb.append("Example: ").append(word.getInASentence()).append("\n");
                if (word.getExamples() != null) {
                    sb.append("More examples: ").append(String.join(", ", word.getExamples())).append("\n");
                }
            } catch (Exception e) {
                log.warn("Could not load word context for AI prompt");
            }
        }
        return sb.toString();
    }

    private String callGroqApi(List<Map<String, String>> messages) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> body = Map.of(
                    "model", groqModel,
                    "messages", messages,
                    "max_tokens", 1024,
                    "temperature", 0.7
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    groqBaseUrl + "/chat/completions",
                    HttpMethod.POST, request, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
            return "I'm sorry, I'm having trouble connecting right now. Please try again.";
        }
    }
}
