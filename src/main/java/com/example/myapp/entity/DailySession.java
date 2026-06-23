package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "words_learned")
    @Builder.Default
    private Integer wordsLearned = 0;

    @Column(name = "words_tested")
    @Builder.Default
    private Integer wordsTested = 0;

    @Builder.Default
    private Integer score = 0;

    @Builder.Default
    private Boolean completed = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
