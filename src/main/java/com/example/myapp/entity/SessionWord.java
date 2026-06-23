package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "session_words")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "word_id", nullable = false)
    private UUID wordId;

    @Column(length = 30)
    private String mode; // "learn" or "test"

    @Column(name = "answered_correct")
    private Boolean answeredCorrect;

    @Column(name = "time_taken_ms")
    private Integer timeTakenMs;
}
