package com.example.myapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SubmitAnswerRequest {

    @NotNull(message = "Word ID is required")
    private UUID wordId;

    @NotNull(message = "Answer is required")
    private String answer;

    private Integer timeTakenMs;
}
