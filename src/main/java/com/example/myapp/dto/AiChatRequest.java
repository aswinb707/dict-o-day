package com.example.myapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class AiChatRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private UUID wordId; // optional context: which word this chat is about
}
