package com.example.myapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartTestRequest {

    @NotBlank(message = "Test type is required")
    private String type; // "fill_blanks" or "multiple_choice"
}
