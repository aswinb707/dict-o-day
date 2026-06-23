package com.example.myapp.security;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class JwtUserDetails {
    private UUID userId;
    private String email;
}
