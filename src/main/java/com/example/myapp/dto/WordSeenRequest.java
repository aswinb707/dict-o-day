package com.example.myapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class WordSeenRequest {

    @NotNull(message = "Word ID is required")
    private UUID wordId;
}
