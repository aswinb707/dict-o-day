package com.example.myapp.controller;

import com.example.myapp.dto.AiChatRequest;
import com.example.myapp.dto.ApiResponse;
import com.example.myapp.entity.AiConversation;
import com.example.myapp.security.JwtUserDetails;
import com.example.myapp.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @Valid @RequestBody AiChatRequest req, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        String response = aiService.chat(d.getUserId(), req.getMessage(), req.getWordId());
        return ResponseEntity.ok(Map.of("success", true, "response", response));
    }

    @GetMapping("/conversations/{wordId}")
    public ResponseEntity<ApiResponse<List<AiConversation>>> getConversations(
            @PathVariable UUID wordId, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(
                aiService.getConversationHistory(d.getUserId(), wordId)));
    }

    @PostMapping("/suggest-words")
    public ResponseEntity<Map<String, Object>> suggestWords(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        List<String> words = aiService.suggestWordsJson(d.getUserId());
        return ResponseEntity.ok(Map.of("success", true, "words", words));
    }

    @PostMapping("/ielts-evaluate")
    public ResponseEntity<Map<String, Object>> evaluateSpeaking(
            @RequestBody Map<String, String> request) {
        String question = request.get("question");
        String answer = request.get("answer");
        String evaluation = aiService.evaluateSpeakingAnswer(question, answer);
        return ResponseEntity.ok(Map.of("success", true, "evaluation", evaluation));
    }

    @PostMapping("/ielts-next-question")
    public ResponseEntity<Map<String, Object>> getNextQuestion(
            @RequestBody Map<String, Object> request) {
        List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");
        int questionNumber = ((Number) request.get("questionNumber")).intValue();
        int totalQuestions = ((Number) request.get("totalQuestions")).intValue();
        String nextQuestion = aiService.generateNextIeltsQuestion(history, questionNumber, totalQuestions);
        return ResponseEntity.ok(Map.of("success", true, "nextQuestion", nextQuestion));
    }
}
