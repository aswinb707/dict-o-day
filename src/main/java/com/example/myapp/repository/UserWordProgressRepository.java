package com.example.myapp.repository;

import com.example.myapp.entity.UserWordProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserWordProgressRepository extends JpaRepository<UserWordProgress, UUID> {

    List<UserWordProgress> findByUserId(UUID userId);

    Optional<UserWordProgress> findByUserIdAndWordId(UUID userId, UUID wordId);

    List<UserWordProgress> findByUserIdAndStatus(UUID userId, String status);

    long countByUserIdAndStatus(UUID userId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM UserWordProgress p WHERE p.userId = :userId AND p.postponedUntil IS NOT NULL AND p.postponedUntil <= :today")
    List<UserWordProgress> findDuePostponed(@org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("today") java.time.LocalDate today);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM UserWordProgress p WHERE p.userId = :userId AND p.postponedUntil IS NOT NULL ORDER BY p.postponedUntil ASC")
    List<UserWordProgress> findPostponed(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
