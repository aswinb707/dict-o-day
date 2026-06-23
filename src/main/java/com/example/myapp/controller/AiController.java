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
        String suggestions = aiService.chat(d.getUserId(),
                "Based on my vocabulary level, suggest 5 new English words I should learn. " +
                "For each word give: the word, part of speech, definition, and an example sentence. " +
                "Format as a numbered list.", null);
        return ResponseEntity.ok(Map.of("success", true, "suggestions", suggestions));
    }
}
