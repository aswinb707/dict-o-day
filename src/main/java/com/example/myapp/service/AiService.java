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
        String apiUserMessage = userMessage;
        if (wordId != null) {
            try {
                Word word = wordService.getWordById(wordId);
                apiUserMessage = userMessage + "\n\n(Context reminder: Active focus word is \"" + word.getWord() + "\". Keep answers short and sweet unless asked for an enlarged/detailed explanation. If the query is unrelated, try to make a connection or sentence using BOTH words, but do not change the topic or explain the other word. If no connection can be made, reply: \"The query/word is not related to the focus word \\\"" + word.getWord() + "\\\".\")";
            } catch (Exception e) {
                // ignore
            }
        }
        messages.add(Map.of("role", "user", "content", apiUserMessage));

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

    public List<String> suggestWordsJson(UUID userId) {
        return suggestWordsJson(userId, 5);
    }

    public List<String> suggestWordsJson(UUID userId, int count) {
        List<Map<String, String>> messages = List.of(
            Map.of("role", "system", "content", 
                "You are an expert IELTS vocabulary coach. Generate a list of exactly " + count + " advanced IELTS/interview-level English vocabulary words suitable for the user to learn next.\n" +
                "Provide a JSON response with a single key \"words\" mapping to a JSON array of exactly " + count + " lowercase string words.\n" +
                "Ensure the output is valid JSON and nothing else. No markdown formatting outside of JSON. Example: {\"words\": [\"ubiquitous\", \"ephemeral\", \"pragmatic\"]}")
        );
        String aiResponse = callGroqApi(messages);
        try {
            JsonNode root = objectMapper.readTree(aiResponse);
            JsonNode wordsNode = root.path("words");
            List<String> list = new ArrayList<>();
            if (wordsNode.isArray()) {
                for (JsonNode n : wordsNode) {
                    list.add(n.asText());
                }
            }
            return list;
        } catch (Exception e) {
            log.error("Failed to parse suggested words JSON: {}", e.getMessage());
            List<String> defaults = List.of("meticulous", "ubiquitous", "pragmatic", "resilient", "ambiguous", "transient", "tenacious", "eloquent", "spurious", "implausible");
            return defaults.subList(0, Math.min(count, defaults.size()));
        }
    }

    public String evaluateSpeakingAnswer(String question, String answer) {
        List<Map<String, String>> messages = List.of(
            Map.of("role", "system", "content", 
                "You are an expert IELTS speaking evaluator. Analyze the user's spoken answer to the question.\n" +
                "Provide a JSON response with the following keys:\n" +
                "1. \"feedback\": Concise, helpful, constructive feedback (max 2-3 sentences). Highlight how their answer is.\n" +
                "2. \"professionalWords\": A JSON array of exactly 2 to 3 advanced/professional vocabulary alternatives that fit well in this context to replace simpler words.\n" +
                "3. \"bandScore\": An estimated IELTS band score for this answer (decimal between 1.0 and 9.0).\n\n" +
                "Ensure the output is valid JSON and nothing else. No markdown formatting outside of JSON."),
            Map.of("role", "user", "content", 
                "Question: " + question + "\nAnswer: " + answer)
        );
        return callGroqApi(messages);
    }

    public String generateWordDetailsWithAi(String wordName) {
        List<Map<String, String>> messages = List.of(
            Map.of("role", "system", "content",
                "You are an expert IELTS vocabulary coach. Generate dictionary details for the word: \"" + wordName + "\".\n" +
                "Determine if the word is an advanced IELTS/interview-level vocabulary word (e.g. ubiquitous, ephemeral, resilient, pragmatic, etc.).\n" +
                "If it IS an advanced IELTS-level word:\n" +
                "- Set \"isIeltsLevel\" to true.\n" +
                "- Set \"fusedWord\", \"fusedDefinition\", \"fusedPronunciation\", and \"fusedSentence\" to null.\n" +
                "If it is NOT an advanced IELTS-level word (e.g. it is a simple everyday word like \"apple\", \"water\", \"car\", \"happy\"):\n" +
                "- Set \"isIeltsLevel\" to false.\n" +
                "- Generate a highly related, advanced IELTS-level word for \"fusedWord\" (e.g., for \"apple\", generate \"orchard\" or \"pome\"; for \"water\", generate \"aquatic\" or \"hydrate\"; for \"car\", generate \"automotive\"; for \"happy\", generate \"jubilant\" or \"ecstatic\").\n" +
                "- Fill in \"fusedWord\" with this advanced word, \"fusedDefinition\" with its definition, \"fusedPronunciation\" with its phonetic spelling, and \"fusedSentence\" with an example sentence containing this advanced word.\n\n" +
                "Provide a JSON response with the following keys:\n" +
                "1. \"word\": The exact word requested.\n" +
                "2. \"partOfSpeech\": Part of speech of the requested word (e.g. \"adjective\", \"noun\", \"verb\").\n" +
                "3. \"definition\": Clear definition of the requested word.\n" +
                "4. \"pronunciation\": Phonetic spelling of the requested word.\n" +
                "5. \"inASentence\": An example sentence using the requested word.\n" +
                "6. \"examples\": A JSON array of 2 more example sentences for the requested word.\n" +
                "7. \"synonyms\": Comma-separated synonyms of the requested word.\n" +
                "8. \"antonyms\": Comma-separated antonyms of the requested word.\n" +
                "9. \"isIeltsLevel\": Boolean (true/false).\n" +
                "10. \"fusedWord\": The advanced related IELTS word (or null).\n" +
                "11. \"fusedDefinition\": Definition of the advanced word (or null).\n" +
                "12. \"fusedPronunciation\": Phonetic spelling of the advanced word (or null).\n" +
                "13. \"fusedSentence\": Example sentence using the advanced word (or null).\n\n" +
                "Ensure the output is valid JSON and nothing else. No markdown formatting outside of JSON."),
            Map.of("role", "user", "content", "Word: " + wordName)
        );
        return callGroqApi(messages);
    }    private String buildSystemPrompt(UUID wordId) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are Dict-o-Day AI Tutor, an expert English language teacher. ");
        sb.append("Help users learn vocabulary, grammar, and pronunciation for competitive exams and interviews.\n\n");
        
        sb.append("CRITICAL GUARDRAILS:\n");
        sb.append("1. INAPPROPRIATE CONTENT: If the user query is inappropriate, offensive, vulgar, profane, or harmful, you must refuse to answer. ");
        sb.append("Simply state: \"I'm sorry, but I cannot answer inappropriate or offensive queries. Let's keep our session focused on learning English.\"\n");
        sb.append("2. CODING REQUESTS: Never generate programming code or software scripts. If asked for code, refuse politely: \"I am an English vocabulary and grammar tutor. I cannot write code, but I can help you define programming-related terms!\"\n");

        if (wordId != null) {
            try {
                Word word = wordService.getWordById(wordId);
                sb.append("3. ACTIVE WORD CONTEXT FOCUS:\n");
                sb.append("You are in a strict focus learning session for the word: \"").append(word.getWord()).append("\".\n");
                sb.append("Your response MUST relate strictly to this word.\n");
                sb.append("- Short & Sweet: By default, keep your answers short and sweet (1-3 sentences max) to avoid boring the user. For example, if asked to put the word in a sentence, give a single sentence using the focus word and explain how it is used.\n");
                sb.append("- Enlarged Answers: Only provide a detailed, larger, or enlarged explanation if the user explicitly asks for an enlarged or detailed explanation.\n");
                sb.append("- Unrelated Queries & Connections: If the user inputs an unrelated word or concept (e.g. 'apple' when the focus word is 'resilient'), do not change the topic or explain the unrelated word. Instead, check if you can make a connection or write a sentence using BOTH the unrelated word and the focus word to answer. If a connection/sentence is possible, do so, but keep the focus on the focus word. If absolutely no connection can be made, or it is completely unrelated, you must respond exactly: 'The query/word is not related to the focus word \"").append(word.getWord()).append("\".'\n\n");
                
                sb.append("Focus Word Details:\n");
                sb.append("Word: ").append(word.getWord()).append("\n");
                sb.append("Definition: ").append(word.getDefinition()).append("\n");
                sb.append("Part of Speech: ").append(word.getPartOfSpeech()).append("\n");
                sb.append("Example: ").append(word.getInASentence()).append("\n");
                if (word.getExamples() != null) {
                    sb.append("More examples: ").append(String.join(", ", word.getExamples())).append("\n");
                }
                if (word.getFusedWord() != null) {
                    sb.append("Related IELTS Word: \"").append(word.getFusedWord()).append("\".\n");
                    sb.append("Related IELTS Word Definition: ").append(word.getFusedDefinition()).append("\n");
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
