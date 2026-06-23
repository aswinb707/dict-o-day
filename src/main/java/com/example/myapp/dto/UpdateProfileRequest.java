package com.example.myapp.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String difficulty;     // beginner, intermediate, advanced
    private Integer wordCount;     // max 15
}
