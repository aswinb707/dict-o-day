package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_word_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWordProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "word_id", nullable = false)
    private UUID wordId;

    @Column(length = 30)
    @Builder.Default
    private String status = "new"; // new, learning, mastered

    @Column(name = "times_seen")
    @Builder.Default
    private Integer timesSeen = 0;

    @Column(name = "times_correct")
    @Builder.Default
    private Integer timesCorrect = 0;

    @Column(name = "mastery_score")
    @Builder.Default
    private Double masteryScore = 0.0;

    @CreationTimestamp
    @Column(name = "first_seen_at", updatable = false)
    private LocalDateTime firstSeenAt;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    @Column(name = "mastered_at")
    private LocalDateTime masteredAt;

    @Column(name = "postponed_until")
    private java.time.LocalDate postponedUntil;

    @Transient
    private Word word;
}
