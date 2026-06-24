package com.example.myapp.controller;

import com.example.myapp.dto.ApiResponse;
import com.example.myapp.entity.UserWordProgress;
import com.example.myapp.entity.Word;
import com.example.myapp.security.JwtUserDetails;
import com.example.myapp.service.WordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {

    private final WordService wordService;

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<Word>>> getTodayWords(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(wordService.getTodayWords(d.getUserId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Word>> getWordById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(wordService.getWordById(id)));
    }

    @GetMapping("/learned")
    public ResponseEntity<ApiResponse<List<UserWordProgress>>> getLearnedWords(Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(wordService.getLearnedWords(d.getUserId())));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Word>>> searchWords(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(wordService.searchWords(q)));
    }

    @GetMapping("/preview")
    public ResponseEntity<ApiResponse<Word>> previewWord(@RequestParam String word) {
        return ResponseEntity.ok(ApiResponse.ok(wordService.previewWord(word)));
    }

    @PostMapping("/custom")
    public ResponseEntity<ApiResponse<Word>> createCustomWord(@RequestBody Word customWord, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        return ResponseEntity.ok(ApiResponse.ok(wordService.createCustomWord(d.getUserId(), customWord)));
    }

    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<Word>> addRecommendedWord(@RequestBody java.util.Map<String, String> request, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        String word = request.get("word");
        return ResponseEntity.ok(ApiResponse.ok(wordService.addRecommendedWord(d.getUserId(), word)));
    }

    @PostMapping("/{id}/postpone")
    public ResponseEntity<ApiResponse<Void>> postponeWord(@PathVariable UUID id, Authentication auth) {
        JwtUserDetails d = (JwtUserDetails) auth.getDetails();
        wordService.postponeWord(d.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
